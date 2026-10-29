// Avisos no celular, chamados pelo pg_cron com o segredo no cabeçalho x-cron-segredo.
//   corpo {} ou {"tipo":"lembretes"}: todo dia, despesas sem check que vencem hoje e amanhã.
//   corpo {"tipo":"resumo"}: domingo à noite, como foi a semana e o que vem na próxima.
//   corpo {"tipo":"pedido"}: chamado pelo gatilho de pedidos_casa; avisa só os celulares do admin.
//   "seco": true monta as mensagens e devolve, sem mandar nada (para testar).
// Segredos da função: VAPID_PUBLICA, VAPID_PRIVADA, CRON_SEGREDO.
import webpush from "npm:web-push@3.6.7";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

const APP = "https://jntsmenezes.github.io/financas-casa/";
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
// Valor redondo para o resumo: "R$ 820" em vez de "R$ 819,74".
const redondo = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
// Só serviços de push conhecidos (o banco também confere ao gravar).
const PUSH_OK = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)\//;
const dia = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
const somarDias = (s: string, n: number) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const diaSemana = (s: string) => SEMANA[new Date(s + "T12:00:00Z").getUTCDay()];
// Mesmos nomes de categoria do app.
const CATEGORIA: Record<string, string> = {
  casa: "Casa e contas", mercado: "Mercado", transporte: "Transporte", carro: "Carro", educacao: "Educação",
  saude: "Saúde", assinaturas: "Assinaturas", dividas: "Empréstimos e cartões", lazer: "Presentes e lazer", outros: "Outros",
};

type Lanc = { casa_id: string; descricao: string; valor: number; data: string; tipo: string; pago: boolean; categoria: string | null; caixinha_id: string | null };
type Aviso = { title: string; body: string; url: string };

async function lembretes(sb: SupabaseClient): Promise<Map<string, Aviso>> {
  const hoje = dia(new Date());
  const amanha = dia(new Date(Date.now() + 864e5));
  const { data: contas, error } = await sb.from("lancamentos")
    .select("casa_id, descricao, valor, data")
    .eq("tipo", "despesa").eq("pago", false).in("data", [hoje, amanha])
    .order("valor", { ascending: false });
  if (error) throw error;
  const porCasa = new Map<string, typeof contas>();
  for (const c of contas ?? []) {
    if (!porCasa.has(c.casa_id)) porCasa.set(c.casa_id, []);
    porCasa.get(c.casa_id)!.push(c);
  }
  const avisos = new Map<string, Aviso>();
  for (const [casa, lista] of porCasa) {
    const linha = (quando: string) => {
      const itens = lista!.filter((c) => c.data === quando);
      if (!itens.length) return "";
      const mostrar = itens.slice(0, 3).map((c) => `${c.descricao} ${brl.format(Number(c.valor))}`).join(" · ");
      return `${quando === hoje ? "Hoje" : "Amanhã"}: ${mostrar}${itens.length > 3 ? ` e mais ${itens.length - 3}` : ""}`;
    };
    const total = lista!.reduce((s, c) => s + Number(c.valor), 0);
    avisos.set(casa, {
      title: `${lista!.length === 1 ? "1 conta vence" : `${lista!.length} contas vencem`} até amanhã · ${brl.format(total)}`,
      body: [linha(hoje), linha(amanha)].filter(Boolean).join("\n"),
      url: APP,
    });
  }
  return avisos;
}

