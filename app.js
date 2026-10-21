"use strict";

const cfg = window.FIN_CONFIG || {};
const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (id) => document.getElementById(id);
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const nomeDia = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
const nomeDoMes = (mes) => new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(deIso(mes.slice(0, 7) + "-01"));
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const IC = {
  check: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  baixo: '<svg class="ic" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  ir: '<svg class="ic ir" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
  alerta: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>',
  repetir: '<svg class="ic" viewBox="0 0 24 24"><path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 015-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 01-5 5H4"/></svg>',
  mais: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};

// ---------- categorias ----------

const svg = (d) => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`;
const CATS = {
  despesa: [
    ["casa", "Casa e contas", '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>'],
    ["mercado", "Mercado", '<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M3 4h2.2l2.4 11h10.6l2-8H6.3"/>'],
    ["transporte", "Transporte", '<rect x="5" y="3.5" width="14" height="14" rx="2.5"/><path d="M5 11h14M8 20.5v-3M16 20.5v-3M8.5 14.5h.01M15.5 14.5h.01"/>'],
    ["carro", "Carro", '<path d="M4 15l1.6-5.2a2 2 0 011.9-1.4h9a2 2 0 011.9 1.4L20 15"/><rect x="3" y="15" width="18" height="4" rx="1.5"/><path d="M6.5 19v1.5M17.5 19v1.5"/>'],
    ["educacao", "Educação", '<path d="M4 19.5V5a2 2 0 012-2h14v16H6a2 2 0 00-2 2.5z"/><path d="M8 7.5h8"/>'],
    ["saude", "Saúde", '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>'],
    ["assinaturas", "Assinaturas", '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'],
    ["dividas", "Empréstimos e cartões", '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'],
    ["lazer", "Presentes e lazer", '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-1.5-3.5-5.5-3.5-5.5-1S10 9 12 9zm0 0c1.5-3.5 5.5-3.5 5.5-1S14 9 12 9z"/>'],
    ["outros", "Outros", '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>'],
  ],
  receita: [
    ["salario", "Salário e benefícios", '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 12.5h18"/>'],
    ["extra", "Renda extra", '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'],
    ["reembolso", "Reembolsos e estornos", '<path d="M3 12a9 9 0 103-6.7L3 8"/><path d="M3 3v5h5"/>'],
    ["emprestimo", "Empréstimos recebidos", '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 10v5h5"/>'],
    ["ajuste", "Saldo e ajustes", '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>'],
    ["outros", "Outros", '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>'],
  ],
};
const catInfo = (tipo, chave) => {
  const c = CATS[tipo].find((x) => x[0] === chave) || CATS[tipo][CATS[tipo].length - 1];
  return { chave: c[0], nome: c[1], icone: svg(c[2]) };
};

// A ordem importa: "Carregar carro" é carro antes de ser transporte.
const REGRAS = {
  despesa: [
    [/aluguel|agua|energia|\bluz\b|internet|condominio|\bgas\b|celular|iptu/, "casa"],
    [/mercado|feira|padaria|acougue|hortifruti|atacad/, "mercado"],
    [/multa|carro|byd|ipva|combust|gasolina|sem parar|estaciona|oficina|pedagio/, "carro"],
    [/transporte|onibus|blablacar|metro|locomo|uber|\b99\b/, "transporte"],
    [/escola|faculdade|curso|material escolar|mensalidade/, "educacao"],
    [/fono|medic|farmacia|remedio|dentista|consulta|exame|plano de saude|terapia|psico/, "saude"],
    [/spotify|netflix|crunchyroll|prime|disney|hbo|\bmax\b|youtube|icloud|assinatura|globoplay|deezer/, "assinaturas"],
    [/emprestimo|fatura|cartao|nubank|picpay|divida|pagamento|parcela/, "dividas"],
    [/presente|niver|aniversario|almoco|jantar|restaurante|lanche|cinema|perfume|festa|viagem|passeio|ifood/, "lazer"],
  ],
  receita: [
    [/salario|decimo|\bvale\b|ferias|ticket|beneficio|\bplr\b/, "salario"],
    [/reembolso|estorno|devolu/, "reembolso"],
    [/emprestimo/, "emprestimo"],
    [/saldo|ajuste/, "ajuste"],
    [/uber|\b99\b|freela|corrida|venda|pagamento|bico|extra/, "extra"],
  ],
};
const normalizar = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function adivinharCategoria(descricao, tipo) {
  const d = normalizar(descricao);
  const aprendida = estado.aprendidas.get(tipo + "|" + d);
  if (aprendida) return aprendida;
  for (const [re, cat] of REGRAS[tipo]) if (re.test(d)) return cat;
  return "outros";
}
const categoriaDe = (l) => (l.categoria && CATS[l.tipo].some((c) => c[0] === l.categoria) ? l.categoria : adivinharCategoria(l.descricao, l.tipo));

const estado = {
  sessao: null,
  casa: null,
  lancs: [],
  saldoApos: new Map(),
  mes: null, // "AAAA-MM"
  filtro: "todos",
  verPassado: false,
  editando: null,
  canal: null,
  membros: new Map(), // user_id -> { nome, email }
  histGrupos: [],
  aprendidas: new Map(), // "tipo|descrição" -> categoria escolhida por vocês
  temCategoria: false,   // banco já tem a coluna categoria (03_categorias_series.sql)
  seriesDb: null,        // grupo -> linha da tabela series; null se a tabela não existe
  limites: null,         // categoria de despesa -> limite mensal; null se a tabela não existe
  pendentes: new Set(),  // ids esperando internet
  filtroCat: null,
  categoriaSel: null,
};

// ---------- datas e números ----------

function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hoje() { return iso(new Date()); }
function deIso(s) { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); }
function somarMeses(s, n) {
  const [a, m, d] = s.split("-").map(Number);
  const alvo = new Date(a, m - 1 + n, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d, ultimo));
  return iso(alvo);
}
function somarDias(s, n) { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); }
function fimDoMes(mes) { const [a, m] = mes.split("-").map(Number); return iso(new Date(a, m, 0)); }
function dataCurta(s) { return s.slice(8, 10) + "/" + s.slice(5, 7); }
function dataMedia(s) { return dataCurta(s) + "/" + s.slice(2, 4); }
function mesCurto(s) { return MESES[Number(s.slice(5, 7)) - 1] + "/" + s.slice(2, 4); }
const fmtQuando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
function quando(ts) { return fmtQuando.format(new Date(ts)).replace(",", " às"); }

function lerValor(txt) {
  let s = String(txt).trim().replace(/[R$\s]/g, "");
  if (!s) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}
function mostrarValor(n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
const sinal = (l) => (l.tipo === "receita" ? 1 : -1) * Number(l.valor);
const r2 = (n) => Math.round(n * 100) / 100;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const vibrar = (ms = 8) => { try { navigator.vibrate?.(ms); } catch (e) {} };

// Aviso no rodapé; com `desfazer`, mostra o botão por 5 segundos.
let toastTimer;
function avisar(msg, desfazer) {
  const t = $("toast"), b = $("toast-acao");
  $("toast-txt").textContent = msg;
  b.hidden = !desfazer;
  b.onclick = desfazer ? async () => {
    t.classList.remove("visivel");
    try { await desfazer(); await carregar(); avisar("Desfeito."); } catch (e) { avisar(msgErro(e)); }
  } : null;
  t.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visivel"), desfazer ? 5000 : 2600);
}

function msgErro(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada).";
  if (/User already registered/i.test(m)) return "Esse e-mail já tem conta. Use \"Entrar\".";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Sem internet. Tente de novo quando conectar.";
  return m;
}

// Grava de volta linhas inteiras (usado para desfazer e restaurar).
async function regravar(linhas) {
  if (!linhas.length) return;
  const { error } = await sb.from("lancamentos").upsert(linhas.map((l) => ({ ...l })));
  if (error) throw error;
}
async function apagarIds(ids) {
  if (!ids.length) return;
  const { error } = await sb.from("lancamentos").delete().in("id", ids);
  if (error) throw error;
}

// ---------- telas ----------

function mostrarTela(id) {
  for (const t of ["tela-login", "tela-nova-senha", "tela-casa", "tela-app"]) $(t).hidden = t !== id;
  $("fab").hidden = id !== "tela-app";
}

async function iniciar() {
  if (!cfg.supabaseUrl || cfg.supabaseUrl.includes("COLE")) {
    document.body.innerHTML = '<div class="tela-centro"><div class="caixa"><h1>Falta configurar</h1><p>Preencha a URL e a chave do Supabase em config.js.</p></div></div>';
    return;
  }
  sb.auth.onAuthStateChange((evento, sessao) => {
    if (evento === "PASSWORD_RECOVERY") { mostrarTela("tela-nova-senha"); return; }
    const antes = estado.sessao?.user?.id;
    estado.sessao = sessao;
    if (evento === "SIGNED_OUT") { sairLimpo(); return; }
    if (evento === "SIGNED_IN" && antes !== sessao?.user?.id) setTimeout(abrirCasa, 0);
  });
  const { data } = await sb.auth.getSession();
  estado.sessao = data.session;
  if (!estado.sessao) { mostrarTela("tela-login"); return; }
  await abrirCasa();
}

function sairLimpo() {
  limparCache();
  if (estado.canal) { sb.removeChannel(estado.canal); estado.canal = null; }
  estado.casa = null;
  estado.lancs = [];
  fecharPaineis();
  mostrarTela("tela-login");
}

// Última cópia dos dados no aparelho: abre na hora e funciona sem internet (só leitura).
const CHAVE_CACHE = "fin-cache-v1";
function lerCache() {
  try { const c = JSON.parse(localStorage.getItem(CHAVE_CACHE)); return c && c.user === estado.sessao?.user?.id ? c : null; } catch (e) { return null; }
}
function gravarCache() {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify({
      user: estado.sessao?.user?.id, casa: estado.casa, lancs: estado.lancs, membros: [...estado.membros.entries()],
      series: estado.seriesDb ? [...estado.seriesDb.entries()] : null,
      limites: estado.limites ? [...estado.limites.entries()] : null, quando: Date.now(),
    }));
  } catch (e) { /* armazenamento cheio ou bloqueado: segue sem cache */ }
}
function limparCache() { try { localStorage.removeItem(CHAVE_CACHE); } catch (e) {} }

async function abrirCasa() {
  if (!estado.sessao) { mostrarTela("tela-login"); return; }
  estado.mes = estado.mes || hoje().slice(0, 7);
  const cache = lerCache();
  if (cache) {
    estado.casa = cache.casa;
    estado.membros = new Map(cache.membros);
    estado.seriesDb = cache.series ? new Map(cache.series) : null;
    estado.limites = cache.limites ? new Map(cache.limites) : null;
    mostrarTela("tela-app");
    definirLancs(aplicarFila(cache.lancs));
  }
  const { data, error } = await sb.from("membros").select("casa_id, casas(id, nome, codigo)").limit(1);
  if (error) {
    if (cache) { avisar(`Sem internet. Mostrando os dados de ${quando(cache.quando)}.`); return; }
    avisar(msgErro(error)); mostrarTela("tela-casa"); return;
  }
  if (!data.length) { limparCache(); mostrarTela("tela-casa"); return; }
  estado.casa = data[0].casas;
  mostrarTela("tela-app");
  await carregarMembros();
  await carregar();
  assinarMudancas();
  await enviarFila();
  manterSeries();
}

// Gera os próximos meses das contas fixas "sem data para acabar".
async function manterSeries() {
  if (!estado.seriesDb || ![...estado.seriesDb.values()].some((s) => s.sem_fim)) return;
  const { data, error } = await sb.rpc("manter_series", { p_casa: estado.casa.id });
  if (!error && data > 0) await carregar();
}

async function carregarMembros() {
  let r = await sb.from("membros").select("user_id, nome, email").eq("casa_id", estado.casa.id);
  // Banco ainda sem as colunas de nome (antes do 02_historico.sql).
  if (r.error) r = await sb.from("membros").select("user_id").eq("casa_id", estado.casa.id);
  estado.membros = new Map((r.data || []).map((m) => [m.user_id, m]));
}

function nomeDe(uid) {
  if (!uid) return null;
  const m = estado.membros.get(uid);
  if (m?.nome) return m.nome;
  const doEmail = (e) => { const s = (e || "").split("@")[0]; return s.charAt(0).toUpperCase() + s.slice(1); };
  if (m?.email) return doEmail(m.email);
  return uid === estado.sessao?.user?.id ? doEmail(estado.sessao.user.email) || "Você" : "Alguém";
}

async function carregar() {
  const todos = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from("lancamentos").select("*")
      .eq("casa_id", estado.casa.id).order("data").order("criado_em").range(de, de + 999);
    if (error) { avisar(msgErro(error)); return; }
    todos.push(...data);
    if (data.length < 1000) break;
  }
  const [s, lim] = await Promise.all([
    sb.from("series").select("*").eq("casa_id", estado.casa.id),
    sb.from("limites").select("categoria, valor").eq("casa_id", estado.casa.id),
  ]);
  estado.seriesDb = s.error ? null : new Map(s.data.map((x) => [x.grupo, x]));
  estado.limites = lim.error ? null : new Map(lim.data.map((x) => [x.categoria, Number(x.valor)]));
  definirLancs(aplicarFila(todos));
  gravarCache();
}

// ---------- sem internet: lançar e dar check ficam guardados e vão depois ----------

const CHAVE_FILA = "fin-fila-v1";
function lerFila() {
  try { return (JSON.parse(localStorage.getItem(CHAVE_FILA)) || []).filter((o) => o.casa === estado.casa?.id); } catch (e) { return []; }
}
function gravarFila(f) { try { localStorage.setItem(CHAVE_FILA, JSON.stringify(f)); } catch (e) {} }
const ehErroRede = (e) => !navigator.onLine || /fetch|NetworkError|Load failed|network/i.test((e && e.message) || String(e));
function enfileirar(op) { gravarFila([...lerFila(), { ...op, casa: estado.casa.id }]); }
function idsPendentes() { return new Set(lerFila().flatMap((o) => (o.op === "insert" ? o.linhas.map((l) => l.id) : [o.id]))); }

// Põe por cima dos dados do banco o que ainda não foi enviado.
function aplicarFila(lista) {
  const fila = lerFila();
  if (!fila.length) return lista;
  const m = new Map(lista.map((l) => [l.id, l]));
  for (const o of fila) {
    if (o.op === "insert") for (const l of o.linhas) { if (!m.has(l.id)) m.set(l.id, { ...l }); }
    else if (m.has(o.id)) m.set(o.id, { ...m.get(o.id), ...o.campos });
  }
  return [...m.values()];
}

let enviandoFila = false;
async function enviarFila() {
  if (enviandoFila || !navigator.onLine || !estado.casa) return;
  let fila = lerFila();
  if (!fila.length) return;
  enviandoFila = true;
  let enviados = 0;
  try {
    while (fila.length) {
      const o = fila[0];
      const r = o.op === "insert"
        ? await sb.from("lancamentos").upsert(o.linhas)
        : await sb.from("lancamentos").update(o.campos).eq("id", o.id);
      if (r.error && ehErroRede(r.error)) break;
      if (r.error) avisar("Um item guardado foi recusado pelo banco: " + msgErro(r.error));
      fila = fila.slice(1);
      gravarFila(fila);
      enviados++;
    }
  } finally { enviandoFila = false; }
  if (enviados) {
    await carregar();
    avisar(enviados === 1 ? "O que estava guardado foi enviado." : `${enviados} itens guardados foram enviados.`);
  }
}
window.addEventListener("online", enviarFila);
window.addEventListener("offline", () => estado.casa && render());

function definirLancs(lista) {
  // Mesma ordem da planilha: por data, receitas antes das despesas.
  lista.sort((a, b) =>
    a.data.localeCompare(b.data) ||
    (a.tipo === b.tipo ? 0 : a.tipo === "receita" ? -1 : 1) ||
    a.criado_em.localeCompare(b.criado_em));
  estado.lancs = lista;
  if (lista.length) estado.temCategoria = "categoria" in lista[0];
  // A categoria que vocês escolheram por último para cada descrição vale para as próximas.
  estado.aprendidas = new Map();
  for (const l of [...lista].sort((a, b) => (a.atualizado_em || "").localeCompare(b.atualizado_em || ""))) {
    if (l.categoria) estado.aprendidas.set(l.tipo + "|" + normalizar(l.descricao), l.categoria);
  }
  estado.saldoApos = new Map();
  let s = 0;
  for (const l of lista) { s += sinal(l); estado.saldoApos.set(l.id, r2(s)); }
  render();
}

let recarregarTimer;
function assinarMudancas() {
  if (estado.canal) sb.removeChannel(estado.canal);
  estado.canal = sb.channel("lanc-" + estado.casa.id)
    .on("postgres_changes", { event: "*", schema: "public", table: "lancamentos", filter: `casa_id=eq.${estado.casa.id}` }, () => {
      clearTimeout(recarregarTimer);
      recarregarTimer = setTimeout(carregar, 400);
    })
    .subscribe();
}

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || !estado.casa) return;
  await enviarFila();
  carregar();
});

// ---------- contas fixas ----------

function series() {
  const grupos = new Map();
  for (const l of estado.lancs) {
    if (!l.grupo || !l.recorrente) continue;
    if (!grupos.has(l.grupo)) grupos.set(l.grupo, []);
    grupos.get(l.grupo).push(l);
  }
  return [...grupos.entries()].map(([grupo, ls]) => {
    const gaps = [];
    for (let i = 1; i < ls.length; i++) gaps.push((deIso(ls[i].data) - deIso(ls[i - 1].data)) / 864e5);
    gaps.sort((a, b) => a - b);
    const mediana = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 30;
    return { grupo, ls, semanal: mediana > 0 && mediana <= 10, ultimo: ls[ls.length - 1], semFim: !!estado.seriesDb?.get(grupo)?.sem_fim };
  }).sort((a, b) => a.ultimo.data.localeCompare(b.ultimo.data));
}

// Só as que ainda estão valendo e acabam nos próximos 2 meses; as que já acabaram foram encerradas de propósito.
function seriesAcabando() {
  const hj = hoje(), ate = somarDias(hj, 62);
  return series().filter((s) => !s.semFim && s.ultimo.data >= hj && s.ultimo.data <= ate);
}

async function definirSemFim(s, ligar) {
  const r = ligar
    ? await sb.from("series").upsert({ grupo: s.grupo, casa_id: estado.casa.id, passo: s.semanal ? "semana" : "mes", sem_fim: true, gerado_ate: s.ultimo.data })
    : await sb.from("series").update({ sem_fim: false }).eq("grupo", s.grupo);
  if (r.error) throw r.error;
  if (ligar) {
    const g = await sb.rpc("manter_series", { p_casa: estado.casa.id });
    if (g.error) throw g.error;
  }
  await carregar();
}

function proximasDaSerie(s, n = 12) {
  const u = s.ultimo;
  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(), casa_id: estado.casa.id, descricao: u.descricao, tipo: u.tipo, valor: u.valor,
    data: s.semanal ? somarDias(u.data, 7 * (i + 1)) : somarMeses(u.data, i + 1),
    pago: false, recorrente: true, grupo: s.grupo,
    ...(estado.temCategoria ? { categoria: categoriaDe(u) } : {}),
  }));
}

async function estenderSeries(lista) {
  const linhas = lista.flatMap((s) => proximasDaSerie(s));
  const { error } = await sb.from("lancamentos").insert(linhas);
  if (error) throw error;
  return linhas.map((l) => l.id);
}

function renderSeries() {
  const todas = series(), acabando = new Set(seriesAcabando().map((s) => s.grupo));
  const n = acabando.size;
  const podeSemFim = !!estado.seriesDb;
  $("lista-series").innerHTML = (todas.length ? "" : '<div class="vazio">Nenhuma conta fixa ainda.<br>Ao lançar, escolha "Todo mês" em Repetir.</div>') +
    (podeSemFim && todas.length ? '<p class="nota">Ligue <b>Sempre</b> nas contas que não têm data para acabar: o app cria os próximos meses sozinho.</p>' : "") +
    (n ? `<button class="btn" type="button" data-estender-todas style="margin-bottom:10px">${IC.repetir} Repetir as ${n} que estão acabando</button>` : "") +
    todas.map((s) => `<div class="serie">
      <div>
        <div class="desc">${esc(s.ultimo.descricao)}</div>
        <small class="num">${s.semanal ? "toda semana" : "todo mês"} · ${brl.format(Number(s.ultimo.valor))} · ${s.semFim ? "sem data para acabar" : acabando.has(s.grupo) ? `<b style='color:var(--aviso-atencao)'>acaba</b> ${dataMedia(s.ultimo.data)}` : `${s.ultimo.data < hoje() ? "acabou" : "vai até"} ${dataMedia(s.ultimo.data)}`}</small>
      </div>
      ${s.semFim ? "" : `<button class="btn sec" type="button" data-estender="${s.grupo}" aria-label="Repetir mais 12 vezes">+12</button>`}
      ${podeSemFim ? `<label class="interruptor" title="Repetir sempre"><input type="checkbox" data-sem-fim="${s.grupo}" ${s.semFim ? "checked" : ""}><span>Sempre</span></label>` : ""}
    </div>`).join("");
}

$("lista-series").addEventListener("change", async (e) => {
  const c = e.target.closest("[data-sem-fim]");
  if (!c) return;
  const s = series().find((x) => x.grupo === c.dataset.semFim);
  c.disabled = true;
  try {
    await definirSemFim(s, c.checked);
    renderSeries();
    avisar(c.checked ? `"${s.ultimo.descricao}" agora se repete sempre.` : `"${s.ultimo.descricao}" parou de se repetir sozinha.`);
  } catch (err) { c.checked = !c.checked; c.disabled = false; avisar(msgErro(err)); }
});

$("lista-series").addEventListener("click", async (e) => {
  const todas = e.target.closest("[data-estender-todas]");
  const uma = e.target.closest("[data-estender]");
  if (!todas && !uma) return;
  const lista = todas ? seriesAcabando() : series().filter((s) => s.grupo === uma.dataset.estender);
  if (todas) {
    const ok = await confirmar(`Repetir ${lista.length} contas fixas?`,
      `Cria mais 12 de cada (${lista.length * 12} lançamentos), seguindo o ritmo de cada uma: semanal ou mensal. Dá para desfazer logo depois.`, "Repetir");
    if (!ok) return;
  }
  try {
    const ids = await estenderSeries(lista);
    await carregar();
    renderSeries();
    vibrar(12);
    avisar(`${ids.length} lançamentos criados.`, () => apagarIds(ids));
  } catch (err) { avisar(msgErro(err)); }
});
$("btn-series").onclick = () => { renderSeries(); abrirPainel($("painel-series")); };
$("btn-limites").onclick = () => abrirLimites();

// ---------- tela principal ----------

function saldoAte(d) {
  let s = 0;
  for (const l of estado.lancs) { if (l.data > d) break; s += sinal(l); }
  return r2(s);
}

function valorHtml(n) {
  const neg = n < 0;
  const [int, cent] = mostrarValor(Math.abs(n)).split(",");
  return `<div class="saldo-valor num ${neg ? "neg" : ""}"><span class="moeda">${neg ? "−R$" : "R$"}</span>${int}<span class="cent">,${cent}</span></div>`;
}

// Saldo previsto no fim de cada dia do mês, como a coluna C.C da planilha.
function pontosDoMes(mes) {
  const ini = mes + "-01", n = Number(fimDoMes(mes).slice(8));
  let s = 0, i = 0;
  const L = estado.lancs;
  while (i < L.length && L[i].data < ini) s += sinal(L[i++]);
  const pts = [];
  for (let d = 1; d <= n; d++) {
    const ds = `${mes}-${String(d).padStart(2, "0")}`;
    while (i < L.length && L[i].data <= ds) s += sinal(L[i++]);
    pts.push({ data: ds, saldo: r2(s) });
  }
  return pts;
}

function curvaHtml(mes, pts, hj) {
  const W = 340, H = 112, pad = 8;
  const vals = pts.map((p) => p.saldo);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min > 0 && min < max * 0.2) min = 0;
  if (max === min) { max += 1; min -= 1; }
  const margem = (max - min) * 0.12;
  min -= margem; max += margem;
  const x = (i) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W);
  const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
  const linha = (a, b) => pts.slice(a, b + 1).map((p, k) => `${k ? "L" : "M"}${x(a + k).toFixed(1)},${y(p.saldo).toFixed(1)}`).join("");
  const iHoje = pts.findIndex((p) => p.data === hj);
  const zeroY = y(0);
  const temNeg = Math.min(...vals) < 0;
  const area = `${linha(0, pts.length - 1)}L${W},${H}L0,${H}Z`;
  const idClip = "neg-" + mes;
  const passado = iHoje >= 0 ? linha(0, iHoje) : (pts[0].data < hj ? linha(0, pts.length - 1) : "");
  const futuro = iHoje >= 0 ? linha(iHoje, pts.length - 1) : (pts[0].data > hj ? linha(0, pts.length - 1) : "");
  const menor = pts.reduce((a, p) => (p.saldo < a.saldo ? p : a), pts[0]);
  const ult = pts[pts.length - 1];

  return `<figure class="curva" aria-label="Saldo previsto dia a dia">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Saldo previsto de ${dataCurta(pts[0].data)} a ${dataCurta(ult.data)}">
      <defs>
        <linearGradient id="grad-${mes}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="var(--primaria)" stop-opacity=".16"/>
          <stop offset="1" stop-color="var(--primaria)" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="${idClip}"><rect x="0" y="${zeroY.toFixed(1)}" width="${W}" height="${Math.max(0, H - zeroY).toFixed(1)}"/></clipPath>
      </defs>
      <path d="${area}" fill="url(#grad-${mes})"/>
      ${temNeg ? `<line x1="0" x2="${W}" y1="${zeroY.toFixed(1)}" y2="${zeroY.toFixed(1)}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" opacity=".6"/>` : ""}
      ${passado ? `<path d="${passado}" fill="none" stroke="var(--primaria)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` : ""}
      ${futuro ? `<path d="${futuro}" fill="none" stroke="var(--primaria)" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".85"/>` : ""}
      ${temNeg ? `<g clip-path="url(#${idClip})"><path d="${linha(0, pts.length - 1)}" fill="none" stroke="var(--vermelho)" stroke-width="2.25" vector-effect="non-scaling-stroke"/></g>` : ""}
      ${iHoje >= 0 ? `<line x1="${x(iHoje).toFixed(1)}" x2="${x(iHoje).toFixed(1)}" y1="0" y2="${H}" stroke="var(--primaria)" stroke-width="1" opacity=".25"/>
        <circle cx="${x(iHoje).toFixed(1)}" cy="${y(pts[iHoje].saldo).toFixed(1)}" r="5" fill="var(--primaria)" stroke="var(--bg)" stroke-width="3"/>` : ""}
    </svg>
    <div class="rotulos num"><span>${dataCurta(pts[0].data)}</span>${iHoje >= 0 && x(iHoje) / W > 0.12 && x(iHoje) / W < 0.58 ?`<span class="rot-hoje" style="left:${((x(iHoje) / W) * 100).toFixed(1)}%">hoje</span>` : ""}<span>${dataCurta(ult.data)} · ${brl.format(ult.saldo)}</span></div>
    <figcaption>${temNeg
      ? `Fica negativo: o ponto mais baixo é <b class="num" style="color:var(--vermelho)">${brl.format(menor.saldo)}</b> em ${dataCurta(menor.data)}.`
      : `Saldo previsto dia a dia, contando também o que ainda não tem check.`}</figcaption>
  </figure>`;
}

function render() {
  const mes = estado.mes, hj = hoje(), mesAtual = hj.slice(0, 7);
  const tituloMes = nomeMes.format(deIso(mes + "-01"));
  $("mes-nome").textContent = (tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1)).replace(" de ", " ");
  $("ir-hoje").hidden = mes === mesAtual;
  const fim = fimDoMes(mes);
  const doMes = estado.lancs.filter((l) => l.data.startsWith(mes));
  const naConta = r2(estado.lancs.reduce((s, l) => (l.pago ? s + sinal(l) : s), 0));
  const fimMes = saldoAte(fim);
  const entradas = doMes.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
  const saidas = doMes.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
  const pts = pontosDoMes(mes);

  // Número principal: no mês atual, o que está na conta; nos outros, como o mês termina.
  let principal, legenda;
  if (mes === mesAtual) {
    principal = naConta;
    legenda = `na conta agora, só o que tem check<br>Previsto para ${dataCurta(fim)}: <b class="num">${brl.format(fimMes)}</b>`;
  } else if (mes > mesAtual) {
    principal = fimMes;
    legenda = `previsto para ${dataCurta(fim)}<br>Na conta agora: <b class="num">${brl.format(naConta)}</b>`;
  } else {
    principal = fimMes;
    legenda = `saldo no fim de ${MESES[Number(mes.slice(5)) - 1]}, contando tudo o que foi lançado`;
  }

  // Avisos, cada um leva ao que precisa ser feito.
  const avisos = [];
  const menor = pts.reduce((a, p) => (p.saldo < a.saldo ? p : a), pts[0]);
  if (menor.saldo < 0 && fim >= hj) {
    const primeiro = pts.find((p) => p.saldo < 0 && p.data >= hj) || menor;
    avisos.push(`<button class="aviso ruim" data-ir-dia="${primeiro.data}">${IC.alerta}<span>O saldo previsto fica negativo em ${dataCurta(primeiro.data)}: <b class="num">${brl.format(primeiro.saldo)}</b>.</span>${IC.ir}</button>`);
  }
  const atrasados = estado.lancs.filter((l) => !l.pago && l.data < hj);
  if (atrasados.length) {
    const receber = atrasados.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
    const pagar = atrasados.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
    const partes = [receber && `${brl.format(receber)} a receber`, pagar && `${brl.format(pagar)} a pagar`].filter(Boolean).join(" e ");
    avisos.push(`<button class="aviso atencao" data-ir-atrasados="${atrasados[0].data.slice(0, 7)}">${IC.alerta}<span>${atrasados.length === 1 ? "1 lançamento passou" : `${atrasados.length} lançamentos passaram`} da data sem check: ${partes}.</span>${IC.ir}</button>`);
  }
  estado.pendentes = idsPendentes();
  if (estado.pendentes.size) {
    const n = lerFila().length;
    avisos.unshift(`<button class="aviso info" data-enviar-fila>${svg('<path d="M4 14.9A7 7 0 1115.7 8h1.8a4.5 4.5 0 012.5 8.2"/><path d="M12 12v9M8 17l4 4 4-4"/>')}<span>${n === 1 ? "1 item guardado" : `${n} itens guardados`} no aparelho, esperando internet para enviar.</span>${IC.ir}</button>`);
  }
  const usoLimites = usoDosLimites(mes).filter((u) => u.fracao >= 0.85);
  if (usoLimites.length && mes >= mesAtual) {
    const estourou = usoLimites.some((u) => u.fracao > 1);
    const u = usoLimites[0];
    avisos.push(`<button class="aviso ${estourou ? "ruim" : "atencao"}" data-abrir-resumo>${IC.alerta}<span>${usoLimites.length === 1
      ? `${esc(u.nome)}: ${brl.format(u.gasto)} de ${brl.format(u.limite)} (${Math.round(u.fracao * 100)}% do limite).`
      : `${usoLimites.length} categorias perto ou acima do limite${estourou ? `; ${esc(u.nome)} passou ${brl.format(u.gasto - u.limite)}` : ""}.`}</span>${IC.ir}</button>`);
  }
  if (mes >= mesAtual) {
    const acabando = seriesAcabando();
    if (acabando.length) {
      const ate = acabando[acabando.length - 1].ultimo.data;
      avisos.push(`<button class="aviso info" data-abrir-series>${IC.repetir}<span>${acabando.length === 1 ? `"${esc(acabando[0].ultimo.descricao)}" acaba` : `${acabando.length} contas fixas acabam`} até ${mesCurto(ate)}. Repetir?</span>${IC.ir}</button>`);
    }
    if (saidas > 0 && entradas === 0) {
      avisos.push(`<button class="aviso info" data-nova-receita>${IC.mais}<span>Nenhuma entrada prevista em ${mesCurto(mes + "-01")}. Faltou lançar o salário?</span>${IC.ir}</button>`);
    }
  }

  const chip = (v, t) => `<button class="chip ${!estado.filtroCat && estado.filtro === v ? "ativo" : ""}" data-filtro="${v}">${t}</button>`;
  const chipCat = estado.filtroCat
    ? (() => { const [tipo, chave] = estado.filtroCat.split("|"); const c = catInfo(tipo, chave);
        return `<button class="chip ativo chip-cat" data-limpar-cat aria-label="Tirar filtro ${esc(c.nome)}">${c.icone}${esc(c.nome)}<svg class="ic" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg></button>`; })()
    : "";

  $("conteudo").innerHTML = `<div class="grade">
    <section class="col-resumo">
      <div class="saldo">
        ${valorHtml(principal)}
        <div class="saldo-legenda">${legenda}</div>
      </div>
      ${curvaHtml(mes, pts, hj)}
      <div class="fluxo">
        <div><span>Entradas do mês</span><b class="num" style="color:var(--verde)">${brl.format(entradas)}</b></div>
        <div><span>Saídas do mês</span><b class="num" style="color:var(--vermelho)">${brl.format(saidas)}</b></div>
      </div>
      ${doMes.length ? `<button class="linha-resumo" data-abrir-resumo>${svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')}<span>Para onde foi o dinheiro em ${nomeDoMes(mes)}</span>${IC.ir}</button>` : ""}
      ${avisos.length ? `<div class="avisos">${avisos.join("")}</div>` : ""}
    </section>
    <section class="col-extrato">
      <nav class="filtros" aria-label="Filtro">${chipCat}${chip("todos", "Todos")}${chip("pendentes", "Sem check")}${chip("despesas", "Despesas")}${chip("receitas", "Receitas")}</nav>
      ${extratoHtml(doMes, mes, hj)}
    </section>
  </div>`;
}

function diasHtml(lista, hj) {
  const grupos = new Map();
  for (const l of lista) { if (!grupos.has(l.data)) grupos.set(l.data, []); grupos.get(l.data).push(l); }
  let out = "";
  for (const [data, itens] of grupos) {
    const futuro = data >= hj && estado.filtro === "todos";
    out += `<div class="dia" id="dia-${data}">
      <div class="dia-cab"><span>${nomeDia.format(deIso(data))}</span></div>
      <div class="lista">${itens.map((l) => itemHtml(l, hj, { saldo: futuro })).join("")}</div>
    </div>`;
  }
  return out;
}

function extratoHtml(doMes, mes, hj) {
  if (estado.filtroCat) {
    const [tipo, chave] = estado.filtroCat.split("|");
    const lista = doMes.filter((l) => l.tipo === tipo && categoriaDe(l) === chave);
    const total = lista.reduce((s, l) => s + Number(l.valor), 0);
    return lista.length
      ? `<div class="nota num" style="margin:14px 4px 0">${lista.length} ${lista.length === 1 ? "lançamento" : "lançamentos"} · ${brl.format(total)} em ${nomeDoMes(mes)}</div>${diasHtml(lista, hj)}`
      : '<div class="vazio">Nada nessa categoria neste mês.</div>';
  }
  if (estado.filtro !== "todos") {
    const f = { pendentes: (l) => !l.pago, despesas: (l) => l.tipo === "despesa", receitas: (l) => l.tipo === "receita" }[estado.filtro];
    const lista = doMes.filter(f);
    return lista.length ? diasHtml(lista, hj) : '<div class="vazio">Nada nesse filtro.</div>';
  }
  if (!doMes.length) return `<div class="vazio">Nenhum lançamento em ${mesCurto(mes + "-01")}.<br>Toque em + para adicionar.</div>`;

  const pagos = doMes.filter((l) => l.data < hj && l.pago);
  const atrasados = doMes.filter((l) => l.data < hj && !l.pago);
  const deHoje = doMes.filter((l) => l.data === hj);
  const futuros = doMes.filter((l) => l.data > hj);
  let out = "";

  if (pagos.length) {
    const ini = pagos[0].data, fim = pagos[pagos.length - 1].data;
    out += `<button class="recolhido ${estado.verPassado ? "aberto" : ""}" data-alternar-passado aria-expanded="${estado.verPassado}">
      ${IC.check}<span class="num">${ini === fim ? dataCurta(ini) : `${dataCurta(ini).slice(0, 2)} a ${dataCurta(fim)}`} · ${pagos.length} ${pagos.length === 1 ? "lançamento já resolvido" : "lançamentos já resolvidos"}</span>${IC.baixo}
    </button>`;
    if (estado.verPassado) out += diasHtml(pagos, hj);
  }
  if (atrasados.length) {
    out += `<div class="secao-tit" id="atrasados">Passaram da data sem check</div>
      <div class="lista">${atrasados.map((l) => itemHtml(l, hj, { data: true })).join("")}</div>`;
  }
  if (mes === hj.slice(0, 7)) {
    out += `<div class="hoje-div" id="hoje"><span>Hoje · ${nomeDia.format(deIso(hj))}</span><span class="num">previsto ${brl.format(saldoAte(hj))}</span></div>`;
    out += deHoje.length
      ? `<div class="lista" style="margin-top:8px">${deHoje.map((l) => itemHtml(l, hj, { saldo: true })).join("")}</div>`
      : '<div class="nada-hoje">Nada lançado para hoje.</div>';
  }
  out += diasHtml(futuros, hj);
  return out;
}

function itemHtml(l, hj, op = {}) {
  const atrasado = !l.pago && l.data < hj;
  const baixado = l.pago && l.data < hj;
  const s = estado.saldoApos.get(l.id);
  const tags = [];
  if (op.data) tags.push(`<span class="tag num">${dataCurta(l.data)}</span>`);
  if (l.parcelas) tags.push(`<span class="tag num">${l.parcela}/${l.parcelas}</span>`);
  if (l.recorrente) tags.push(`<span class="tag">fixa</span>`);
  if (atrasado) tags.push(`<span class="tag atraso">atrasado</span>`);
  if (l.criado_por) tags.push(`<span class="tag">${esc(nomeDe(l.criado_por))}</span>`);
  if (estado.pendentes.has(l.id)) tags.push(`<span class="tag atraso">aguardando internet</span>`);
  const feito = l.tipo === "receita" ? "recebido" : "pago";
  return `<div class="item ${baixado ? "baixado" : ""}">
    <button class="check ${l.pago ? "ok" : ""} ${atrasado ? "atrasado" : ""}" data-check="${l.id}" aria-pressed="${l.pago}" aria-label="${esc(l.descricao)}: ${l.pago ? `tirar check` : `marcar como ${feito}`}"><span class="bola">${IC.check}</span></button>
    <button class="corpo" data-editar="${l.id}">
      <span class="cat-ic" title="${esc(catInfo(l.tipo, categoriaDe(l)).nome)}">${catInfo(l.tipo, categoriaDe(l)).icone}</span>
      <div class="txt">
        <div class="desc">${esc(l.descricao)}</div>
        ${tags.length ? `<div class="meta">${tags.join("")}</div>` : ""}
      </div>
      <div class="dir">
        <div class="valor num ${l.tipo === "receita" ? "pos" : ""}">${l.tipo === "receita" ? "+" : "−"} ${brl.format(Number(l.valor))}</div>
        ${op.saldo ? `<div class="saldo-linha num ${s < 0 ? "neg" : ""}">${brl.format(s)}</div>` : ""}
      </div>
    </button>
  </div>`;
}

$("conteudo").addEventListener("click", async (ev) => {
  const t = (sel) => ev.target.closest(sel);
  if (t("[data-filtro]")) { estado.filtro = t("[data-filtro]").dataset.filtro; estado.filtroCat = null; render(); return; }
  if (t("[data-limpar-cat]")) { estado.filtroCat = null; render(); return; }
  if (t("[data-abrir-resumo]")) { abrirResumo(); return; }
  if (t("[data-enviar-fila]")) {
    if (!navigator.onLine) { avisar("Ainda sem internet. Assim que conectar, o app envia sozinho."); return; }
    await enviarFila();
    return;
  }
  if (t("[data-check]")) { await alternarPago(t("[data-check]").dataset.check); return; }
  if (t("[data-editar]")) { abrirLanc(estado.lancs.find((l) => l.id === t("[data-editar]").dataset.editar)); return; }
  if (t("[data-alternar-passado]")) { estado.verPassado = !estado.verPassado; render(); return; }
  if (t("[data-abrir-series]")) { renderSeries(); abrirPainel($("painel-series")); return; }
  if (t("[data-nova-receita]")) { abrirLanc(null, { tipo: "receita", data: estado.mes + "-05" }); return; }
  if (t("[data-ir-dia]")) {
    const d = t("[data-ir-dia]").dataset.irDia;
    estado.filtro = "todos";
    if (estado.mes !== d.slice(0, 7)) estado.mes = d.slice(0, 7);
    render();
    $("dia-" + d)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (t("[data-ir-atrasados]")) {
    estado.filtro = "todos";
    estado.mes = t("[data-ir-atrasados]").dataset.irAtrasados;
    render();
    $("atrasados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

async function alternarPago(id) {
  const l = estado.lancs.find((x) => x.id === id);
  if (!l) return;
  const antes = l.pago;
  l.pago = !antes;
  render();
  document.querySelector(`[data-check="${id}"]`)?.classList.add("pulso");
  vibrar(l.pago ? 10 : 6);
  const guardar = () => {
    enfileirar({ op: "update", id, campos: { pago: l.pago } });
    gravarCache();
    render();
    avisar("Sem internet: o check ficou guardado e vai quando conectar.");
  };
  if (!navigator.onLine) return guardar();
  const { error } = await sb.from("lancamentos").update({ pago: l.pago }).eq("id", id);
  if (error && ehErroRede(error)) return guardar();
  if (error) { l.pago = antes; render(); avisar(msgErro(error)); return; }
  const feito = l.tipo === "receita" ? "Recebido" : "Pago";
  avisar(l.pago ? `${feito}: ${l.descricao}` : `Check tirado: ${l.descricao}`, async () => {
    const r = await sb.from("lancamentos").update({ pago: antes }).eq("id", id);
    if (r.error) throw r.error;
  });
}

// ---------- troca de mês com o dedo ----------

const conteudo = $("conteudo");
function irParaMes(novo, direcao) {
  if (novo === estado.mes) return;
  const sentido = direcao || (novo > estado.mes ? 1 : -1);
  conteudo.style.transition = "transform .16s cubic-bezier(.4,0,1,1), opacity .16s";
  conteudo.style.transform = `translateX(${-sentido * 40}px)`;
  conteudo.style.opacity = "0";
  setTimeout(() => {
    estado.mes = novo;
    estado.verPassado = false;
    render();
    window.scrollTo({ top: 0 });
    conteudo.style.transition = "none";
    conteudo.style.transform = `translateX(${sentido * 40}px)`;
    void conteudo.offsetWidth;
    conteudo.style.transition = "transform .34s var(--sai), opacity .24s var(--sai)";
    conteudo.style.transform = "";
    conteudo.style.opacity = "";
  }, 160);
}
function mudarMes(n) { irParaMes(somarMeses(estado.mes + "-01", n).slice(0, 7), n); }
$("mes-ant").onclick = () => mudarMes(-1);
$("mes-prox").onclick = () => mudarMes(1);
const irHoje = () => {
  const atual = hoje().slice(0, 7);
  if (estado.mes !== atual) irParaMes(atual);
  else $("hoje")?.scrollIntoView({ behavior: "smooth", block: "start" });
};
$("mes-nome").onclick = irHoje;
$("ir-hoje").onclick = irHoje;

let gesto = null;
$("tela-app").addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1 || e.target.closest(".filtros, .topo")) { gesto = null; return; }
  gesto = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now(), eixo: null, dx: 0 };
}, { passive: true });
$("tela-app").addEventListener("touchmove", (e) => {
  if (!gesto) return;
  const dx = e.touches[0].clientX - gesto.x, dy = e.touches[0].clientY - gesto.y;
  if (!gesto.eixo && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) gesto.eixo = Math.abs(dx) > Math.abs(dy) * 1.4 ? "x" : "y";
  if (gesto.eixo !== "x") return;
  gesto.dx = dx;
  conteudo.style.transition = "none";
  conteudo.style.transform = `translateX(${dx * 0.9}px)`;
  conteudo.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 500));
}, { passive: true });
$("tela-app").addEventListener("touchend", () => {
  if (!gesto || gesto.eixo !== "x") { gesto = null; return; }
  const { dx, t } = gesto;
  gesto = null;
  const velocidade = Math.abs(dx) / Math.max(1, performance.now() - t);
  if (Math.abs(dx) > 90 || (velocidade > 0.5 && Math.abs(dx) > 30)) { mudarMes(dx < 0 ? 1 : -1); return; }
  conteudo.style.transition = "transform .36s var(--sai), opacity .24s";
  conteudo.style.transform = "";
  conteudo.style.opacity = "";
});

window.addEventListener("scroll", () => $("topo").classList.toggle("rolou", window.scrollY > 4), { passive: true });

// ---------- painéis ----------

const PAINEIS = ["painel-lanc", "painel-ajustes", "painel-historico", "painel-series", "painel-resumo", "painel-busca", "painel-limites"];
function abrirPainel(p) {
  fecharPaineis(true);
  $("fundo").hidden = false;
  p.hidden = false;
  p.scrollTop = 0;
  document.body.classList.add("travado");
  requestAnimationFrame(() => { $("fundo").classList.add("aberto"); p.classList.add("aberto"); });
}
function fecharPaineis(semAnimar) {
  for (const p of [...PAINEIS.map($), $("fundo")]) {
    p.classList.remove("aberto");
    p.style.transform = "";
    if (semAnimar) p.hidden = true; else setTimeout(() => { if (!p.classList.contains("aberto")) p.hidden = true; }, 320);
  }
  document.body.classList.remove("travado");
}
$("fundo").onclick = () => fecharPaineis();
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("painel-confirma").hidden) fecharConfirma(false); else fecharPaineis();
});

// Arrastar para baixo fecha o painel.
function arrastavel(p, fechar) {
  let g = null;
  p.addEventListener("touchstart", (e) => {
    if (e.target.closest("input, select, textarea")) return;
    const naAlca = !!e.target.closest(".alca, h2");
    if (!naAlca && p.scrollTop > 0) return;
    g = { y: e.touches[0].clientY, t: performance.now(), dy: 0, ativo: false };
  }, { passive: true });
  p.addEventListener("touchmove", (e) => {
    if (!g) return;
    g.dy = e.touches[0].clientY - g.y;
    if (!g.ativo) {
      if (g.dy < 8) { if (g.dy < -4) g = null; return; }
      g.ativo = true;
      p.classList.add("arrastando");
    }
    p.style.transform = `translateY(${Math.max(0, g.dy)}px)`;
  }, { passive: true });
  p.addEventListener("touchend", () => {
    if (!g) return;
    const { dy, ativo, t } = g;
    g = null;
    if (!ativo) return;
    p.classList.remove("arrastando");
    const v = dy / Math.max(1, performance.now() - t);
    if (dy > 120 || v > 0.6) { p.style.transform = ""; fechar(); }
    else p.style.transform = "";
  });
}
for (const id of PAINEIS) arrastavel($(id), () => fecharPaineis());

// Confirmação própria (no lugar do confirm do navegador).
let resolverConfirma = null;
function confirmar(titulo, texto, sim = "Apagar") {
  $("confirma-tit").textContent = titulo;
  $("confirma-txt").textContent = texto;
  $("confirma-sim").textContent = sim;
  $("fundo-confirma").hidden = false;
  $("painel-confirma").hidden = false;
  requestAnimationFrame(() => { $("fundo-confirma").classList.add("aberto"); $("painel-confirma").classList.add("aberto"); });
  setTimeout(() => $("confirma-nao").focus(), 50);
  return new Promise((res) => { resolverConfirma = res; });
}
function fecharConfirma(valor) {
  for (const id of ["fundo-confirma", "painel-confirma"]) {
    $(id).classList.remove("aberto");
    $(id).style.transform = "";
    setTimeout(() => { if (!$(id).classList.contains("aberto")) $(id).hidden = true; }, 320);
  }
  resolverConfirma?.(valor);
  resolverConfirma = null;
}
$("confirma-sim").onclick = () => fecharConfirma(true);
$("confirma-nao").onclick = () => fecharConfirma(false);
$("fundo-confirma").onclick = () => fecharConfirma(false);
arrastavel($("painel-confirma"), () => fecharConfirma(false));

// ---------- lançamento ----------

let tipoSel = "despesa";
let catManual = false; // a pessoa escolheu a categoria na mão; para de adivinhar
function definirTipo(t) {
  const mudou = t !== tipoSel;
  tipoSel = t;
  for (const b of $("lanc-tipo").children) b.classList.toggle("ativo", b.dataset.tipo === t);
  $("lanc-pago-rot").textContent = t === "receita" ? "Já foi recebido" : "Já foi pago";
  if (mudou || !CATS[t].some((c) => c[0] === estado.categoriaSel)) { catManual = false; adivinharNoForm(); }
  renderCats();
}
function adivinharNoForm() {
  if (catManual) return;
  const d = $("lanc-desc").value.trim();
  estado.categoriaSel = d ? adivinharCategoria(d, tipoSel) : null;
  renderCats();
}
function renderCats() {
  const caixa = $("lanc-cats");
  caixa.innerHTML = CATS[tipoSel].map(([chave, nome, d]) =>
    `<button type="button" class="cat ${estado.categoriaSel === chave ? "ativo" : ""}" data-cat="${chave}" role="radio" aria-checked="${estado.categoriaSel === chave}">${svg(d)}<span>${nome}</span></button>`).join("");
  // Traz a categoria escolhida para a parte visível da fila.
  const ativo = caixa.querySelector(".cat.ativo");
  if (ativo) caixa.scrollTo({ left: Math.max(0, ativo.offsetLeft - caixa.offsetLeft - 18), behavior: "smooth" });
}
$("lanc-cats").onclick = (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  estado.categoriaSel = b.dataset.cat;
  catManual = true;
  renderCats();
};
$("lanc-desc").addEventListener("input", adivinharNoForm);
$("lanc-tipo").onclick = (e) => { const b = e.target.closest("[data-tipo]"); if (b) definirTipo(b.dataset.tipo); };

function atualizarPrevia() {
  const v = $("lanc-repetir").value, data = $("lanc-data").value;
  $("bloco-meses").hidden = v !== "mensal";
  $("bloco-parcelas").hidden = v !== "parcelado";
  const p = $("lanc-previa");
  p.hidden = v === "nao" || !data;
  if (p.hidden) return;
  const semFim = v === "mensal" && $("lanc-semfim").checked;
  $("bloco-qtd-meses").hidden = semFim;
  if (semFim) {
    p.textContent = `Cria os próximos 12 meses agora (até ${dataMedia(somarMeses(data, 11))}) e continua criando sozinho.`;
  } else if (v === "mensal") {
    const n = Math.min(60, Math.max(2, parseInt($("lanc-meses").value, 10) || 12));
    p.textContent = `Cria ${n} lançamentos, de ${dataMedia(data)} a ${dataMedia(somarMeses(data, n - 1))}.`;
  } else {
    const total = parseInt($("lanc-parcs").value, 10), atual = parseInt($("lanc-parc").value, 10);
    p.textContent = total >= 1 && atual >= 1 && atual <= total
      ? `Cria as parcelas ${atual} a ${total} (${total - atual + 1}), de ${dataMedia(data)} a ${dataMedia(somarMeses(data, total - atual))}.`
      : "A parcela atual precisa estar entre 1 e o total.";
  }
}
for (const id of ["lanc-repetir", "lanc-meses", "lanc-parc", "lanc-parcs", "lanc-semfim"]) $(id).addEventListener("input", atualizarPrevia);
$("lanc-semfim").addEventListener("change", atualizarPrevia);

$("lanc-data").addEventListener("change", () => {
  if (!estado.editando) $("lanc-pago").checked = $("lanc-data").value <= hoje();
  atualizarPrevia();
});

// Ao escolher uma descrição já usada, sugere o tipo e o último valor.
$("lanc-desc").addEventListener("change", () => {
  if (estado.editando || $("lanc-valor").value.trim()) return;
  const d = $("lanc-desc").value.trim().toLowerCase();
  const ultimo = [...estado.lancs].reverse().find((l) => l.descricao.toLowerCase() === d);
  if (ultimo) {
    definirTipo(ultimo.tipo);
    $("lanc-valor").value = mostrarValor(Number(ultimo.valor));
    if (!catManual) { estado.categoriaSel = categoriaDe(ultimo); renderCats(); }
  }
});

function preencherSugestoes() {
  const vistos = new Map();
  for (const l of estado.lancs) vistos.set(l.descricao.toLowerCase(), l.descricao);
  $("sugestoes").innerHTML = [...vistos.values()].sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((d) => `<option value="${esc(d)}"></option>`).join("");
}

function abrirLanc(l, padrao = {}) {
  estado.editando = l || null;
  preencherSugestoes();
  $("lanc-erro").textContent = "";
  $("lanc-titulo").textContent = l ? "Editar lançamento" : "Novo lançamento";
  $("lanc-valor").value = l ? mostrarValor(Number(l.valor)) : "";
  $("lanc-desc").value = l ? l.descricao : "";
  tipoSel = l ? l.tipo : padrao.tipo || "despesa";
  estado.categoriaSel = l ? categoriaDe(l) : null;
  catManual = !!l;
  definirTipo(tipoSel);
  $("lanc-semfim").checked = false;
  $("bloco-semfim").hidden = !estado.seriesDb;
  const dataPadrao = padrao.data || (estado.mes === hoje().slice(0, 7) ? hoje() : estado.mes + "-01");
  $("lanc-data").value = l ? l.data : dataPadrao;
  $("lanc-pago").checked = l ? l.pago : dataPadrao <= hoje();
  $("bloco-repetir").hidden = !!l;
  $("lanc-repetir").value = "nao";
  $("lanc-meses").value = 12;
  $("lanc-parc").value = 1;
  $("lanc-parcs").value = 2;
  atualizarPrevia();
  const temSerie = !!(l && l.grupo);
  $("bloco-serie").hidden = !temSerie;
  $("lanc-serie").checked = false;
  $("lanc-acoes").hidden = !l;
  $("lanc-apagar-serie").hidden = !temSerie;
  $("lanc-estender").hidden = !(temSerie && l.recorrente && !estado.seriesDb?.get(l.grupo)?.sem_fim);
  $("lanc-hist").hidden = !l;
  if (l) carregarHistoricoDe(l);
  abrirPainel($("painel-lanc"));
  if (!l) setTimeout(() => $("lanc-valor").focus(), 300);
}
$("fab").onclick = () => abrirLanc(null);

$("painel-lanc").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const valor = lerValor($("lanc-valor").value);
  const descricao = $("lanc-desc").value.trim().replace(/\s+/g, " ");
  const data = $("lanc-data").value;
  const erro = (m) => { $("lanc-erro").textContent = m; };
  if (!Number.isFinite(valor)) return erro("Digite um valor válido, por exemplo 150 ou 24,90.");
  if (!descricao) return erro("Escreva uma descrição.");
  if (!data) return erro("Escolha a data.");

  const btn = $("lanc-salvar");
  btn.disabled = true;
  try {
    const l = estado.editando;
    const cat = estado.temCategoria ? { categoria: estado.categoriaSel || adivinharCategoria(descricao, tipoSel) } : {};
    if (l) {
      const campos = { descricao, tipo: tipoSel, valor, ...cat };
      const naSerie = l.grupo && $("lanc-serie").checked;
      const antes = estado.lancs.filter((x) => x.id === l.id || (naSerie && x.grupo === l.grupo && x.data > l.data)).map((x) => ({ ...x }));
      let r = await sb.from("lancamentos").update({ ...campos, data, pago: $("lanc-pago").checked }).eq("id", l.id);
      if (r.error) throw r.error;
      if (naSerie) {
        r = await sb.from("lancamentos").update(campos).eq("grupo", l.grupo).gt("data", l.data);
        if (r.error) throw r.error;
      }
      avisar(antes.length > 1 ? `${antes.length} lançamentos alterados.` : "Alterado.", () => regravar(antes));
    } else {
      const base = { casa_id: estado.casa.id, descricao, tipo: tipoSel, valor, ...cat };
      const pagoPrimeiro = $("lanc-pago").checked;
      const rep = $("lanc-repetir").value;
      const semFim = rep === "mensal" && $("lanc-semfim").checked && !!estado.seriesDb;
      let linhas;
      if (rep === "mensal") {
        const n = semFim ? 12 : Math.min(60, Math.max(2, parseInt($("lanc-meses").value, 10) || 12));
        const grupo = crypto.randomUUID();
        linhas = Array.from({ length: n }, (_, i) => ({ ...base, data: somarMeses(data, i), pago: i === 0 && pagoPrimeiro, recorrente: true, grupo }));
      } else if (rep === "parcelado") {
        const total = parseInt($("lanc-parcs").value, 10);
        const atual = parseInt($("lanc-parc").value, 10);
        if (!(total >= 1 && atual >= 1 && atual <= total)) { btn.disabled = false; return erro("A parcela atual precisa estar entre 1 e o total."); }
        const grupo = crypto.randomUUID();
        linhas = Array.from({ length: total - atual + 1 }, (_, i) => ({ ...base, data: somarMeses(data, i), pago: i === 0 && pagoPrimeiro, parcela: atual + i, parcelas: total, grupo }));
      } else {
        linhas = [{ ...base, data, pago: pagoPrimeiro }];
      }
      const agora = new Date().toISOString();
      for (const x of linhas) Object.assign(x, { id: crypto.randomUUID(), recorrente: !!x.recorrente, parcela: x.parcela ?? null, parcelas: x.parcelas ?? null, grupo: x.grupo ?? null });
      // Sem internet: guarda no aparelho e envia depois (conta "sem data para acabar" precisa do banco na hora).
      const guardar = () => {
        if (semFim) throw new Error("Sem internet. Conta sem data para acabar precisa de conexão; tente de novo quando conectar.");
        enfileirar({ op: "insert", linhas: linhas.map((x) => ({ ...x, criado_por: estado.sessao?.user?.id, criado_em: agora, atualizado_em: agora })) });
        estado.mes = data.slice(0, 7);
        definirLancs(aplicarFila(estado.lancs));
        gravarCache();
        fecharPaineis();
        avisar("Sem internet: ficou guardado no aparelho e vai quando conectar.");
      };
      if (!navigator.onLine) { guardar(); return; }
      const { error } = await sb.from("lancamentos").insert(linhas);
      if (error && ehErroRede(error)) { guardar(); return; }
      if (error) throw error;
      if (semFim) {
        const r = await sb.from("series").insert({ grupo: linhas[0].grupo, casa_id: estado.casa.id, passo: "mes", sem_fim: true, gerado_ate: linhas[linhas.length - 1].data });
        if (r.error) throw r.error;
      }
      vibrar(12);
      const ids = linhas.map((x) => x.id);
      const grupoNovo = semFim ? linhas[0].grupo : null;
      avisar(semFim ? "Conta fixa criada, sem data para acabar." : linhas.length > 1 ? `${linhas.length} lançamentos criados.` : "Lançado.", async () => {
        if (grupoNovo) await sb.from("series").delete().eq("grupo", grupoNovo);
        await apagarIds(ids);
      });
      estado.mes = data.slice(0, 7);
    }
    fecharPaineis();
    await carregar();
  } catch (e) {
    erro(msgErro(e));
  } finally {
    btn.disabled = false;
  }
});

$("lanc-apagar").onclick = async () => {
  const l = estado.editando;
  if (!l) return;
  const antes = [{ ...l }];
  const { error } = await sb.from("lancamentos").delete().eq("id", l.id);
  if (error) return avisar(msgErro(error));
  fecharPaineis();
  await carregar();
  avisar(`Apagado: ${l.descricao}`, () => regravar(antes));
};

$("lanc-apagar-serie").onclick = async () => {
  const l = estado.editando;
  if (!l) return;
  const antes = estado.lancs.filter((x) => x.grupo === l.grupo && x.data >= l.data).map((x) => ({ ...x }));
  const ok = await confirmar(`Apagar ${antes.length} lançamentos?`,
    `"${l.descricao}" de ${dataMedia(l.data)} até ${dataMedia(antes[antes.length - 1].data)}. Dá para desfazer logo depois.`);
  if (!ok) return;
  // Sem isso, uma conta "sem data para acabar" seria recriada na próxima abertura.
  const serieAntes = estado.seriesDb?.get(l.grupo);
  if (serieAntes?.sem_fim) {
    const r = await sb.from("series").update({ sem_fim: false }).eq("grupo", l.grupo);
    if (r.error) return avisar(msgErro(r.error));
  }
  const { error } = await sb.from("lancamentos").delete().eq("grupo", l.grupo).gte("data", l.data);
  if (error) return avisar(msgErro(error));
  fecharPaineis();
  await carregar();
  avisar(`${antes.length} apagados.`, async () => {
    await regravar(antes);
    if (serieAntes?.sem_fim) await sb.from("series").update({ sem_fim: true }).eq("grupo", l.grupo);
  });
};

$("lanc-estender").onclick = async () => {
  const l = estado.editando;
  const s = l && series().find((x) => x.grupo === l.grupo);
  if (!s) return;
  try {
    const ids = await estenderSeries([s]);
    fecharPaineis();
    await carregar();
    avisar(`Repetido até ${dataMedia(estado.lancs.find((x) => x.id === ids[ids.length - 1])?.data || s.ultimo.data)}.`, () => apagarIds(ids));
  } catch (e) { avisar(msgErro(e)); }
};

// ---------- resumo do mês ----------

function totaisPorCategoria(lista, tipo) {
  const m = new Map();
  for (const l of lista) if (l.tipo === tipo) { const k = categoriaDe(l); m.set(k, (m.get(k) || 0) + Number(l.valor)); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// Quanto de cada limite já foi usado no mês (conta também o que ainda não tem check).
function usoDosLimites(mes) {
  if (!estado.limites?.size) return [];
  const gastos = new Map(totaisPorCategoria(estado.lancs.filter((l) => l.data.startsWith(mes)), "despesa"));
  return [...estado.limites.entries()].map(([k, limite]) => {
    const gasto = gastos.get(k) || 0;
    return { chave: k, nome: catInfo("despesa", k).nome, gasto, limite, fracao: gasto / limite };
  }).sort((a, b) => b.fracao - a.fracao);
}

function barrasHtml(tipo, doMes, doAnt) {
  const linhas = totaisPorCategoria(doMes, tipo);
  const limites = tipo === "despesa" && estado.limites ? estado.limites : new Map();
  // Categorias com limite aparecem mesmo sem gasto no mês.
  for (const k of limites.keys()) if (!linhas.some(([c]) => c === k)) linhas.push([k, 0]);
  if (!linhas.length) return '<div class="nota">Nada neste mês.</div>';
  const ant = new Map(totaisPorCategoria(doAnt, tipo));
  const total = linhas.reduce((s, [, v]) => s + v, 0) || 1;
  const max = Math.max(...linhas.map(([, v]) => v), ...ant.values(), 1);
  return linhas.map(([k, v]) => {
    const c = catInfo(tipo, k), va = ant.get(k), lim = limites.get(k);
    if (lim) {
      // Com limite, a barra mostra quanto do limite já foi usado.
      const f = v / lim, estado_ = f > 1 ? "estourou" : f >= 0.85 ? "perto" : "";
      const resto = lim - v;
      return `<button class="barra" data-cat-filtro="${tipo}|${k}">
        <span class="cat-ic">${c.icone}</span>
        <span class="barra-corpo">
          <span class="barra-topo"><span>${esc(c.nome)}</span><b class="num">${brl.format(v)} <span class="de-limite">de ${brl.format(lim)}</span></b></span>
          <span class="trilho"><span class="enche ${estado_}" style="width:${Math.min(100, f * 100).toFixed(1)}%"></span></span>
          <span class="barra-rodape num"><span class="${estado_}">${resto >= 0 ? `faltam ${brl.format(resto)}` : `passou ${brl.format(-resto)}`}</span><span>${Math.round(f * 100)}% do limite</span></span>
        </span>
      </button>`;
    }
    return `<button class="barra" data-cat-filtro="${tipo}|${k}">
      <span class="cat-ic">${c.icone}</span>
      <span class="barra-corpo">
        <span class="barra-topo"><span>${esc(c.nome)}</span><b class="num">${brl.format(v)}</b></span>
        <span class="trilho"><span class="enche ${tipo}" style="width:${((v / max) * 100).toFixed(1)}%"></span>${va ? `<i class="fantasma" style="left:${((va / max) * 100).toFixed(1)}%"></i>` : ""}</span>
        <span class="barra-rodape num"><span>${Math.round((v / total) * 100)}% do total</span>${va ? `<span>mês anterior ${brl.format(va)}</span>` : ""}</span>
      </span>
    </button>`;
  }).join("");
}

// ---------- limites ----------

function abrirLimites() {
  const mesAtual = hoje().slice(0, 7);
  // Média dos 3 meses anteriores com lançamento, para ajudar a escolher o valor.
  const meses = [1, 2, 3].map((n) => somarMeses(mesAtual + "-01", -n).slice(0, 7))
    .filter((m) => estado.lancs.some((l) => l.data.startsWith(m)));
  const media = new Map();
  for (const m of meses) for (const [k, v] of totaisPorCategoria(estado.lancs.filter((l) => l.data.startsWith(m)), "despesa")) media.set(k, (media.get(k) || 0) + v / meses.length);
  const atual = new Map(totaisPorCategoria(estado.lancs.filter((l) => l.data.startsWith(mesAtual)), "despesa"));
  $("lista-limites").innerHTML = CATS.despesa.map(([k, nome, d]) => {
    const lim = estado.limites.get(k);
    const ref = media.get(k) ? `média ${brl.format(media.get(k))}` : atual.get(k) ? `${nomeDoMes(mesAtual)}: ${brl.format(atual.get(k))}` : "sem gastos ainda";
    return `<label class="limite">
      <span class="cat-ic">${svg(d)}</span>
      <span class="limite-txt"><span>${nome}</span><small class="num">${ref}</small></span>
      <input class="num" inputmode="decimal" data-limite="${k}" placeholder="sem limite" value="${lim ? mostrarValor(lim) : ""}" aria-label="Limite de ${nome}">
    </label>`;
  }).join("");
  abrirPainel($("painel-limites"));
}

$("lista-limites").addEventListener("change", async (e) => {
  const inp = e.target.closest("[data-limite]");
  if (!inp) return;
  const k = inp.dataset.limite, nome = catInfo("despesa", k).nome;
  const txt = inp.value.trim();
  const valor = txt ? lerValor(txt) : 0;
  if (txt && !(valor > 0)) { avisar("Digite um valor, por exemplo 800 ou 1.200,00."); return; }
  const r = valor
    ? await sb.from("limites").upsert({ casa_id: estado.casa.id, categoria: k, valor, atualizado_em: new Date().toISOString() })
    : await sb.from("limites").delete().eq("casa_id", estado.casa.id).eq("categoria", k);
  if (r.error) { avisar(msgErro(r.error)); return; }
  if (valor) { estado.limites.set(k, valor); inp.value = mostrarValor(valor); } else estado.limites.delete(k);
  gravarCache();
  render();
  avisar(valor ? `Limite de ${nome}: ${brl.format(valor)} por mês.` : `${nome} ficou sem limite.`);
});

function abrirResumo() {
  const mes = estado.mes, ant = somarMeses(mes + "-01", -1).slice(0, 7);
  const nome = nomeDoMes(mes), nomeAnt = nomeDoMes(ant);
  const doMes = estado.lancs.filter((l) => l.data.startsWith(mes));
  const doAnt = estado.lancs.filter((l) => l.data.startsWith(ant));
  const soma = (ls, t) => ls.filter((l) => l.tipo === t).reduce((s, l) => s + Number(l.valor), 0);
  const ent = soma(doMes, "receita"), sai = soma(doMes, "despesa"), saiAnt = soma(doAnt, "despesa");
  const sobra = r2(ent - sai);
  const pend = doMes.filter((l) => !l.pago);
  const pPagar = soma(pend, "despesa"), pReceber = soma(pend, "receita");

  const frases = [`Em ${nome} entram <b class="num">${brl.format(ent)}</b> e saem <b class="num">${brl.format(sai)}</b>.`,
    `${sobra >= 0 ? "Sobram" : "Faltam"} <b class="num" style="color:var(${sobra >= 0 ? "--verde" : "--vermelho"})">${brl.format(Math.abs(sobra))}</b> no mês.`];
  if (saiAnt > 0) {
    const pct = Math.round(((sai - saiAnt) / saiAnt) * 100);
    frases.push(pct === 0 ? `As saídas estão iguais às de ${nomeAnt}.` : `As saídas estão ${Math.abs(pct)}% ${pct > 0 ? "acima" : "abaixo"} de ${nomeAnt} (${brl.format(saiAnt)}).`);
  }
  if (pend.length) frases.push(`Ainda sem check: ${[pPagar && `${brl.format(pPagar)} a pagar`, pReceber && `${brl.format(pReceber)} a receber`].filter(Boolean).join(" e ")}.`);

  const maiores = doMes.filter((l) => l.tipo === "despesa").sort((a, b) => b.valor - a.valor).slice(0, 5);
  $("resumo-tit").textContent = `Resumo de ${nomeMes.format(deIso(mes + "-01"))}`;
  $("resumo-corpo").innerHTML = `
    <div class="frases">${frases.map((f) => `<p>${f}</p>`).join("")}</div>
    <div class="sub-linha"><h3 class="sub">Saídas por categoria</h3>${estado.limites ? `<button class="btn texto" type="button" data-abrir-limites>${estado.limites.size ? "Editar limites" : "Definir limites"}</button>` : ""}</div>
    ${barrasHtml("despesa", doMes, doAnt)}
    ${doAnt.length ? '<div class="nota"><i class="fantasma-leg"></i> traço = mesma categoria no mês anterior</div>' : ""}
    <h3 class="sub">Entradas por categoria</h3>
    ${barrasHtml("receita", doMes, doAnt)}
    ${maiores.length ? `<h3 class="sub">Maiores saídas</h3><div class="lista lista-plana">${maiores.map((l) => `<button class="linha-simples" data-abrir-lanc="${l.id}">
      <span class="cat-ic">${catInfo(l.tipo, categoriaDe(l)).icone}</span><span class="desc">${esc(l.descricao)}</span>
      <span class="num quando">${dataCurta(l.data)}</span><b class="num">${brl.format(Number(l.valor))}</b></button>`).join("")}</div>` : ""}
    <p class="nota">Inclui o que ainda não tem check. Toque numa categoria para ver os lançamentos dela.</p>`;
  abrirPainel($("painel-resumo"));
}

$("resumo-corpo").addEventListener("click", (e) => {
  if (e.target.closest("[data-abrir-limites]")) { abrirLimites(); return; }
  const b = e.target.closest("[data-cat-filtro]");
  if (b) {
    estado.filtroCat = b.dataset.catFiltro;
    estado.filtro = "todos";
    fecharPaineis();
    render();
    document.querySelector(".col-extrato")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const a = e.target.closest("[data-abrir-lanc]");
  if (a) abrirLanc(estado.lancs.find((l) => l.id === a.dataset.abrirLanc));
});

// ---------- busca ----------

let buscaTimer;
function buscar() {
  const q = normalizar($("busca-q").value.trim());
  const alvo = $("busca-res");
  if (q.length < 2) { alvo.innerHTML = '<div class="nota">Procure por descrição, categoria ou valor. Ex.: mercado, escola, 1400.</div>'; return; }
  const achados = estado.lancs.filter((l) =>
    normalizar(l.descricao).includes(q) ||
    normalizar(catInfo(l.tipo, categoriaDe(l)).nome).includes(q) ||
    mostrarValor(Number(l.valor)).replace(/\./g, "").includes(q.replace(/\./g, ""))
  ).reverse();
  if (!achados.length) { alvo.innerHTML = '<div class="vazio">Nada encontrado.</div>'; return; }
  const sai = achados.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
  const ent = achados.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
  const porMes = new Map();
  for (const l of achados.slice(0, 150)) { const m = l.data.slice(0, 7); if (!porMes.has(m)) porMes.set(m, []); porMes.get(m).push(l); }
  alvo.innerHTML = `<div class="nota num">${achados.length} ${achados.length === 1 ? "resultado" : "resultados"}${sai ? ` · ${brl.format(sai)} em saídas` : ""}${ent ? ` · ${brl.format(ent)} em entradas` : ""}</div>` +
    [...porMes.entries()].map(([m, ls]) => `<div class="dia-cab" style="margin-top:14px">${nomeMes.format(deIso(m + "-01"))}</div>
      <div class="lista lista-plana">${ls.map((l) => `<button class="linha-simples ${l.pago && l.data < hoje() ? "baixado" : ""}" data-abrir-lanc="${l.id}">
        <span class="cat-ic">${catInfo(l.tipo, categoriaDe(l)).icone}</span><span class="desc">${esc(l.descricao)}</span>
        <span class="num quando">${dataCurta(l.data)}</span><b class="num ${l.tipo === "receita" ? "pos" : ""}">${l.tipo === "receita" ? "+" : "−"} ${brl.format(Number(l.valor))}</b></button>`).join("")}</div>`).join("");
}
$("busca-q").addEventListener("input", () => { clearTimeout(buscaTimer); buscaTimer = setTimeout(buscar, 120); });
$("abrir-busca").onclick = () => {
  abrirPainel($("painel-busca"));
  buscar();
  setTimeout(() => $("busca-q").focus(), 280);
};
$("busca-res").addEventListener("click", (e) => {
  const a = e.target.closest("[data-abrir-lanc]");
  if (!a) return;
  const l = estado.lancs.find((x) => x.id === a.dataset.abrirLanc);
  estado.mes = l.data.slice(0, 7);
  render();
  abrirLanc(l);
});

// ---------- histórico ----------

const rotTipo = (t) => (t === "receita" ? "Receita" : "Despesa");

function mudancas(a, d) {
  const out = [];
  if (a.descricao !== d.descricao) out.push(`descrição: ${esc(a.descricao)} → ${esc(d.descricao)}`);
  if (Number(a.valor) !== Number(d.valor)) out.push(`valor: ${brl.format(Number(a.valor))} → ${brl.format(Number(d.valor))}`);
  if (a.data !== d.data) out.push(`data: ${dataCurta(a.data)} → ${dataCurta(d.data)}`);
  if (a.tipo !== d.tipo) out.push(`tipo: ${rotTipo(a.tipo)} → ${rotTipo(d.tipo)}`);
  if (a.pago !== d.pago) {
    const feito = d.tipo === "receita" ? "recebido" : "pago";
    out.push(d.pago ? `marcou como ${feito}` : "tirou o check");
  }
  if (a.parcela !== d.parcela || a.parcelas !== d.parcelas) out.push(`parcela: ${a.parcela ?? "—"}/${a.parcelas ?? "—"} → ${d.parcela ?? "—"}/${d.parcelas ?? "—"}`);
  return out;
}

function eventoHtml(h, comDescricao, indice) {
  const quem = esc(nomeDe(h.user_id) || "Alguém");
  const l = h.depois || h.antes || {};
  const sobre = comDescricao ? ` "${esc(l.descricao || "")}"` : "";
  let txt, lista = [], acao = "";
  if (h.acao === "criou") {
    txt = `${quem} lançou${sobre}`;
    lista = h.qtd > 1
      ? [`${h.qtd} lançamentos de ${brl.format(Number(l.valor))}, de ${dataCurta(h.primeira)} a ${dataMedia(h.ultima)}`]
      : [`${rotTipo(l.tipo)} de ${brl.format(Number(l.valor))} em ${dataCurta(l.data)}`];
  } else if (h.acao === "alterou") {
    txt = comDescricao && h.antes.descricao !== h.depois.descricao ? `${quem} alterou "${esc(h.antes.descricao)}"` : `${quem} alterou${sobre}`;
    lista = mudancas(h.antes, h.depois);
  } else {
    txt = `${quem} apagou${sobre}`;
    lista = h.qtd > 1
      ? [`${h.qtd} lançamentos, de ${dataCurta(h.primeira)} a ${dataMedia(h.ultima)}`]
      : [`${rotTipo(l.tipo)} de ${brl.format(Number(l.valor))} em ${dataCurta(l.data)}`];
    const ids = new Set(estado.lancs.map((x) => x.id));
    if (indice != null && h.itens.some((x) => !ids.has(x.lancamento_id))) acao = `<button class="btn sec" type="button" data-restaurar="${indice}">Restaurar</button>`;
  }
  return `<div class="ev ${h.acao}">
    <div>
      <div><span class="quem">${txt}</span> <span class="quando">· ${quando(h.quando)}</span></div>
      ${lista.length ? `<ul>${lista.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
    </div>${acao}
  </div>`;
}

