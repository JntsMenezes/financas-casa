// Lembretes diários: avisa no celular as despesas sem check que vencem hoje e amanhã.
// Chamada pelo pg_cron uma vez por dia, com o segredo no cabeçalho x-cron-segredo.
// Segredos da função: VAPID_PUBLICA, VAPID_PRIVADA, CRON_SEGREDO.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const APP = "https://jntsmenezes.github.io/financas-casa/";
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
// Só serviços de push conhecidos (o banco também confere ao gravar).
const PUSH_OK = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)\//;
const dia = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-segredo") !== Deno.env.get("CRON_SEGREDO")) {
    return new Response("não autorizado", { status: 401 });
  }
  webpush.setVapidDetails(APP, Deno.env.get("VAPID_PUBLICA")!, Deno.env.get("VAPID_PRIVADA")!);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const hoje = dia(new Date());
  const amanha = dia(new Date(Date.now() + 864e5));
  const { data: contas, error } = await sb.from("lancamentos")
    .select("casa_id, descricao, valor, data")
    .eq("tipo", "despesa").eq("pago", false).in("data", [hoje, amanha])
    .order("valor", { ascending: false });
  if (error) return Response.json({ erro: error.message }, { status: 500 });

  const porCasa = new Map<string, typeof contas>();
  for (const c of contas ?? []) {
    if (!porCasa.has(c.casa_id)) porCasa.set(c.casa_id, []);
    porCasa.get(c.casa_id)!.push(c);
  }
  if (!porCasa.size) return Response.json({ casas: 0, enviados: 0 });

  const { data: inscricoes, error: eIns } = await sb.from("push_inscricoes").select("*").in("casa_id", [...porCasa.keys()]);
  if (eIns) {
    console.error("lembretes: leitura das inscrições", eIns);
    return Response.json({ erro: eIns.message }, { status: 500 });
  }
  let enviados = 0, removidos = 0, falhas = 0;

  for (const ins of inscricoes ?? []) {
    if (!PUSH_OK.test(ins.endpoint)) { falhas++; console.error("lembretes: endpoint fora da lista", new URL(ins.endpoint).host); continue; }
    const lista = porCasa.get(ins.casa_id)!;
    const linha = (quando: string) => {
      const itens = lista.filter((c) => c.data === quando);
      if (!itens.length) return "";
      const mostrar = itens.slice(0, 3).map((c) => `${c.descricao} ${brl.format(Number(c.valor))}`).join(" · ");
      return `${quando === hoje ? "Hoje" : "Amanhã"}: ${mostrar}${itens.length > 3 ? ` e mais ${itens.length - 3}` : ""}`;
    };
    const total = lista.reduce((s, c) => s + Number(c.valor), 0);
    const corpo = [linha(hoje), linha(amanha)].filter(Boolean).join("\n");
    const payload = JSON.stringify({
      title: `${lista.length === 1 ? "1 conta vence" : `${lista.length} contas vencem`} até amanhã · ${brl.format(total)}`,
      body: corpo,
      url: APP,
    });
    try {
      await webpush.sendNotification({ endpoint: ins.endpoint, keys: { p256dh: ins.p256dh, auth: ins.auth } }, payload, { timeout: 10000, TTL: 3600 });
      enviados++;
    } catch (e) {
      // Celular desinstalou o app ou tirou a permissão: a inscrição não vale mais.
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        const { error: eDel } = await sb.from("push_inscricoes").delete().eq("endpoint", ins.endpoint);
        if (eDel) console.error("lembretes: apagar inscrição vencida", eDel); else removidos++;
      } else {
        falhas++;
        console.error("lembretes: envio falhou", status, (e as Error).message, new URL(ins.endpoint).host);
      }
    }
  }
  // Tudo falhou: responde erro para aparecer nos registros do agendamento.
  return Response.json({ casas: porCasa.size, enviados, removidos, falhas }, { status: falhas && !enviados ? 500 : 200 });
});