// A semana que fecha hoje (segunda a domingo) comparada com a média das semanas anteriores,
// e o que vem na próxima: quanto vence e o dia mais apertado.
async function resumo(sb: SupabaseClient): Promise<Map<string, Aviso>> {
  const hoje = dia(new Date());
  const ini = somarDias(hoje, -((new Date(hoje + "T12:00:00Z").getUTCDay() + 6) % 7)); // segunda desta semana
  const fimProx = somarDias(ini, 13);
  const todos: Lanc[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from("lancamentos")
      .select("casa_id, descricao, valor, data, tipo, pago, categoria, caixinha_id")
      .lte("data", fimProx).order("data").range(de, de + 999);
    if (error) throw error;
    todos.push(...(data as Lanc[]));
    if (data.length < 1000) break;
  }
  const porCasa = new Map<string, Lanc[]>();
  for (const l of todos) { if (!porCasa.has(l.casa_id)) porCasa.set(l.casa_id, []); porCasa.get(l.casa_id)!.push(l); }

  // Casa de uma pessoa só ("Só eu" e ninguém mais entrou): o resumo fala com "você".
  const { data: cs, error: eCs } = await sb.from("casas").select("id, so_eu");
  if (eCs) throw eCs;
  const { data: ms, error: eMs } = await sb.from("membros").select("casa_id");
  if (eMs) throw eMs;
  const pessoas = new Map<string, number>();
  for (const m of ms ?? []) pessoas.set(m.casa_id, (pessoas.get(m.casa_id) || 0) + 1);
  const sozinha = new Set((cs ?? []).filter((c) => c.so_eu && (pessoas.get(c.id) || 0) < 2).map((c) => c.id as string));

  const avisos = new Map<string, Aviso>();
  for (const [casa, ls] of porCasa) {
    const gasto = (l: Lanc) => l.tipo === "despesa" && !l.caixinha_id;
    const daSemana = ls.filter((l) => l.data >= ini && l.data <= hoje);
    if (!daSemana.length) continue;
    const gastos = daSemana.filter(gasto).reduce((s, l) => s + Number(l.valor), 0);
    const guardou = daSemana.reduce((s, l) => s + (l.caixinha_id ? (l.tipo === "despesa" ? 1 : -1) * Number(l.valor) : 0), 0);

    // Média das até 8 semanas anteriores que tiveram algum lançamento.
    const semanas: number[] = [];
    for (let k = 1; k <= 8; k++) {
      const a = somarDias(ini, -7 * k), b = somarDias(a, 6);
      const doPeriodo = ls.filter((l) => l.data >= a && l.data <= b);
      if (doPeriodo.length) semanas.push(doPeriodo.filter(gasto).reduce((s, l) => s + Number(l.valor), 0));
    }
    const media = semanas.length >= 2 ? semanas.reduce((a, b) => a + b, 0) / semanas.length : null;

    // Para onde foi a maior parte.
    const porCat = new Map<string, number>();
    for (const l of daSemana.filter(gasto)) {
      const k = l.categoria && CATEGORIA[l.categoria] ? CATEGORIA[l.categoria] : l.descricao;
      porCat.set(k, (porCat.get(k) || 0) + Number(l.valor));
    }
    const maior = [...porCat.entries()].sort((a, b) => b[1] - a[1])[0];

    // Próxima semana: o que vence sem check e o saldo dia a dia (conta tudo, como o app).
    const proxIni = somarDias(ini, 7);
    const vence = ls.filter((l) => gasto(l) && !l.pago && l.data >= proxIni && l.data <= fimProx).reduce((s, l) => s + Number(l.valor), 0);
    let saldo = ls.filter((l) => l.data < proxIni).reduce((s, l) => s + (l.tipo === "receita" ? 1 : -1) * Number(l.valor), 0);
    let apertado: { data: string; saldo: number } | null = null;
    for (let d = proxIni; d <= fimProx; d = somarDias(d, 1)) {
      for (const l of ls) if (l.data === d) saldo += (l.tipo === "receita" ? 1 : -1) * Number(l.valor);
      if (!apertado || saldo < apertado.saldo) apertado = { data: d, saldo };
    }

    const titulo = `Na semana, ${redondo.format(gastos)} em gastos` +
      (media !== null && Math.abs(gastos - media) >= 20
        ? `, ${redondo.format(Math.abs(gastos - media))} ${gastos < media ? "a menos" : "a mais"} que a média`
        : media !== null ? ", perto da média" : "");
    const linhas = [
      maior && gastos > 0 ? `Mais foi para ${maior[0]} (${redondo.format(maior[1])}).` : "",
      guardou > 0 ? `${sozinha.has(casa) ? "Você guardou" : "Vocês guardaram"} ${redondo.format(guardou)}.` : "",
      vence > 0 ? `Na próxima semana vencem ${redondo.format(vence)}.` : "Na próxima semana não vence nada sem check.",
      apertado && apertado.saldo < 0
        ? `O saldo fica negativo na ${diaSemana(apertado.data)} ${Number(apertado.data.slice(8))}: ${brl.format(apertado.saldo)}.`
        : apertado && apertado.saldo < 300 ? `O dia mais apertado é ${diaSemana(apertado.data)} ${Number(apertado.data.slice(8))}, com ${redondo.format(apertado.saldo)}.` : "",
    ].filter(Boolean);
    avisos.set(casa, { title: titulo, body: linhas.join(" "), url: APP });
  }
  return avisos;
}