// Junta os vários registros de uma série criada ou apagada de uma vez (ex.: 12 meses de aluguel).
function agrupar(lista) {
  const out = [];
  for (const h of lista) {
    const p = out[out.length - 1];
    const l = h.depois || h.antes;
    const pl = p && (p.depois || p.antes);
    if (p && h.acao !== "alterou" && p.acao === h.acao && p.user_id === h.user_id && l.grupo && pl.grupo === l.grupo &&
        Math.abs(new Date(p.quando) - new Date(h.quando)) < 10000) {
      p.qtd += 1;
      p.itens.push(h);
      if (l.data < p.primeira) p.primeira = l.data;
      if (l.data > p.ultima) p.ultima = l.data;
      continue;
    }
    out.push({ ...h, qtd: 1, itens: [h], primeira: l.data, ultima: l.data });
  }
  return out;
}

async function carregarHistoricoDe(l) {
  const alvo = $("lanc-hist");
  const origem = l.criado_por
    ? `<div>Lançado por <b>${esc(nomeDe(l.criado_por))}</b> em ${quando(l.criado_em)}.</div>`
    : "<div>Veio da planilha.</div>";
  alvo.innerHTML = `<h3>Histórico</h3><div class="ev">${origem}</div>`;
  const { data, error } = await sb.from("historico").select("*").eq("lancamento_id", l.id).order("quando", { ascending: false }).limit(50);
  if (estado.editando?.id !== l.id || error) return;
  const alteracoes = data.filter((h) => h.acao === "alterou");
  alvo.innerHTML = `<h3>Histórico</h3>${alteracoes.map((h) => eventoHtml(h, false)).join("")}<div class="ev">${origem}</div>`;
}

async function renderHistorico() {
  const alvo = $("hist-geral");
  const { data, error } = await sb.from("historico").select("*").eq("casa_id", estado.casa.id).order("quando", { ascending: false }).limit(200);
  if (error) { alvo.innerHTML = `<div class="vazio">Histórico indisponível.<br>${esc(msgErro(error))}</div>`; return; }
  estado.histGrupos = agrupar(data);
  alvo.innerHTML = data.length
    ? estado.histGrupos.map((h, i) => eventoHtml(h, true, i)).join("")
    : '<div class="vazio">Nenhuma alteração ainda.<br>O que veio da planilha não aparece aqui; daqui para frente, tudo fica registrado.</div>';
}

$("btn-historico").onclick = () => {
  $("hist-geral").innerHTML = '<div class="carregando">Carregando…</div>';
  abrirPainel($("painel-historico"));
  renderHistorico();
};

$("hist-geral").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-restaurar]");
  if (!b) return;
  const grupo = estado.histGrupos[Number(b.dataset.restaurar)];
  const ids = new Set(estado.lancs.map((x) => x.id));
  const linhas = grupo.itens.map((h) => h.antes).filter((x) => x && !ids.has(x.id));
  b.disabled = true;
  try {
    await regravar(linhas);
    await carregar();
    await renderHistorico();
    avisar(linhas.length > 1 ? `${linhas.length} lançamentos restaurados.` : "Restaurado.");
  } catch (err) { b.disabled = false; avisar(msgErro(err)); }
});