// Pedido de casa esperando: uma mensagem para cada casa onde o admin tem celular inscrito.
async function pedidos(sb: SupabaseClient): Promise<{ avisos: Map<string, Aviso>; admins: string[] }> {
  const avisos = new Map<string, Aviso>();
  const { data: adm, error: eAdm } = await sb.from("admins").select("user_id");
  if (eAdm) throw eAdm;
  const admins = (adm ?? []).map((a) => a.user_id as string);
  if (!admins.length) return { avisos, admins };
  const { data: ped, error: ePed } = await sb.from("pedidos_casa").select("nome, email").eq("status", "pendente").order("criado_em", { ascending: false });
  if (ePed) throw ePed;
  if (!ped?.length) return { avisos, admins };
  const quem = ped[0].nome || ped[0].email || "Alguém";
  const aviso: Aviso = {
    title: ped.length > 1 ? `${ped.length} pedidos de casa esperando` : "Pedido de casa",
    body: ped.length > 1 ? `O mais recente é de ${quem}. Toque para aprovar ou recusar.` : `${quem} pediu uma casa. Toque para aprovar ou recusar.`,
    url: APP + "#admin",
  };
  const { data: ins, error: eIns } = await sb.from("push_inscricoes").select("casa_id").in("user_id", admins);
  if (eIns) throw eIns;
  for (const i of ins ?? []) avisos.set(i.casa_id, aviso);
  return { avisos, admins };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-segredo") !== Deno.env.get("CRON_SEGREDO")) {
    return new Response("não autorizado", { status: 401 });
  }
  const corpo = await req.json().catch(() => ({})) as { tipo?: string; seco?: boolean };
  const tipo = corpo.tipo === "resumo" ? "resumo" : corpo.tipo === "pedido" ? "pedido" : "lembretes";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let avisos: Map<string, Aviso>;
  let admins: string[] = [];
  try {
    if (tipo === "pedido") ({ avisos, admins } = await pedidos(sb));
    else avisos = tipo === "resumo" ? await resumo(sb) : await lembretes(sb);
  }
  catch (e) {
    console.error(`${tipo}: montagem`, e);
    return Response.json({ erro: (e as Error).message }, { status: 500 });
  }
  if (corpo.seco) return Response.json({ tipo, casas: avisos.size, avisos: [...avisos.values()] });
  if (!avisos.size) return Response.json({ tipo, casas: 0, enviados: 0 });

  let q = sb.from("push_inscricoes").select("*").in("casa_id", [...avisos.keys()]);
  if (tipo === "resumo") q = q.eq("resumo", true);
  if (tipo === "pedido") q = q.in("user_id", admins);
  const { data: inscricoes, error: eIns } = await q;
  if (eIns) {
    console.error(`${tipo}: leitura das inscrições`, eIns);
    return Response.json({ erro: eIns.message }, { status: 500 });
  }
  webpush.setVapidDetails(APP, Deno.env.get("VAPID_PUBLICA")!, Deno.env.get("VAPID_PRIVADA")!);
  let enviados = 0, removidos = 0, falhas = 0;

  for (const ins of inscricoes ?? []) {
    if (!PUSH_OK.test(ins.endpoint)) { falhas++; console.error(`${tipo}: endpoint fora da lista`, new URL(ins.endpoint).host); continue; }
    try {
      await webpush.sendNotification({ endpoint: ins.endpoint, keys: { p256dh: ins.p256dh, auth: ins.auth } }, JSON.stringify(avisos.get(ins.casa_id)), { timeout: 10000, TTL: 3600 * 12 });
      enviados++;
    } catch (e) {
      // Celular desinstalou o app ou tirou a permissão: a inscrição não vale mais.
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        const { error: eDel } = await sb.from("push_inscricoes").delete().eq("endpoint", ins.endpoint);
        if (eDel) console.error(`${tipo}: apagar inscrição vencida`, eDel); else removidos++;
      } else {
        falhas++;
        console.error(`${tipo}: envio falhou`, status, (e as Error).message, new URL(ins.endpoint).host);
      }
    }
  }
  // Tudo falhou: responde erro para aparecer nos registros do agendamento.
  return Response.json({ tipo, casas: avisos.size, enviados, removidos, falhas }, { status: falhas && !enviados ? 500 : 200 });
});