// ---------- ajustes ----------

function temaAtual() {
  try { return localStorage.getItem("tema") || "auto"; } catch (e) { return "auto"; }
}
function aplicarTema(t) {
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  try { if (t === "auto") localStorage.removeItem("tema"); else localStorage.setItem("tema", t); } catch (e) {}
  for (const b of $("seg-tema").children) b.classList.toggle("ativo", b.dataset.tema === t);
  const escuro = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]').content = escuro ? "#141413" : "#f5f4ef";
}
$("seg-tema").onclick = (e) => { const b = e.target.closest("[data-tema]"); if (b) aplicarTema(b.dataset.tema); };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => aplicarTema(temaAtual()));
aplicarTema(temaAtual());

let pedidoInstalar = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); pedidoInstalar = e; $("btn-instalar").hidden = false; });
$("btn-instalar").onclick = async () => {
  if (!pedidoInstalar) return;
  pedidoInstalar.prompt();
  await pedidoInstalar.userChoice;
  pedidoInstalar = null;
  $("btn-instalar").hidden = true;
};

$("abrir-ajustes").onclick = () => {
  $("ajustes-codigo").textContent = estado.casa?.codigo || "—";
  $("ajustes-email").textContent = "Conectado como " + (estado.sessao?.user?.email || "");
  $("ajustes-nome").value = estado.membros.get(estado.sessao?.user?.id)?.nome || "";
  $("btn-limites").hidden = !estado.limites;
  mostrarLembretes();
  aplicarTema(temaAtual());
  abrirPainel($("painel-ajustes"));
};

// ---------- lembretes no celular ----------

const suportaPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!cfg.vapidPublica;
const ehIphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalado = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function chaveVapid(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function mostrarLembretes() {
  const bloco = $("bloco-lembretes"), chave = $("lembretes-ligar"), txt = $("lembretes-txt");
  if (!suportaPush && !(ehIphone && !instalado)) { bloco.hidden = true; return; }
  bloco.hidden = false;
  if (ehIphone && !instalado) {
    chave.disabled = true;
    txt.textContent = "No iPhone, primeiro adicione o app à tela inicial (Compartilhar → Adicionar à Tela de Início) e abra por lá.";
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  chave.checked = !!sub && Notification.permission === "granted";
  chave.disabled = Notification.permission === "denied";
  $("lembretes-estado").textContent = chave.checked ? "Ligado" : "Desligado";
  if (Notification.permission === "denied") txt.textContent = "As notificações estão bloqueadas para este site. Libere nas configurações do navegador e volte aqui.";
}

$("lembretes-ligar").addEventListener("change", async (e) => {
  const chave = e.target;
  chave.disabled = true;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (chave.checked) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Sem permissão para notificar. Libere as notificações para este site.");
      const sub = (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveVapid(cfg.vapidPublica) }));
      const j = sub.toJSON();
      const { error } = await sb.from("push_inscricoes").upsert({ endpoint: j.endpoint, casa_id: estado.casa.id, p256dh: j.keys.p256dh, auth: j.keys.auth });
      if (error) throw (/push_inscricoes/.test(error.message) ? new Error("Falta atualizar o banco (05_lembretes.sql).") : error);
      avisar("Lembretes ligados neste celular.");
    } else {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sb.from("push_inscricoes").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      avisar("Lembretes desligados neste celular.");
    }
  } catch (err) {
    chave.checked = !chave.checked;
    avisar(msgErro(err));
  } finally {
    await mostrarLembretes();
  }
});

$("btn-convidar").onclick = async () => {
  const link = location.origin + location.pathname;
  const texto = `Vamos controlar as finanças da casa juntos. Abra ${link}, crie sua conta e use o código ${estado.casa.codigo}.`;
  try {
    if (navigator.share) await navigator.share({ title: "Finanças da Casa", text: texto });
    else { await navigator.clipboard.writeText(texto); avisar("Convite copiado. Cole no WhatsApp."); }
  } catch (e) { /* compartilhamento cancelado */ }
};

$("ajustes-salvar-nome").onclick = async () => {
  const nome = $("ajustes-nome").value.trim().slice(0, 40);
  const { error } = await sb.rpc("definir_meu_nome", { p_nome: nome });
  if (error) return avisar(/definir_meu_nome/.test(error.message) ? "Falta atualizar o banco (02_historico.sql)." : msgErro(error));
  await carregarMembros();
  render();
  avisar("Nome salvo.");
};
$("btn-sair").onclick = async () => {
  // Quem sair deste celular para de receber os lembretes nele.
  try {
    const sub = suportaPush && (await (await navigator.serviceWorker.ready).pushManager.getSubscription());
    if (sub) { await sb.from("push_inscricoes").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
  } catch (e) { /* sem internet ou sem suporte: segue saindo */ }
  sb.auth.signOut();
};
$("casa-sair").onclick = () => sb.auth.signOut();

$("btn-exportar").onclick = () => {
  const cab = ["Data", "Descrição", "Tipo", "Categoria", "Valor", "Pago", "Recorrente", "Parcela", "Saldo"];
  const linhas = estado.lancs.map((l) => [
    l.data.split("-").reverse().join("/"), l.descricao, rotTipo(l.tipo), catInfo(l.tipo, categoriaDe(l)).nome,
    mostrarValor(Number(l.valor)), l.pago ? "Sim" : "Não", l.recorrente ? "Sim" : "",
    l.parcelas ? `${l.parcela}/${l.parcelas}` : "", mostrarValor(estado.saldoApos.get(l.id)),
  ]);
  const csv = [cab, ...linhas].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `financas-${hoje()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

// ---------- login ----------

let modoCadastro = false;
$("login-alternar").onclick = () => {
  modoCadastro = !modoCadastro;
  $("login-tit").textContent = modoCadastro ? "Criar sua conta" : "Bom te ver de novo";
  $("login-btn").textContent = modoCadastro ? "Criar conta" : "Entrar";
  $("login-alternar").textContent = modoCadastro ? "Já tenho conta" : "Criar conta";
  $("login-sub").textContent = modoCadastro ? "Use seu e-mail e uma senha com pelo menos 6 caracteres." : "Entre com seu e-mail e senha.";
  $("login-senha").autocomplete = modoCadastro ? "new-password" : "current-password";
  $("login-erro").textContent = "";
};

$("form-login").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = $("login-email").value.trim();
  const password = $("login-senha").value;
  const btn = $("login-btn");
  btn.disabled = true;
  $("login-erro").textContent = "";
  try {
    if (modoCadastro) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) throw error;
      if (!data.session) { $("login-erro").textContent = "Conta criada. Abra o e-mail de confirmação e depois volte para entrar."; return; }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (e) {
    $("login-erro").textContent = msgErro(e);
  } finally {
    btn.disabled = false;
  }
});

$("login-esqueci").onclick = async () => {
  const email = $("login-email").value.trim();
  if (!email) { $("login-erro").textContent = "Digite seu e-mail acima e toque de novo em \"Esqueci a senha\"."; return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  $("login-erro").textContent = error ? msgErro(error) : "Enviamos um link para trocar a senha no seu e-mail.";
};

$("form-nova-senha").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const { error } = await sb.auth.updateUser({ password: $("nova-senha").value });
  if (error) { $("nova-senha-erro").textContent = msgErro(error); return; }
  avisar("Senha trocada.");
  abrirCasa();
});

$("form-casa").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("casa-erro").textContent = "";
  const { error } = await sb.rpc("entrar_na_casa", { p_codigo: $("casa-codigo").value });
  if (error) { $("casa-erro").textContent = msgErro(error); return; }
  abrirCasa();
});

// ---------- PWA ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

iniciar();
