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
// Guardar e resgatar mexem no saldo da conta, mas não são gasto nem renda.
const ehCaixinha = (l) => !!l.caixinha_id;
const iconeDe = (l) => (l.caixinha_id ? caixaIcone(caixinhaDe(l.caixinha_id)?.icone) : catInfo(l.tipo, categoriaDe(l)).icone);
const nomeCatDe = (l) => (l.caixinha_id ? `Caixinha ${caixinhaDe(l.caixinha_id)?.nome || ""}`.trim() : catInfo(l.tipo, categoriaDe(l)).nome);

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
  caixinhas: null,       // dinheiro guardado; null se a tabela não existe (07_caixinhas.sql)
  pendentes: new Set(),  // ids esperando internet
  filtroCat: null,
  categoriaSel: null,
  cargaFalhou: false,    // a última atualização não veio: a tela pode estar velha
  aoVivo: false,         // canal de mudanças em tempo real conectado
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
// Põe a data no dia pedido; se o mês não tem esse dia, no último dia do mês.
function noDia(s, dia) {
  const ultimo = Number(fimDoMes(s.slice(0, 7)).slice(8));
  return s.slice(0, 8) + String(Math.min(dia, ultimo)).padStart(2, "0");
}
// Dia da conta fixa: o mais comum nos últimos meses de 31 dias (num mês curto o 31 vira 30 ou 28 e não serve).
function diaDaSerie(ls) {
  const longos = ls.filter((l) => fimDoMes(l.data.slice(0, 7)).endsWith("31")).slice(-4);
  const base = (longos.length ? longos : ls.slice(-1)).map((l) => Number(l.data.slice(8))).reverse();
  const conta = new Map();
  for (const d of base) conta.set(d, (conta.get(d) || 0) + 1);
  return base.reduce((m, d) => (conta.get(d) > conta.get(m) ? d : m), base[0]);
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
  else if ((s.match(/\./g) || []).length > 1 || /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, "");
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
  if (/rate limit|only request this after/i.test(m)) return "Muitos e-mails em pouco tempo. Espere alguns minutos e tente de novo.";
  if (/should be different from the old password/i.test(m)) return "A senha nova precisa ser diferente da antiga.";
  if (/Password should be at least/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  return m;
}

// Grava de volta linhas inteiras (usado para desfazer e restaurar).
async function regravar(linhas) {
  if (!linhas.length) return;
  const { error } = await sb.from("lancamentos").upsert(linhas.map((l) => ({ ...l })));
  if (error) throw error;
}
// Linhas apagadas encolhem e esmaecem antes de a lista ser redesenhada.
async function despedir(ids) {
  const linhas = ids.map((id) => document.querySelector(`[data-editar="${id}"]`)?.closest(".item")).filter(Boolean);
  if (!linhas.length) return;
  for (const el of linhas) el.classList.add("saindo");
  await new Promise((r) => setTimeout(r, 170));
}

// Desfazer uma edição: volta só os campos editáveis de quem ainda existe.
async function voltarCampos(linhas) {
  const rs = await Promise.all(linhas.map((x) => sb.from("lancamentos").update({
    descricao: x.descricao, tipo: x.tipo, valor: x.valor, data: x.data, pago: x.pago,
    ...(estado.temCategoria ? { categoria: x.categoria } : {}),
  }).eq("id", x.id)));
  const r = rs.find((x) => x.error);
  if (r) throw r.error;
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
  // Veio do link do e-mail de trocar senha: fica na tela de nova senha até salvar.
  const doLink = new URLSearchParams(location.hash.slice(1) + "&" + location.search.slice(1));
  estado.recuperando = doLink.get("type") === "recovery";
  const erroLink = doLink.get("error_code") || doLink.get("error");
  sb.auth.onAuthStateChange((evento, sessao) => {
    if (evento === "PASSWORD_RECOVERY") { estado.recuperando = true; estado.sessao = sessao; mostrarTela("tela-nova-senha"); return; }
    const antes = estado.sessao?.user?.id;
    estado.sessao = sessao;
    if (evento === "SIGNED_OUT") { sairLimpo(); return; }
    if (evento === "SIGNED_IN" && antes !== sessao?.user?.id) setTimeout(abrirCasa, 0);
  });
  const { data } = await sb.auth.getSession();
  estado.sessao = data.session;
  if (erroLink) {
    history.replaceState(null, "", location.pathname);
    mostrarTela("tela-login");
    $("login-erro").textContent = /expired|invalid/i.test(doLink.get("error_description") || erroLink)
      ? "Esse link já foi usado ou venceu. Peça um novo em \"Esqueci a senha\" e use o e-mail mais recente."
      : "Não deu para abrir o link do e-mail. Peça um novo em \"Esqueci a senha\".";
    return;
  }
  if (estado.recuperando && estado.sessao) { mostrarTela("tela-nova-senha"); return; }
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
      limites: estado.limites ? [...estado.limites.entries()] : null, caixinhas: estado.caixinhas, quando: Date.now(),
    }));
  } catch (e) { /* armazenamento cheio ou bloqueado: segue sem cache */ }
}
function limparCache() { try { localStorage.removeItem(CHAVE_CACHE); } catch (e) {} }

async function abrirCasa() {
  if (estado.recuperando) { mostrarTela("tela-nova-senha"); return; }
  if (!estado.sessao) { mostrarTela("tela-login"); return; }
  estado.mes = estado.mes || hoje().slice(0, 7);
  const cache = lerCache();
  if (cache) {
    estado.casa = cache.casa;
    estado.membros = new Map(cache.membros);
    estado.seriesDb = cache.series ? new Map(cache.series) : null;
    estado.limites = cache.limites ? new Map(cache.limites) : null;
    estado.caixinhas = cache.caixinhas || null;
    mostrarTela("tela-app");
    definirLancs(aplicarFila(cache.lancs));
  }
  const { data, error } = await sb.from("membros").select("casa_id, casas(id, nome, codigo)").limit(1);
  if (error) {
    if (cache) { avisar(ehErroRede(error) ? `Sem internet. Mostrando os dados de ${quando(cache.quando)}.` : msgErro(error)); return; }
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
  if (error) { avisar("Não consegui criar os próximos meses das contas fixas: " + msgErro(error)); return; }
  if (data > 0) await carregar();
}

async function carregarMembros() {
  let r = await sb.from("membros").select("user_id, nome, email").eq("casa_id", estado.casa.id);
  // Banco ainda sem as colunas de nome (antes do 02_historico.sql).
  if (r.error?.code === "42703") r = await sb.from("membros").select("user_id").eq("casa_id", estado.casa.id);
  if (r.error) { avisar(msgErro(r.error)); return; } // mantém os nomes que já estavam na tela
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

// Devolve false quando não conseguiu atualizar; a tela mostra o aviso até a próxima carga boa.
let seqCarga = 0;
const tabelaAusente = (r) => /^(42P01|PGRST205)$/.test(r.error?.code || "");
async function carregar() {
  const seq = ++seqCarga;
  const todos = new Map();
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from("lancamentos").select("*")
      .eq("casa_id", estado.casa.id).order("data").order("criado_em").order("id").range(de, de + 999);
    if (error) {
      if (seq === seqCarga) { estado.cargaFalhou = true; render(); avisar(msgErro(error)); }
      return false;
    }
    for (const l of data) todos.set(l.id, l);
    if (data.length < 1000) break;
  }
  const [s, lim, cx, hi] = await Promise.all([
    sb.from("series").select("*").eq("casa_id", estado.casa.id),
    sb.from("limites").select("categoria, valor").eq("casa_id", estado.casa.id),
    sb.from("caixinhas").select("*").eq("casa_id", estado.casa.id).order("ordem").order("criado_em"),
    sb.from("historico").select("user_id, acao, quando, antes, depois").eq("casa_id", estado.casa.id).order("quando", { ascending: false }).limit(40),
  ]);
  if (!hi.error) estado.recentes = hi.data;
  if (seq !== seqCarga) return true; // uma carga mais nova já está a caminho
  // Só "tabela não existe" desliga o recurso; erro passageiro mantém o que já estava.
  if (!s.error || tabelaAusente(s)) estado.seriesDb = s.error ? null : new Map(s.data.map((x) => [x.grupo, x]));
  if (!lim.error || tabelaAusente(lim)) estado.limites = lim.error ? null : new Map(lim.data.map((x) => [x.categoria, Number(x.valor)]));
  if (!cx.error || tabelaAusente(cx)) estado.caixinhas = cx.error ? null : cx.data;
  const falha = [s, lim, cx].find((r) => r.error && !tabelaAusente(r));
  estado.cargaFalhou = !!falha;
  definirLancs(aplicarFila([...todos.values()]));
  if (falha) { avisar(msgErro(falha.error)); return false; }
  gravarCache();
  return true;
}

// ---------- sem internet: lançar e dar check ficam guardados e vão depois ----------

const CHAVE_FILA = "fin-fila-v1", CHAVE_RECUSADOS = "fin-fila-recusados-v1";
function lerCrua(chave = CHAVE_FILA) { try { return JSON.parse(localStorage.getItem(chave)) || []; } catch (e) { return []; } }
function lerFila() { return lerCrua().filter((o) => o.casa === estado.casa?.id); }
function gravarFila(f, chave = CHAVE_FILA) { try { localStorage.setItem(chave, JSON.stringify(f)); return true; } catch (e) { return false; } }
function recusados() { return lerCrua(CHAVE_RECUSADOS).filter((o) => o.casa === estado.casa?.id); }
const ehErroRede = (e) => !navigator.onLine || /fetch|NetworkError|Load failed|network/i.test((e && e.message) || String(e));
// Dado inválido, regra do banco ou permissão: tentar de novo não resolve.
const ehRecusaDefinitiva = (e) => /^(22|23|42|PGRST2)/.test(e?.code || "");
function enfileirar(op) {
  if (!gravarFila([...lerCrua(), { ...op, qid: crypto.randomUUID(), casa: estado.casa.id }])) {
    throw new Error("Sem espaço para guardar no aparelho. Conecte à internet e tente de novo.");
  }
}
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
  // Itens de versões antigas ainda sem id próprio.
  const crua = lerCrua();
  if (crua.some((o) => !o.qid)) gravarFila(crua.map((o) => (o.qid ? o : { ...o, qid: crypto.randomUUID() })));
  const fila = lerFila();
  if (!fila.length) return;
  enviandoFila = true;
  let enviados = 0, recusou = 0;
  try {
    for (const o of fila) {
      const r = o.op === "insert"
        ? await sb.from("lancamentos").upsert(o.linhas)
        : await sb.from("lancamentos").update(o.campos).eq("id", o.id);
      if (r.error && !ehRecusaDefinitiva(r.error)) break; // rede, servidor fora, sessão vencida: tenta depois
      if (r.error) { gravarFila([...lerCrua(CHAVE_RECUSADOS), { ...o, erro: msgErro(r.error) }], CHAVE_RECUSADOS); recusou++; }
      else enviados++;
      gravarFila(lerCrua().filter((x) => x.qid !== o.qid));
    }
  } finally { enviandoFila = false; }
  if (enviados || recusou) {
    await carregar();
    avisar(recusou
      ? `${recusou === 1 ? "1 item guardado foi recusado" : `${recusou} itens guardados foram recusados`} pelo banco. Veja o aviso na tela.`
      : enviados === 1 ? "O que estava guardado foi enviado." : `${enviados} itens guardados foram enviados.`);
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
    if (l.categoria && !l.caixinha_id) estado.aprendidas.set(l.tipo + "|" + normalizar(l.descricao), l.categoria);
  }
  estado.saldoApos = new Map();
  let s = 0;
  for (const l of lista) { s += sinal(l); estado.saldoApos.set(l.id, r2(s)); }
  render();
}

let recarregarTimer;
// Mudanças da outra pessoa chegam na hora; a presença diz quem está com o app aberto agora.
function assinarMudancas() {
  if (estado.canal) sb.removeChannel(estado.canal);
  const eu = estado.sessao?.user?.id || "eu";
  const canal = sb.channel("lanc-" + estado.casa.id, { config: { presence: { key: eu } } });
  estado.canal = canal
    .on("postgres_changes", { event: "*", schema: "public", table: "lancamentos", filter: `casa_id=eq.${estado.casa.id}` }, () => {
      clearTimeout(recarregarTimer);
      recarregarTimer = setTimeout(carregar, 400);
    })
    .on("presence", { event: "sync" }, () => {
      estado.abertos = Object.keys(canal.presenceState()).length;
      atualizarSelo();
    })
    .subscribe(async (st) => {
      const antes = estado.aoVivo;
      estado.aoVivo = st === "SUBSCRIBED";
      if (estado.aoVivo && document.visibilityState === "visible") await canal.track({ desde: Date.now() }).catch(() => {});
      if (antes !== estado.aoVivo) atualizarSelo();
    });
}
// App em segundo plano sai da contagem de quem está junto.
document.addEventListener("visibilitychange", () => {
  if (!estado.canal || !estado.aoVivo) return;
  if (document.visibilityState === "visible") estado.canal.track({ desde: Date.now() }).catch(() => {});
  else estado.canal.untrack().catch(() => {});
});

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
  const u = s.ultimo, dia = diaDaSerie(s.ls);
  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(), casa_id: estado.casa.id, descricao: u.descricao, tipo: u.tipo, valor: u.valor,
    data: s.semanal ? somarDias(u.data, 7 * (i + 1)) : noDia(somarMeses(u.data, i + 1), dia),
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
        <small class="num">${s.semanal ? ((w) => (w === 0 || w === 6 ? "todo " : "toda ") + DIAS_SEMANA[w])(deIso(s.ultimo.data).getDay()) : "todo mês"} · ${brl.format(Number(s.ultimo.valor))} · ${s.semFim ? "sem data para acabar" : acabando.has(s.grupo) ? `<b style='color:var(--aviso-atencao)'>acaba</b> ${dataMedia(s.ultimo.data)}` : `${s.ultimo.data < hoje() ? "acabou" : "vai até"} ${dataMedia(s.ultimo.data)}`}</small>
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
  } catch (err) { await carregar(); renderSeries(); avisar(msgErro(err)); }
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

// Barras finas do saldo previsto, uma por dia; a de hoje acesa, as negativas descem em vermelho.
function barrasDiaHtml(pts, hj, m) {
  const W = 340, H = 86, n = pts.length, passo = W / n, larg = Math.max(3, passo * 0.56);
  const vals = pts.map((p) => p.saldo);
  const max = Math.max(...vals, 0), min = Math.min(...vals, 0), faixa = max - min || 1;
  const zero = min < 0 ? Math.min((max / faixa) * H, H - 9) : (max / faixa) * H;
  const iHoje = pts.findIndex((p) => p.data === hj);
  const temNeg = min < 0;
  const barras = pts.map((p, i) => {
    const alt = Math.max(p.saldo < 0 ? 7 : 2, (Math.abs(p.saldo) / faixa) * H);
    const y = p.saldo >= 0 ? zero - alt : zero;
    const cor = p.saldo < 0 ? "var(--vermelho)" : "var(--primaria)";
    const op = i === iHoje ? 1 : p.data < hj ? 0.32 : 0.7;
    return `<rect x="${(i * passo + (passo - larg) / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${larg.toFixed(1)}" height="${alt.toFixed(1)}" rx="${Math.min(2, larg / 2).toFixed(1)}" fill="${cor}" opacity="${op}"/>`;
  }).join("");
  const marca = iHoje >= 0 ? `<circle cx="${(iHoje * passo + passo / 2).toFixed(1)}" cy="${(pts[iHoje].saldo >= 0 ? zero - Math.max(2, (pts[iHoje].saldo / faixa) * H) : zero + Math.max(2, (-pts[iHoje].saldo / faixa) * H)) - (pts[iHoje].saldo >= 0 ? 7 : -7)}" r="3" fill="var(--primaria)"/>` : "";
  const menor = pts.reduce((a, p) => (p.saldo < a.saldo ? p : a), pts[0]);
  const frente = pts.filter((p) => p.data >= hj);
  const menorFrente = frente.reduce((a, p) => (p.saldo < a.saldo ? p : a), frente[0]);
  const ult = pts[n - 1];
  const marcas = [0, 7, 14, 21].filter((i) => i < n - 3).map((i) => `<span>${pts[i].data.slice(8)}</span>`).join("") + `<span>${ult.data.slice(8)}</span>`;
  barrasDados = { pts };
  const passado = m.mes < hj.slice(0, 7);
  const sobraMes = r2(m.entradas - m.saidas - Math.max(0, m.guardado));
  const frase = `No mês ${passado ? "entraram" : "entram"} <b class="num">${brl.format(m.entradas)}</b> e ${passado ? "saíram" : "saem"} <b class="num">${brl.format(m.saidas + Math.max(0, m.guardado))}</b>${m.guardado > 0 ? `, contando <b class="num">${brl.format(m.guardado)}</b> guardados` : ""}: ${sobraMes >= 0 ? "sobram" : "faltam"} <b class="num">${brl.format(Math.abs(sobraMes))}</b> do próprio mês.` +
    (Math.abs(m.inicio) >= 0.01 ? ` Com os <b class="num">${brl.format(m.inicio)}</b> que vieram de ${nomeDoMes(somarMeses(m.mes + "-01", -1))}, o dia ${n} fecha com <b class="num">${brl.format(m.fimMes)}</b>.` : "");
  return `<figure class="barras" style="margin-left:0;margin-right:0">
    <div class="barras-cab"><span>Saldo dia a dia</span><span class="selo">${iHoje >= 0 ? `hoje ${hj.slice(8)}` : `${n} dias`}</span></div>
    <div class="barras-area" data-barras>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Saldo de cada dia, de ${dataCurta(pts[0].data)} a ${dataCurta(ult.data)}, terminando em ${brl.format(ult.saldo)}">${barras}${marca}${temNeg ? `<line x1="0" x2="${W}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}" stroke="var(--vermelho)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" opacity=".7"/>` : ""}</svg>
      <div class="dica" hidden></div>
    </div>
    <div class="eixo">${marcas}</div>
    <p class="barras-frase">${frase}</p>
    <p class="nota-barras">Cada barra é o saldo do dia contando também o que ainda não tem check. Toque numa barra para ver o valor.</p>
    ${menor.saldo < 0 ? `<p>Abaixo da linha vermelha o saldo fica negativo. O ponto mais baixo é <b class="num">${brl.format(menor.saldo)}</b> em ${dataCurta(menor.data)}.</p>`
      : frente.length && !/apertado/.test(m.apoio || "") ? `<p>O ponto mais baixo daqui para frente é <b class="num" style="color:var(--ink)">${brl.format(menorFrente.saldo)}</b> em ${dataCurta(menorFrente.data)}.</p>` : ""}
  </figure>`;
}

// Tocar numa barra mostra o saldo daquele dia.
let barrasDados = null;
function dicaBarras(ev) {
  const area = ev.target.closest("[data-barras]");
  if (!area || !barrasDados) return;
  const { pts } = barrasDados, n = pts.length;
  const r = area.getBoundingClientRect();
  const f = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
  const i = Math.min(n - 1, Math.floor(f * n));
  const p = pts[i], dica = area.querySelector(".dica");
  dica.innerHTML = `<b>${dataCurta(p.data)}</b><span>saldo <b class="num">${brl.format(p.saldo)}</b></span>`;
  dica.hidden = false;
  dica.style.left = `${Math.min(Math.max(((i + 0.5) / n) * 100, 18), 82)}%`;
}
function tirarDica(ev) {
  const area = ev.target.closest?.("[data-barras]");
  if (area) area.querySelector(".dica").hidden = true;
}
$("conteudo").addEventListener("pointermove", dicaBarras);
$("conteudo").addEventListener("pointerdown", dicaBarras);
$("conteudo").addEventListener("pointerleave", tirarDica, true);
$("conteudo").addEventListener("pointerup", (ev) => { if (ev.pointerType !== "mouse") setTimeout(() => tirarDica(ev), 1600); });

// Quando o mês aperta (fica negativo ou chega perto de zero), a frase de apoio já diz o dia.
function aperto(pts, hj, entradas) {
  const frente = pts.filter((p) => p.data >= hj);
  if (!frente.length) return "";
  const neg = frente.find((p) => p.saldo < 0);
  if (neg) return ` <span class="aperto neg">O saldo fica negativo a partir do dia ${Number(neg.data.slice(8))}.</span>`;
  const menor = frente.reduce((a, p) => (p.saldo < a.saldo ? p : a), frente[0]);
  const limiar = Math.max(200, entradas * 0.05);
  return menor.saldo < limiar ? ` <span class="aperto">O dia mais apertado é ${Number(menor.data.slice(8))}, com <b class="num">${brl.format(menor.saldo)}</b>.</span>` : "";
}

// O que pede ação agora: o que passou da data sem check e o que é de hoje.
function hojeHtml(hj) {
  const atrasados = estado.lancs.filter((l) => !l.pago && l.data < hj);
  const deHoje = estado.lancs.filter((l) => l.data === hj);
  const pagarAtras = atrasados.filter((l) => l.tipo === "despesa"), receberAtras = atrasados.filter((l) => l.tipo === "receita");
  const semCheckHoje = deHoje.filter((l) => !l.pago);
  const titulo = atrasados.length ? "Hoje e pendentes" : "Hoje";
  const cab = `<div class="hoje-cab" id="hoje"><span>${titulo} · ${nomeDia.format(deIso(hj))}</span>${semCheckHoje.length > 1 ? `<button class="link" type="button" data-check-hoje>Check em tudo de hoje</button>` : ""}</div>`;
  if (!atrasados.length && !deHoje.length) {
    return `<section class="bloco-hoje">${cab}<div class="em-dia"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Nada para hoje. Está tudo em dia.</span></div></section>`;
  }
  // "depois" só no último sem check de hoje: é como a conta fica quando tudo de hoje tiver check.
  const naConta = r2(estado.lancs.reduce((s, l) => (l.pago ? s + sinal(l) : s), 0));
  const ultimo = semCheckHoje[semCheckHoje.length - 1];
  const fimHoje = r2(naConta + semCheckHoje.reduce((s, l) => s + sinal(l), 0));
  const sub = (t, cls = "") => `<div class="lista-sub ${cls}">${t}</div>`;
  const linhas = [
    pagarAtras.length ? sub(pagarAtras.length === 1 ? "Passou da data sem check" : `${pagarAtras.length} passaram da data sem check`, "atencao") + pagarAtras.map((l) => itemHtml(l, hj, { data: true, semEstado: true })).join("") : "",
    receberAtras.length ? sub("Ainda não entrou") + receberAtras.map((l) => itemHtml(l, hj, { data: true, semEstado: true })).join("") : "",
    deHoje.length ? (atrasados.length ? sub("De hoje") : "") + deHoje.map((l) => itemHtml(l, hj, { saldo: l === ultimo, depois: l === ultimo ? fimHoje : undefined })).join("") : "",
  ].join("");
  return `<section class="bloco-hoje" aria-label="${titulo}">${cab}
    <div class="lista">${linhas}</div>
    ${!deHoje.length ? '<div class="nada-hoje">Nada lançado para hoje.</div>' : !semCheckHoje.length ? '<div class="nada-hoje">O de hoje já tem check.</div>' : ""}
  </section>`;
}

// A última coisa que a outra pessoa fez (dar check conta), para responder "ele pagou a luz?".
function ultimaAcao() {
  const eu = estado.sessao?.user?.id;
  const doHist = (estado.recentes || []).map((h) => {
    const l = h.depois || h.antes || {};
    let txt;
    if (h.acao === "criou") txt = `lançou ${esc(l.descricao || "")}`;
    else if (h.acao === "apagou") txt = `apagou ${esc(l.descricao || "")}`;
    else if (h.antes && h.depois && !h.antes.pago && h.depois.pago) txt = `${l.tipo === "receita" ? "marcou como recebido" : "deu check em"} ${esc(l.descricao || "")}`;
    else txt = `alterou ${esc(l.descricao || "")}`;
    return { uid: h.user_id, quando: h.quando, txt };
  }).filter((a) => a.uid);
  // Sem histórico (banco antigo), usa quem criou cada lançamento.
  const lista = doHist.length ? doHist : estado.lancs.filter((l) => l.criado_por)
    .map((l) => ({ uid: l.criado_por, quando: l.criado_em, txt: `lançou ${esc(l.descricao)}` }))
    .sort((a, b) => b.quando.localeCompare(a.quando));
  return lista.find((a) => a.uid !== eu) || lista[0] || null;
}

// "há 5 min", "hoje às 9h12", "ontem", "12/10": quanto tempo faz, em vez de uma data solta.
function haQuanto(ts) {
  const d = new Date(ts), min = Math.round((Date.now() - d) / 6e4);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const dia = iso(d), hj = hoje();
  const hora = `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
  if (dia === hj) return `hoje às ${hora}`;
  if (dia === somarDias(hj, -1)) return `ontem às ${hora}`;
  return dataCurta(dia);
}

// "juntos ON" só com os dois de app aberto; "ON" quando é um só.
function seloHtml(pessoas = estado.membros.size) {
  const conectado = navigator.onLine && estado.aoVivo;
  const txt = !navigator.onLine ? "sem internet" : !estado.aoVivo ? "conectando"
    : pessoas < 2 ? "esperando a outra pessoa" : (estado.abertos || 1) >= 2 ? "juntos ON" : "ON";
  return `<span class="selo ${conectado ? "" : "off"} ${txt === "juntos ON" ? "juntos" : ""}" aria-live="polite">${txt}</span>`;
}
function atualizarSelo() {
  const s = document.querySelector(".casal .selo");
  if (s) s.outerHTML = seloHtml();
}

// Quem é a pessoa 1 e a 2 da casa, para a cor de cada um.
function ordemDe(uid) {
  const ids = [...estado.membros.keys()];
  const i = ids.indexOf(uid);
  return i < 0 ? 0 : (i % 2) + 1;
}

function casalHtml() {
  const ids = [...estado.membros.keys()].slice(0, 2);
  if (!ids.length && estado.sessao) ids.push(estado.sessao.user.id);
  const nomes = ids.map((u) => nomeDe(u));

  const acao = ultimaAcao();
  return `<div class="casal">
    <span class="pares" aria-hidden="true">${ids.map((u, i) => `<span class="ini bg-q${i + 1}">${esc((nomeDe(u) || "?").charAt(0).toUpperCase())}</span>`).join("")}</span>
    <span class="nomes">${esc(nomes.join(" e "))}</span>
    ${seloHtml(ids.length)}
  </div>${acao ? `<p class="ultimo"><i class="q${ordemDe(acao.uid)}"></i><span><b>${esc(nomeDe(acao.uid))}</b> ${acao.txt}, ${haQuanto(acao.quando)}.</span></p>` : ""}`;
}

const nBrl = (v, k = "") => `<span class="n num ${v < 0 ? "neg" : ""}" data-n="${k}">${brl.format(v)}</span>`;
// Lembra os números da frase para animar só o que mudou no mesmo mês.
let fraseAntes = { mes: null, hoje: null, fim: null };

function render() {
  const mes = estado.mes, hj = hoje(), mesAtual = hj.slice(0, 7);
  const tituloMes = nomeMes.format(deIso(mes + "-01"));
  $("mes-nome").textContent = (tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1)).replace(" de ", " ");
  $("ir-hoje").hidden = mes === mesAtual;
  const fim = fimDoMes(mes);
  const doMes = estado.lancs.filter((l) => l.data.startsWith(mes));
  const naConta = r2(estado.lancs.reduce((s, l) => (l.pago ? s + sinal(l) : s), 0));
  const fimMes = saldoAte(fim);
  const entradas = doMes.filter((l) => l.tipo === "receita" && !ehCaixinha(l)).reduce((s, l) => s + Number(l.valor), 0);
  const saidas = doMes.filter((l) => l.tipo === "despesa" && !ehCaixinha(l)).reduce((s, l) => s + Number(l.valor), 0);
  const pts = pontosDoMes(mes);

  // A home abre com uma frase: no mês atual, hoje e o fim do mês; nos outros, como o mês termina.
  const dia = Number(fim.slice(8));
  const aPagar = doMes.filter((l) => !l.pago && l.tipo === "despesa" && !ehCaixinha(l)).reduce((s, l) => s + Number(l.valor), 0);
  const aReceber = doMes.filter((l) => !l.pago && l.tipo === "receita" && !ehCaixinha(l)).reduce((s, l) => s + Number(l.valor), 0);
  const guardado = guardadoEm(doMes);
  let titulo, apoio;
  if (mes === mesAtual) {
    titulo = `Hoje, ${nBrl(naConta, "hoje")}.<span class="l2">Dia ${dia}, ${nBrl(fimMes, "fim")}.</span>`;
    const partes = [aPagar && `faltam pagar <b class="num">${brl.format(aPagar)}</b>`, aReceber && `entrar <b class="num">${brl.format(aReceber)}</b>`].filter(Boolean);
    apoio = (partes.length ? `Até lá ${partes.join(" e ")}` : doMes.length ? "Tudo do mês já tem check" : `Nada lançado em ${nomeDoMes(mes)} ainda`) +
      (guardado > 0 ? `, e vocês guardam <b class="num">${brl.format(guardado)}</b>.` : ".") + aperto(pts, hj, entradas);
  } else {
    titulo = mes > mesAtual
      ? `Hoje, ${nBrl(naConta, "hoje")}.<span class="l2">Dia ${dia}, ${nBrl(fimMes, "fim")}.</span>`
      : `${nomeDoMes(mes).charAt(0).toUpperCase() + nomeDoMes(mes).slice(1)} fechou com ${nBrl(fimMes, "fim")}.`;
    const inicio = saldoAte(somarDias(mes + "-01", -1));
    apoio = (mes > mesAtual ? `${nomeDoMes(mes).charAt(0).toUpperCase() + nomeDoMes(mes).slice(1)} começa com <b class="num">${brl.format(inicio)}</b> que sobram de ${nomeDoMes(somarMeses(mes + "-01", -1))}. ` : "") +
      `${mes > mesAtual ? "Entram" : "Entraram"} <b class="num">${brl.format(entradas)}</b> e ${mes > mesAtual ? "saem" : "saíram"} <b class="num">${brl.format(saidas)}</b>` +
      (guardado > 0 ? `; <b class="num">${brl.format(guardado)}</b> ${mes > mesAtual ? "vão" : "foram"} para as caixinhas.` : ".") + (mes > mesAtual ? aperto(pts, hj, entradas) : "");
  }
  const inicioMes = saldoAte(somarDias(mes + "-01", -1));
  const blocoHoje = mes === mesAtual ? hojeHtml(hj) : "";

  // Avisos, cada um leva ao que precisa ser feito.
  const avisos = [];
  const menor = pts.reduce((a, p) => (p.saldo < a.saldo ? p : a), pts[0]);
  if (menor.saldo < 0 && fim >= hj && mes < mesAtual) {
    const primeiro = pts.find((p) => p.saldo < 0 && p.data >= hj) || menor;
    avisos.push(`<button class="aviso ruim" data-ir-dia="${primeiro.data}">${IC.alerta}<span>O saldo previsto fica negativo em ${dataCurta(primeiro.data)}: <b class="num">${brl.format(primeiro.saldo)}</b>.</span>${IC.ir}</button>`);
  }
  const atrasados = estado.lancs.filter((l) => !l.pago && l.data < hj);
  if (atrasados.length && mes !== mesAtual) {
    const receber = atrasados.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
    const pagar = atrasados.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
    const partes = [receber && `${brl.format(receber)} a receber`, pagar && `${brl.format(pagar)} a pagar`].filter(Boolean).join(" e ");
    avisos.push(`<button class="aviso atencao" data-ir-atrasados="${atrasados[0].data.slice(0, 7)}">${IC.alerta}<span>${atrasados.length === 1 ? "1 lançamento passou" : `${atrasados.length} lançamentos passaram`} da data sem check: ${partes}.</span>${IC.ir}</button>`);
  }
  if (estado.cargaFalhou) {
    avisos.unshift(`<button class="aviso atencao" data-recarregar>${IC.alerta}<span>Não consegui atualizar agora. O que está na tela pode estar desatualizado. Tocar para tentar de novo.</span>${IC.ir}</button>`);
  }
  const rec = recusados();
  if (rec.length) {
    avisos.unshift(`<button class="aviso ruim" data-ver-recusados>${IC.alerta}<span>${rec.length === 1 ? "1 item feito sem internet foi recusado" : `${rec.length} itens feitos sem internet foram recusados`} pelo banco e não entrou no saldo.</span>${IC.ir}</button>`);
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
    const acabando = seriesAcabando().filter((s) => s.ultimo.data <= somarDias(hj, 21));
    if (acabando.length) {
      const ate = acabando[acabando.length - 1].ultimo.data;
      avisos.push(`<button class="aviso info" data-abrir-series>${IC.repetir}<span>${acabando.length === 1 ? `"${esc(acabando[0].ultimo.descricao)}" acaba` : `${acabando.length} contas fixas acabam`} até ${mesCurto(ate)}. Toque para criar os próximos meses.</span>${IC.ir}</button>`);
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

  if (!estado.lancs.length) {
    $("conteudo").innerHTML = `<div class="grade"><section class="col-resumo">${casalHtml()}${boasVindasHtml()}</section><section class="col-extrato"></section></div>`;
    return;
  }
  $("conteudo").innerHTML = `<div class="grade">
    <section class="col-resumo">
      ${casalHtml()}
      ${faltaPoucoHtml()}
      <div class="frase"><h2>${titulo}</h2><p>${apoio}</p>${mes === mesAtual ? '<button class="link conferir" type="button" data-conferir>Conferir com o banco</button>' : ""}</div>
      ${blocoHoje}
      ${avisos.length ? `<div class="avisos">${avisos.join("")}</div>` : ""}
      ${barrasDiaHtml(pts, hj, { mes, entradas, saidas, guardado, inicio: inicioMes, fimMes, apoio })}
      <nav class="atalhos" aria-label="Mais">
      ${doMes.length ? `<button class="linha-resumo" data-abrir-resumo>${svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')}<span>Para onde foi<small>${MESES[Number(mes.slice(5)) - 1]}/${mes.slice(2, 4)}</small></span>${IC.ir}</button>` : ""}
      ${estado.caixinhas ? `<button class="linha-resumo" data-abrir-caixinhas>${caixaIcone("cofre")}<span>${estado.caixinhas.some((c) => !c.arquivada)
        ? `Caixinhas<small class="num">${brl.format(totalGuardado())}</small>`
        : "Guardar dinheiro<small>caixinhas</small>"}</span>${IC.ir}</button>` : ""}
      ${estado.lancs.length ? `<button class="linha-resumo" data-abrir-ano>${svg('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>')}<span>Como estamos<small>${mes.slice(0, 4)}</small></span>${IC.ir}</button>` : ""}
      </nav>
    </section>
    <section class="col-extrato">
      <nav class="filtros" aria-label="Filtro">${chipCat}${chip("todos", "Todos")}${chip("pendentes", "Sem check")}${chip("despesas", "Despesas")}${chip("receitas", "Receitas")}</nav>
      ${extratoHtml(doMes, mes, hj)}
    </section>
  </div>`;
  if (fraseAntes.mes === mes) {
    for (const [k, v] of [["hoje", naConta], ["fim", fimMes]]) {
      if (fraseAntes[k] !== null && fraseAntes[k] !== v) document.querySelector(`.frase [data-n="${k}"]`)?.classList.add("mudou");
    }
  }
  fraseAntes = { mes, hoje: naConta, fim: fimMes };
  estado.animarPassado = false;
}

function diasHtml(lista, hj, entrar = false) {
  const grupos = new Map();
  for (const l of lista) { if (!grupos.has(l.data)) grupos.set(l.data, []); grupos.get(l.data).push(l); }
  let out = "", i = 0;
  for (const [data, itens] of grupos) {
    const futuro = data >= hj && estado.filtro === "todos";
    out += `<div class="dia ${entrar ? "entra" : ""}" id="dia-${data}"${entrar ? ` style="--i:${Math.min(i++, 6)}"` : ""}>
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
  if (estado.filtro === "pendentes") {
    const lista = doMes.filter((l) => !l.pago);
    return lista.length ? diasHtml(lista, hj) : '<div class="vazio">Nada sem check neste mês.</div>';
  }
  if (estado.filtro === "despesas" || estado.filtro === "receitas") {
    const tipo = estado.filtro === "despesas" ? "despesa" : "receita";
    doMes = doMes.filter((l) => l.tipo === tipo);
    if (!doMes.length) return '<div class="vazio">Nada nesse filtro.</div>';
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
    if (estado.verPassado) out += diasHtml(pagos, hj, estado.animarPassado);
  }
  const mesAtual = mes === hj.slice(0, 7);
  if (atrasados.length && !mesAtual) {
    out += `<div class="secao-tit" id="atrasados">Passaram da data sem check</div>
      <div class="lista">${atrasados.map((l) => itemHtml(l, hj, { data: true })).join("")}</div>`;
  }
  if (mesAtual) {
    // Hoje e atrasados ficam no topo da tela; aqui só a marca do dia, para o extrato seguir.
    if (futuros.length) out += `<div class="hoje-div"><span>Daqui para frente</span></div>`;
  }
  out += diasHtml(futuros, hj);
  return out;
}

function itemHtml(l, hj, op = {}) {
  const passou = !l.pago && l.data < hj;
  const atrasado = passou && l.tipo === "despesa"; // receita que não entrou não é culpa de ninguém
  const baixado = l.pago && l.data < hj;
  const s = op.depois !== undefined ? op.depois : estado.saldoApos.get(l.id);
  const tags = [];
  if (op.data) tags.push(`<span class="tag num">${dataCurta(l.data)}</span>`);
  if (l.parcelas) tags.push(`<span class="tag num">${l.parcela}/${l.parcelas}</span>`);
  if (l.caixinha_id) tags.push(`<span class="tag guardar">${l.tipo === "despesa" ? "guardar" : "resgate"}</span>`);
  else if (l.recorrente) tags.push(`<span class="tag">fixa</span>`);
  // No bloco de hoje o subtítulo já diz o estado; a etiqueta só repetiria.
  if (atrasado && !op.semEstado) tags.push(`<span class="tag atraso">atrasado</span>`);
  else if (passou && !op.semEstado) tags.push(`<span class="tag">não entrou</span>`);
  if (l.criado_por) tags.push(`<span class="tag quem q${ordemDe(l.criado_por)}" title="Lançado por ${esc(nomeDe(l.criado_por))}">${esc(nomeDe(l.criado_por))}</span>`);
  if (Number(l.valor) === 0) tags.push(`<span class="tag definir">valor a definir</span>`);
  if (estado.pendentes.has(l.id)) tags.push(`<span class="tag espera">aguardando internet</span>`);
  const feito = l.tipo === "receita" ? "recebido" : "pago";
  return `<div class="item ${baixado ? "baixado" : ""}">
    <button class="check ${l.pago ? "ok" : ""} ${atrasado ? "atrasado" : ""}" data-check="${l.id}" aria-pressed="${l.pago}" aria-label="${esc(l.descricao)}: ${l.pago ? `tirar check` : `marcar como ${feito}`}"><span class="bola">${IC.check}</span></button>
    <button class="corpo" data-editar="${l.id}">
      <span class="cat-ic ${l.caixinha_id ? "cx" : ""}" title="${esc(nomeCatDe(l))}">${iconeDe(l)}</span>
      <div class="txt">
        <div class="desc">${esc(l.descricao)}</div>
        ${tags.length ? `<div class="meta">${tags.join("")}</div>` : ""}
      </div>
      <div class="dir">
        <div class="valor num ${l.tipo === "receita" ? "pos" : ""}">${l.tipo === "receita" ? "+" : "−"} ${brl.format(Number(l.valor))}</div>
        ${op.saldo && s != null ? `<div class="saldo-linha num ${s < 0 ? "neg" : ""}" title="Saldo depois deste lançamento">depois ${brl.format(s)}</div>` : ""}
      </div>
    </button>
  </div>`;
}

$("conteudo").addEventListener("click", async (ev) => {
  const t = (sel) => ev.target.closest(sel);
  if (t("[data-filtro]")) { estado.filtro = t("[data-filtro]").dataset.filtro; estado.filtroCat = null; render(); return; }
  if (t("[data-limpar-cat]")) { estado.filtroCat = null; render(); return; }
  if (t("[data-abrir-resumo]")) { abrirResumo(); return; }
  if (t("[data-recarregar]")) { if (await carregar()) avisar("Atualizado."); return; }
  if (t("[data-ver-recusados]")) {
    const rec = recusados();
    const desc = (o) => (o.op === "insert" ? o.linhas.map((l) => `${l.descricao} (${brl.format(Number(l.valor))})`).join(", ") : `check em ${estado.lancs.find((l) => l.id === o.id)?.descricao || "um lançamento"}`);
    const ok = await confirmar("Itens recusados", `${rec.map((o) => `${desc(o)}: ${o.erro}`).join(" · ")}. Lance de novo o que ainda faltar e descarte este aviso.`, "Descartar");
    if (ok) { gravarFila(lerCrua(CHAVE_RECUSADOS).filter((o) => o.casa !== estado.casa.id), CHAVE_RECUSADOS); render(); }
    return;
  }
  if (t("[data-abrir-caixinhas]")) { abrirCaixinhas(); return; }
  if (t("[data-conferir]")) { abrirConferir(); return; }
  if (t("[data-check-hoje]")) { await checkEmTudoDeHoje(); return; }
  if (t("[data-abrir-ano]")) { abrirAno(Number(estado.mes.slice(0, 4))); return; }
  if (t("[data-enviar-fila]")) {
    if (!navigator.onLine) { avisar("Ainda sem internet. Assim que conectar, o app envia sozinho."); return; }
    await enviarFila();
    return;
  }
  if (t("[data-check]")) { await alternarPago(t("[data-check]").dataset.check); return; }
  if (t("[data-editar]")) { abrirLanc(estado.lancs.find((l) => l.id === t("[data-editar]").dataset.editar)); return; }
  if (t("[data-alternar-passado]")) { estado.verPassado = !estado.verPassado; estado.animarPassado = estado.verPassado; render(); return; }
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
    try { enfileirar({ op: "update", id, campos: { pago: l.pago } }); } catch (e) { l.pago = antes; render(); avisar(msgErro(e)); return; }
    gravarCache();
    render();
    avisar("Sem internet: o check ficou guardado e vai quando conectar.");
  };
  if (!navigator.onLine) return guardar();
  const { data: feitos, error } = await sb.from("lancamentos").update({ pago: l.pago }).eq("id", id).select("id");
  if (error && ehErroRede(error)) return guardar();
  if (error || !feitos.length) { l.pago = antes; await carregar(); avisar(error ? msgErro(error) : "Esse lançamento foi apagado em outro celular."); return; }
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
  if (e.touches.length !== 1 || e.target.closest(".filtros, .topo, [data-barras]")) { gesto = null; return; }
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

// O botão + sai do caminho enquanto se rola para baixo (não cobre avisos nem valores) e volta ao subir.
let rolagemAntes = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  $("topo").classList.toggle("rolou", y > 4);
  if (Math.abs(y - rolagemAntes) > 8) { $("fab").classList.toggle("escondido", y > rolagemAntes && y > 120); rolagemAntes = y; }
}, { passive: true });

// ---------- painéis ----------

const PAINEIS = ["painel-conferir", "painel-lanc", "painel-ajustes", "painel-historico", "painel-series", "painel-resumo", "painel-busca", "painel-limites", "painel-caixinhas", "painel-caixa", "painel-mov", "painel-ano"];
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
document.addEventListener("click", (e) => { if (e.target.closest("[data-fechar-painel]")) fecharPaineis(); });
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
  preencherSugestoes();
}
function adivinharNoForm() {
  if (catManual) return;
  const d = $("lanc-desc").value.trim();
  estado.categoriaSel = d ? adivinharCategoria(d, tipoSel) : null;
  renderCats();
}
// A categoria aparece num botão; tocar abre o quadro com todas, escolher fecha.
function renderCats() {
  $("lanc-cats").innerHTML = CATS[tipoSel].map(([chave, nome, d]) =>
    `<button type="button" class="cat ${estado.categoriaSel === chave ? "ativo" : ""}" data-cat="${chave}" role="radio" aria-checked="${estado.categoriaSel === chave}">${svg(d)}<span>${nome}</span></button>`).join("");
  const c = estado.categoriaSel && catInfo(tipoSel, estado.categoriaSel);
  $("lanc-cat-btn").innerHTML = c
    ? `<span class="cat-ic">${c.icone}</span><span class="nome">${esc(c.nome)}</span>${IC.baixo}`
    : `<span class="nome vazio-cat">Escolher categoria</span>${IC.baixo}`;
}
function abrirCats(abrir) {
  $("lanc-cats").classList.toggle("aberta", abrir);
  $("lanc-cat-btn").setAttribute("aria-expanded", abrir);
}
$("lanc-cat-btn").onclick = () => abrirCats(!$("lanc-cats").classList.contains("aberta"));
$("lanc-cats").onclick = (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  estado.categoriaSel = b.dataset.cat;
  catManual = true;
  renderCats();
  abrirCats(false);
};
$("lanc-desc").addEventListener("input", adivinharNoForm);
function escopoSerie(e) {
  estado.escopoSerie = e;
  for (const b of $("seg-serie").children) b.classList.toggle("ativo", b.dataset.escopo === e);
}
$("seg-serie").onclick = (e) => { const b = e.target.closest("[data-escopo]"); if (b) escopoSerie(b.dataset.escopo); };
$("lanc-tipo").onclick = (e) => { const b = e.target.closest("[data-tipo]"); if (b) definirTipo(b.dataset.tipo); };

const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
function diasMarcados() { return [...$("lanc-dias").children].filter((b) => b.classList.contains("ativo")).map((b) => Number(b.dataset.dow)); }
function marcarDias(dows) { for (const b of $("lanc-dias").children) b.classList.toggle("ativo", dows.includes(Number(b.dataset.dow))); }
$("lanc-dias").onclick = (e) => { const b = e.target.closest("[data-dow]"); if (b) { b.classList.toggle("ativo"); atualizarPrevia(); } };
// Datas de cada dia da semana marcado, de `data` até antes de `ate` (uma lista por dia: cada dia vira uma série).
function datasSemanais(data, dows, ate) {
  return dows.map((w) => {
    let d = somarDias(data, (w - deIso(data).getDay() + 7) % 7);
    const ds = [];
    for (; d < ate; d = somarDias(d, 7)) ds.push(d);
    return ds;
  }).filter((ds) => ds.length);
}
function fimSemanal(data, semFim) {
  return semFim ? somarMeses(data, 6) : somarMeses(data, Math.min(60, Math.max(1, parseInt($("lanc-meses").value, 10) || 12)));
}
function nomesDias(dows) {
  const ns = [...dows].sort().map((w) => DIAS_SEMANA[w]);
  return ns.length > 1 ? ns.slice(0, -1).join(", ") + " e " + ns[ns.length - 1] : ns[0];
}

function atualizarPrevia() {
  const v = $("lanc-repetir").value, data = $("lanc-data").value;
  $("bloco-meses").hidden = v !== "mensal" && v !== "semanal";
  $("bloco-semana").hidden = v !== "semanal";
  $("bloco-parcelas").hidden = v !== "parcelado";
  const p = $("lanc-previa");
  p.hidden = v === "nao" || !data;
  if (p.hidden) return;
  const semFim = (v === "mensal" || v === "semanal") && $("lanc-semfim").checked;
  $("bloco-qtd-meses").hidden = semFim;
  if (v === "semanal") {
    const dows = diasMarcados();
    if (!dows.length) { p.textContent = "Marque pelo menos um dia."; return; }
    const ds = datasSemanais(data, dows, fimSemanal(data, semFim)).flat().sort();
    p.textContent = semFim
      ? `Toda semana (${nomesDias(dows)}). Cria até ${dataMedia(ds[ds.length - 1])} agora e continua criando sozinho.`
      : `Toda semana (${nomesDias(dows)}): ${ds.length} lançamentos, de ${dataMedia(ds[0])} a ${dataMedia(ds[ds.length - 1])}.`;
  } else if (semFim) {
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
$("lanc-repetir").addEventListener("change", () => { if ($("lanc-repetir").value === "semanal" && !diasMarcados().length && $("lanc-data").value) { marcarDias([deIso($("lanc-data").value).getDay()]); atualizarPrevia(); } });
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
  // O último com valor (um lançamento "a definir" de R$ 0 não serve de sugestão).
  const iguais = [...estado.lancs].reverse().filter((l) => l.descricao.toLowerCase() === d);
  const ultimo = iguais.find((l) => Number(l.valor) > 0) || iguais[0];
  if (ultimo) {
    definirTipo(ultimo.tipo);
    $("lanc-valor").value = mostrarValor(Number(ultimo.valor));
    if (!catManual) { estado.categoriaSel = categoriaDe(ultimo); renderCats(); }
  }
});

// Sugestões só do tipo escolhido: em Despesa aparecem despesas, em Receita, receitas.
function preencherSugestoes() {
  const vistos = new Map();
  for (const l of estado.lancs) if (l.tipo === tipoSel) vistos.set(l.descricao.toLowerCase(), l.descricao);
  $("sugestoes").innerHTML = [...vistos.values()].sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((d) => `<option value="${esc(d)}"></option>`).join("");
  // As 4 descrições mais lançadas nos últimos 60 dias viram atalho (fixas e caixinhas ficam de fora).
  const desde = somarDias(hoje(), -60), conta = new Map();
  for (const l of estado.lancs) {
    if (l.tipo !== tipoSel || l.data < desde || l.recorrente || l.caixinha_id || l.parcelas) continue;
    const k = l.descricao.toLowerCase();
    conta.set(k, { d: l.descricao, n: (conta.get(k)?.n || 0) + 1 });
  }
  const top = [...conta.values()].filter((x) => x.n > 1).sort((a, b) => b.n - a.n).slice(0, 4);
  $("lanc-recentes").innerHTML = top.map((x) => `<button type="button" class="chip" data-recente="${esc(x.d)}">${esc(x.d)}</button>`).join("");
}
$("lanc-recentes").onclick = (e) => {
  const b = e.target.closest("[data-recente]");
  if (!b) return;
  $("lanc-desc").value = b.dataset.recente;
  $("lanc-valor").value = "";
  $("lanc-desc").dispatchEvent(new Event("change"));
  adivinharNoForm();
  $("lanc-valor").focus();
  $("lanc-valor").select();
};

function abrirLanc(l, padrao = {}) {
  estado.editando = l || null;
  $("lanc-erro").textContent = "";
  $("lanc-titulo").textContent = l ? "Editar lançamento" : "Novo lançamento";
  $("lanc-valor").value = l ? mostrarValor(Number(l.valor)) : padrao.valor != null ? mostrarValor(Number(padrao.valor)) : "";
  $("lanc-desc").value = l ? l.descricao : padrao.descricao || "";
  $("lanc-recentes").hidden = !!l;
  tipoSel = l ? l.tipo : padrao.tipo || "despesa";
  estado.categoriaSel = l ? categoriaDe(l) : padrao.categoria || null;
  catManual = !!l || !!padrao.categoria;
  definirTipo(tipoSel);
  for (const id of ["lanc-cats-rot", "lanc-cats"]) $(id).hidden = !!l?.caixinha_id;
  abrirCats(false);
  $("lanc-semfim").checked = !!padrao.semFim;
  $("bloco-semfim").hidden = !estado.seriesDb;
  const dataPadrao = padrao.data || (estado.mes === hoje().slice(0, 7) ? hoje() : estado.mes + "-01");
  $("lanc-data").value = l ? l.data : dataPadrao;
  $("lanc-pago").checked = l ? l.pago : dataPadrao <= hoje();
  $("bloco-repetir").hidden = !!l;
  $("lanc-repetir").value = l ? "nao" : padrao.repetir || "nao";
  $("lanc-meses").value = 12;
  marcarDias([]);
  $("lanc-parc").value = 1;
  $("lanc-parcs").value = 2;
  atualizarPrevia();
  const temSerie = !!(l && l.grupo);
  const nProximos = temSerie ? estado.lancs.filter((x) => x.grupo === l.grupo && x.data > l.data).length : 0;
  $("bloco-serie").hidden = !nProximos;
  $("serie-proximos").textContent = nProximos === 1 ? "Este e o próximo" : `Este e os ${nProximos} próximos`;
  escopoSerie(nProximos ? "proximos" : "este");
  $("lanc-acoes").hidden = !l;
  $("lanc-de-novo").hidden = !l || !!l.caixinha_id;
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
      const naSerie = l.grupo && estado.escopoSerie === "proximos";
      // Nos próximos vai só o que mudou: um check aqui não pode apagar um valor diferente posto num mês adiante.
      const mudou = Object.fromEntries(Object.entries(campos).filter(([k, v]) => (k === "valor" ? Number(l.valor) !== v : (l[k] ?? null) !== (v ?? null))));
      const temMudanca = Object.keys(mudou).length || data !== l.data;
      const proximos = naSerie && temMudanca ? estado.lancs.filter((x) => x.grupo === l.grupo && x.data > l.data) : [];
      const antes = [l, ...proximos].map((x) => ({ ...x }));
      let r = await sb.from("lancamentos").update({ ...campos, data, pago: $("lanc-pago").checked }).eq("id", l.id).select("id");
      if (r.error) throw r.error;
      if (!r.data.length) { await carregar(); throw new Error("Esse lançamento foi apagado em outro celular."); }
      if (proximos.length && data === l.data) {
        r = await sb.from("lancamentos").update(mudou).in("id", proximos.map((x) => x.id));
        if (r.error) throw r.error;
      } else if (proximos.length) {
        // Mudou a data: os próximos vão para o mesmo dia (semanal anda os mesmos dias; mensal e parcelas, o mesmo dia do mês).
        const semanal = series().find((s) => s.grupo === l.grupo)?.semanal;
        const dias = Math.round((deIso(data) - deIso(l.data)) / 864e5);
        const meses = (Number(data.slice(0, 4)) - Number(l.data.slice(0, 4))) * 12 + Number(data.slice(5, 7)) - Number(l.data.slice(5, 7));
        const dia = Number(data.slice(8));
        const novas = proximos.map((x) => ({ id: x.id, data: semanal ? somarDias(x.data, dias) : noDia(somarMeses(x.data, meses), dia) }));
        const rs = await Promise.all(novas.map((x) => sb.from("lancamentos").update({ ...mudou, data: x.data }).eq("id", x.id)));
        const falha = rs.find((x) => x.error);
        if (falha) { await voltarCampos(antes).catch(() => {}); throw falha.error; }
        // A repetição automática continua do último lançamento; gerado_ate acompanha para não pular nem repetir mês.
        if (estado.seriesDb?.get(l.grupo)) {
          const ult = novas.reduce((m, x) => (x.data > m ? x.data : m), data);
          r = await sb.from("series").update({ gerado_ate: ult }).eq("grupo", l.grupo);
          if (r.error) throw r.error;
        }
      }
      avisar(antes.length > 1 ? `${antes.length} lançamentos alterados.` : "Alterado.", () => voltarCampos(antes));
    } else {
      const base = { casa_id: estado.casa.id, descricao, tipo: tipoSel, valor, ...cat };
      const pagoPrimeiro = $("lanc-pago").checked;
      const rep = $("lanc-repetir").value;
      const semFim = (rep === "mensal" || rep === "semanal") && $("lanc-semfim").checked && !!estado.seriesDb;
      let linhas;
      if (rep === "semanal") {
        const dows = diasMarcados();
        if (!dows.length) { btn.disabled = false; return erro("Marque pelo menos um dia da semana."); }
        linhas = datasSemanais(data, dows, fimSemanal(data, semFim)).flatMap((ds) => {
          const grupo = crypto.randomUUID();
          return ds.map((d) => ({ ...base, data: d, pago: d === data && pagoPrimeiro, recorrente: true, grupo }));
        });
      } else if (rep === "mensal") {
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
      const gruposNovos = semFim ? [...new Set(linhas.map((x) => x.grupo))] : [];
      if (semFim) {
        const r = await sb.from("series").insert(gruposNovos.map((g) => ({
          grupo: g, casa_id: estado.casa.id, passo: rep === "semanal" ? "semana" : "mes", sem_fim: true,
          gerado_ate: linhas.filter((x) => x.grupo === g).at(-1).data,
        })));
        if (r.error) {
          try { await apagarIds(linhas.map((x) => x.id)); } catch (e) {
            await carregar();
            throw new Error("Os lançamentos foram criados, mas a repetição automática não. Apague essa conta fixa e crie de novo.");
          }
          throw r.error;
        }
      }
      vibrar(12);
      const ids = linhas.map((x) => x.id);
      avisar(semFim ? "Conta fixa criada, sem data para acabar." : linhas.length > 1 ? `${linhas.length} lançamentos criados.` : "Lançado.", async () => {
        if (gruposNovos.length) { const r = await sb.from("series").delete().in("grupo", gruposNovos); if (r.error) throw r.error; }
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
  await despedir([l.id]);
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
  const { data: apagados, error } = await sb.from("lancamentos").delete().eq("grupo", l.grupo).gte("data", l.data).select();
  if (error) {
    if (serieAntes?.sem_fim) await sb.from("series").update({ sem_fim: true }).eq("grupo", l.grupo);
    return avisar(msgErro(error));
  }
  fecharPaineis();
  await despedir(apagados.map((x) => x.id));
  await carregar();
  avisar(`${apagados.length} apagados.`, async () => {
    await regravar(apagados);
    if (serieAntes?.sem_fim) { const r = await sb.from("series").update({ sem_fim: true }).eq("grupo", l.grupo); if (r.error) throw r.error; }
  });
};

$("lanc-de-novo").onclick = () => {
  const l = estado.editando;
  if (!l) return;
  fecharPaineis(true);
  abrirLanc(null, { tipo: l.tipo, data: hoje(), descricao: l.descricao, valor: l.valor, categoria: categoriaDe(l) });
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
  for (const l of lista) if (l.tipo === tipo && !ehCaixinha(l)) { const k = categoriaDe(l); m.set(k, (m.get(k) || 0) + Number(l.valor)); }
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
  const soma = (ls, t) => ls.filter((l) => l.tipo === t && !ehCaixinha(l)).reduce((s, l) => s + Number(l.valor), 0);
  const ent = soma(doMes, "receita"), sai = soma(doMes, "despesa"), saiAnt = soma(doAnt, "despesa");
  const guardou = guardadoEm(doMes);
  const sobra = r2(ent - sai - guardou);
  const pend = doMes.filter((l) => !l.pago);
  const pPagar = soma(pend, "despesa"), pReceber = soma(pend, "receita");

  const frases = [`Em ${nome} entram <b class="num">${brl.format(ent)}</b> e saem <b class="num">${brl.format(sai)}</b>.`,
    ...(guardou > 0 ? [`Vocês guardam <b class="num">${brl.format(guardou)}</b> nas caixinhas${ent > 0 ? ` (${Math.round((guardou / ent) * 100)}% do que entra)` : ""}.`]
      : guardou < 0 ? [`Voltam <b class="num">${brl.format(-guardou)}</b> das caixinhas para a conta.`] : []),
    `${sobra >= 0 ? "Sobram" : "Faltam"} <b class="num" style="color:var(${sobra >= 0 ? "--verde" : "--vermelho"})">${brl.format(Math.abs(sobra))}</b> no mês${guardou > 0 ? ", depois de guardar" : ""}.`];
  if (saiAnt > 0) {
    const pct = Math.round(((sai - saiAnt) / saiAnt) * 100);
    frases.push(pct === 0 ? `As saídas estão iguais às de ${nomeAnt}.` : `As saídas estão ${Math.abs(pct)}% ${pct > 0 ? "acima" : "abaixo"} de ${nomeAnt} (${brl.format(saiAnt)}).`);
  }
  if (pend.length) frases.push(`Ainda sem check: ${[pPagar && `${brl.format(pPagar)} a pagar`, pReceber && `${brl.format(pReceber)} a receber`].filter(Boolean).join(" e ")}.`);

  const maiores = doMes.filter((l) => l.tipo === "despesa" && !ehCaixinha(l)).sort((a, b) => b.valor - a.valor).slice(0, 5);
  $("resumo-tit").textContent = `Resumo de ${nomeMes.format(deIso(mes + "-01"))}`;
  $("resumo-corpo").innerHTML = `
    <div class="frases">${frases.map((f) => `<p>${f}</p>`).join("")}</div>
    <div class="sub-linha"><h3 class="sub">Saídas por categoria</h3>${estado.limites ? `<button class="btn texto" type="button" data-abrir-limites>${estado.limites.size ? "Editar limites" : "Definir limites"}</button>` : ""}</div>
    ${barrasHtml("despesa", doMes, doAnt)}
    ${doAnt.length ? '<div class="nota"><i class="fantasma-leg"></i> traço = mesma categoria no mês anterior</div>' : ""}
    <h3 class="sub">Entradas por categoria</h3>
    ${barrasHtml("receita", doMes, doAnt)}
    ${maiores.length ? `<h3 class="sub">Maiores saídas</h3><div class="lista lista-plana">${maiores.map((l) => `<button class="linha-simples" data-abrir-lanc="${l.id}">
      <span class="cat-ic">${iconeDe(l)}</span><span class="desc">${esc(l.descricao)}</span>
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

// ---------- caixinhas ----------

const CAIXA_ICONES = {
  cofre: '<path d="M4.5 11.5a7.5 6 0 0113.6-3.4H20v3.4h1.5v3.2H20a7.5 6 0 01-3 2.9V20h-3v-1.8a9 9 0 01-3 0V20H8v-2.6a6 6 0 01-3.5-5.9z"/><path d="M15.5 10.5h.01M10 7.5h3"/>',
  escudo: '<path d="M12 3l7.5 3v5.2c0 4.6-3.2 8.2-7.5 9.8-4.3-1.6-7.5-5.2-7.5-9.8V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  crianca: '<circle cx="12" cy="8.5" r="4.5"/><path d="M4.5 21a7.5 7.5 0 0115 0"/><path d="M10.3 8.5h.01M13.7 8.5h.01M10.5 10.6c.9.6 2.1.6 3 0"/>',
  coracao: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  casa: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  viagem: '<path d="M3 13.5l18-8.5-6 16-3.2-6.3z"/><path d="M11.8 14.7L21 5"/>',
  estrela: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
};
function caixaIcone(k) { return svg(CAIXA_ICONES[k] || CAIXA_ICONES.cofre); }
function caixinhaDe(id) { return estado.caixinhas?.find((c) => c.id === id) || null; }
const caixinhasAtivas = () => (estado.caixinhas || []).filter((c) => !c.arquivada);
const ehEmergencia = (c) => c.icone === "escudo" || /emerg|reserva/.test(normalizar(c.nome));
const mesesEntre = (a, b) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));

// Guardado menos resgatado numa lista de lançamentos (conta também o que ainda não tem check).
function guardadoEm(lista) {
  return r2(lista.reduce((s, l) => (l.caixinha_id ? s + (l.tipo === "despesa" ? 1 : -1) * Number(l.valor) : s), 0));
}

// Saldo de uma caixinha: o que já saiu da conta para ela (com check) ou o saldo informado na mão.
function saldoCaixinha(c) {
  let guardado = 0, depoisDoReal = 0, previsto = 0;
  for (const l of estado.lancs) {
    if (l.caixinha_id !== c.id) continue;
    const v = (l.tipo === "despesa" ? 1 : -1) * Number(l.valor);
    if (!l.pago) { previsto += v; continue; }
    guardado += v;
    if (c.saldo_real_em && l.data > c.saldo_real_em) depoisDoReal += v;
  }
  const temReal = c.saldo_real != null;
  const atual = temReal ? Number(c.saldo_real) + depoisDoReal : guardado;
  return { guardado: r2(guardado), atual: r2(atual), rendeu: temReal ? r2(atual - guardado) : 0, previsto: r2(previsto) };
}
function totalGuardado() { return r2(caixinhasAtivas().reduce((s, c) => s + saldoCaixinha(c).atual, 0)); }

function serieDaCaixinha(c) {
  return series().find((s) => s.ls[0].caixinha_id === c.id && s.ultimo.tipo === "despesa" && (s.semFim || s.ultimo.data >= hoje())) || null;
}

function planoCaixinha(c) {
  const s = saldoCaixinha(c), serie = serieDaCaixinha(c);
  const mensal = serie ? Number(serie.ultimo.valor) : 0;
  const obj = c.objetivo ? Number(c.objetivo) : 0;
  const falta = obj ? r2(Math.max(0, obj - s.atual)) : 0;
  const mesAtual = hoje().slice(0, 7);
  // Conta o mês atual: o depósito dele ainda pode acontecer.
  const meses = c.prazo ? Math.max(1, mesesEntre(mesAtual, c.prazo.slice(0, 7)) + 1) : null;
  const precisa = obj && meses ? r2(falta / meses) : null;
  const chegaEm = obj && falta > 0 && mensal > 0 ? somarMeses(mesAtual + "-01", Math.ceil(falta / mensal) - 1).slice(0, 7) : null;
  return { ...s, mensal, serie, obj, falta, meses, precisa, chegaEm, fracao: obj ? Math.min(1, s.atual / obj) : null };
}

function statusCaixinha(c, p) {
  const ritmo = p.mensal ? `${brl.format(p.mensal)} por mês` : "";
  if (p.obj && !p.falta) return { txt: "Chegou no objetivo.", tom: "bom" };
  if (p.obj && c.prazo) {
    const prazo = mesCurto(c.prazo);
    if (p.mensal && p.mensal + 0.005 >= p.precisa) return { txt: `Guardando ${ritmo}, chega lá em ${mesCurto(p.chegaEm + "-01")}, dentro do prazo (${prazo}).`, tom: "bom" };
    return { txt: `Para chegar até ${prazo}: ${brl.format(p.precisa)} por mês${p.mensal ? ` (hoje: ${ritmo})` : ""}.`, tom: "perto" };
  }
  if (p.obj) return p.mensal ? { txt: `Guardando ${ritmo}, chega lá em ${mesCurto(p.chegaEm + "-01")}.`, tom: "" } : { txt: `Faltam ${brl.format(p.falta)}. Sem depósito mensal.`, tom: "perto" };
  return p.mensal ? { txt: `Guardando ${ritmo}.`, tom: "" } : { txt: "Sem depósito mensal.", tom: "" };
}

// Média de gastos por mês (sem caixinhas), dos meses com lançamento entre 6 meses atrás e 2 à frente.
function gastoMedioMensal() {
  const mesAtual = hoje().slice(0, 7), ini = somarMeses(mesAtual + "-01", -6).slice(0, 7), fim = somarMeses(mesAtual + "-01", 2).slice(0, 7);
  const porMes = new Map();
  for (const l of estado.lancs) {
    const m = l.data.slice(0, 7);
    if (m < ini || m > fim || l.tipo !== "despesa" || ehCaixinha(l)) continue;
    porMes.set(m, (porMes.get(m) || 0) + Number(l.valor));
  }
  return porMes.size ? { valor: r2([...porMes.values()].reduce((a, b) => a + b, 0) / porMes.size), meses: porMes.size } : null;
}

function abrirCaixinhas() { renderCaixinhas(); abrirPainel($("painel-caixinhas")); }

// Fração de cada caixinha na última vez que a lista apareceu, para a barra crescer dali.
const fracaoAntes = new Map();
function jaComemorou(id) { try { return localStorage.getItem("fin-objetivo-" + id) === "1"; } catch (e) { return true; } }
function marcarComemorado(id) { try { localStorage.setItem("fin-objetivo-" + id, "1"); } catch (e) {} }

function renderCaixinhas() {
  const lista = caixinhasAtivas(), alvo = $("lista-caixinhas");
  if (!lista.length) {
    alvo.innerHTML = `<p class="nota" style="margin-top:-6px">Cada caixinha separa um dinheiro guardado. Guardar tira da conta, mas não entra como gasto no resumo. Resgatar devolve para a conta.</p>
      <div class="cx-sugeridas">${[["escudo", "Reserva de emergência"], ["crianca", "Gael"], ["crianca", "Dante"], ["coracao", "Nós"]]
        .map(([i, n]) => `<span class="cx-chip">${caixaIcone(i)}${n}</span>`).join("")}</div>
      <button class="btn" type="button" data-criar-sugeridas>Criar essas 4 caixinhas</button>
      <button class="btn texto" type="button" data-nova-caixa>Criar outra caixinha</button>`;
    return;
  }
  const mesAtual = hoje().slice(0, 7);
  const doMes = guardadoEm(estado.lancs.filter((l) => l.data.startsWith(mesAtual)));
  alvo.innerHTML = `<div class="cx-total">
      <span>Guardado nas caixinhas</span>
      ${valorHtml(totalGuardado())}
      ${doMes ? `<small class="num">${doMes > 0 ? `${brl.format(doMes)} guardados` : `${brl.format(-doMes)} resgatados`} em ${nomeDoMes(mesAtual)}, contando o previsto</small>` : ""}
    </div>` +
    lista.map((c) => {
      const p = planoCaixinha(c), st = statusCaixinha(c, p);
      const real = c.saldo_real != null
        ? `<div class="nota num">Saldo informado em ${dataMedia(c.saldo_real_em)}. ${p.rendeu >= 0 ? `Rendeu ${brl.format(p.rendeu)}` : `Tem ${brl.format(-p.rendeu)} a menos`} além do que foi guardado pelo app.</div>`
        : "";
      const antes = fracaoAntes.get(c.id), agora = p.fracao ?? 0;
      fracaoAntes.set(c.id, agora);
      const cresce = antes != null && agora > antes && agora > 0;
      const festa = p.obj && !p.falta && !jaComemorou(c.id);
      if (festa) marcarComemorado(c.id);
      return `<div class="cx ${festa ? "conquista" : ""}">
        <button class="cx-cab" type="button" data-editar-caixa="${c.id}">
          <span class="cat-ic cx">${caixaIcone(c.icone)}</span>
          <span class="cx-txt"><span class="cx-nome">${esc(c.nome)}</span><small class="num ${st.tom}">${festa ? '<svg class="ic feito" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ""}${st.txt}</small></span>
          <b class="num">${brl.format(p.atual)}</b>
        </button>
        ${p.obj ? `<div class="trilho"><span class="enche receita ${cresce ? "cresce" : ""}" style="width:${(p.fracao * 100).toFixed(1)}%${cresce ? `;--de:${(antes / agora).toFixed(3)}` : ""}"></span></div>
          <div class="barra-rodape num"><span>${Math.round(p.fracao * 100)}% de ${brl.format(p.obj)}</span><span>${p.falta ? `faltam ${brl.format(p.falta)}` : "objetivo alcançado"}</span></div>` : ""}
        ${real}
        <div class="duas">
          <button class="btn sec" type="button" data-guardar="${c.id}">Guardar</button>
          <button class="btn sec" type="button" data-resgatar="${c.id}" ${p.atual > 0 ? "" : "disabled"}>Resgatar</button>
        </div>
      </div>`;
    }).join("") +
    `<button class="btn texto" type="button" data-nova-caixa>${IC.mais} Nova caixinha</button>
     <p class="nota">Toque numa caixinha para mudar o objetivo, o prazo, o depósito mensal ou informar o saldo do banco.</p>`;
}

$("lista-caixinhas").addEventListener("click", async (e) => {
  const t = (sel) => e.target.closest(sel);
  if (t("[data-nova-caixa]")) { abrirCaixa(null); return; }
  if (t("[data-editar-caixa]")) { abrirCaixa(caixinhaDe(t("[data-editar-caixa]").dataset.editarCaixa)); return; }
  if (t("[data-guardar]")) { abrirMov(caixinhaDe(t("[data-guardar]").dataset.guardar), "despesa"); return; }
  if (t("[data-resgatar]")) { abrirMov(caixinhaDe(t("[data-resgatar]").dataset.resgatar), "receita"); return; }
  const b = t("[data-criar-sugeridas]");
  if (!b) return;
  b.disabled = true;
  const media = gastoMedioMensal();
  const linhas = [["Reserva de emergência", "escudo", media ? Math.round(media.valor * 6 / 100) * 100 : null], ["Gael", "crianca", null], ["Dante", "crianca", null], ["Nós", "coracao", null]]
    .map(([nome, icone, objetivo], i) => ({ id: crypto.randomUUID(), casa_id: estado.casa.id, nome, icone, objetivo, ordem: i }));
  const { error } = await sb.from("caixinhas").insert(linhas);
  if (error) { b.disabled = false; avisar(msgErro(error)); return; }
  await carregar();
  renderCaixinhas();
  vibrar(12);
  avisar(media ? `Criadas. A reserva começou com objetivo de 6 meses de gastos (${brl.format(linhas[0].objetivo)}).` : "Caixinhas criadas.");
});

// ---------- editar caixinha ----------

let caixaEditando = null, caixaIconeSel = "cofre";
function renderIconesCaixa() {
  $("caixa-icones").innerHTML = Object.keys(CAIXA_ICONES).map((k) =>
    `<button type="button" class="cat so-icone ${caixaIconeSel === k ? "ativo" : ""}" data-icone="${k}" role="radio" aria-checked="${caixaIconeSel === k}" aria-label="${k}">${caixaIcone(k)}</button>`).join("");
}
$("caixa-icones").onclick = (e) => { const b = e.target.closest("[data-icone]"); if (b) { caixaIconeSel = b.dataset.icone; renderIconesCaixa(); previaCaixa(); } };

function abrirCaixa(c) {
  caixaEditando = c;
  const p = c ? planoCaixinha(c) : null;
  $("caixa-tit").textContent = c ? c.nome : "Nova caixinha";
  $("caixa-nome").value = c ? c.nome : "";
  caixaIconeSel = c ? c.icone : "cofre";
  renderIconesCaixa();
  $("caixa-obj").value = c?.objetivo ? mostrarValor(Number(c.objetivo)) : "";
  $("caixa-prazo").value = c?.prazo ? c.prazo.slice(0, 7) : "";
  $("caixa-mensal").value = p?.mensal ? mostrarValor(p.mensal) : "";
  $("caixa-dia").value = p?.serie ? Number(p.serie.ultimo.data.slice(8)) : 5;
  $("caixa-real").value = "";
  $("caixa-real").placeholder = p ? mostrarValor(p.atual) : "0,00";
  $("caixa-erro").textContent = "";
  $("caixa-acoes").hidden = !c;
  const temMov = c && estado.lancs.some((l) => l.caixinha_id === c.id);
  $("caixa-apagar").textContent = temMov ? "Arquivar caixinha" : "Apagar caixinha";
  previaCaixa();
  abrirPainel($("painel-caixa"));
}

function previaCaixa() {
  const obj = lerValor($("caixa-obj").value), prazo = $("caixa-prazo").value, mensal = lerValor($("caixa-mensal").value);
  const atual = caixaEditando ? planoCaixinha(caixaEditando).atual : 0;
  const nome = $("caixa-nome").value.trim();
  const media = gastoMedioMensal();
  const sug = $("caixa-sug");
  const pareceEmergencia = caixaIconeSel === "escudo" || /emerg|reserva/.test(normalizar(nome));
  sug.hidden = !(pareceEmergencia && media);
  if (!sug.hidden) {
    const seis = Math.round(media.valor * 6 / 100) * 100;
    sug.innerHTML = `Vocês gastam em média <b class="num">${brl.format(media.valor)}</b> por mês (${media.meses} ${media.meses === 1 ? "mês" : "meses"}). A reserva costuma ser de 6 meses: <button class="link" type="button" data-usar-seis="${seis}">usar ${brl.format(seis)}</button>`;
  }
  const p = $("caixa-previa"), falta = Number.isFinite(obj) && obj > 0 ? Math.max(0, obj - atual) : 0;
  const linhas = [];
  if (falta && prazo) {
    const meses = Math.max(1, mesesEntre(hoje().slice(0, 7), prazo) + 1);
    linhas.push(`Para chegar a ${brl.format(obj)} até ${mesCurto(prazo + "-01")}: <b class="num">${brl.format(falta / meses)}</b> por mês, em ${meses} ${meses === 1 ? "mês" : "meses"}.`);
  }
  if (falta && mensal > 0) linhas.push(`Com ${brl.format(mensal)} por mês, chega lá em ${mesCurto(somarMeses(hoje().slice(0, 7) + "-01", Math.ceil(falta / mensal) - 1))}.`);
  p.innerHTML = linhas.map((x) => `<span>${x}</span>`).join("");
  p.hidden = !linhas.length;
}
for (const id of ["caixa-nome", "caixa-obj", "caixa-prazo", "caixa-mensal"]) $(id).addEventListener("input", previaCaixa);
$("caixa-sug").onclick = (e) => { const b = e.target.closest("[data-usar-seis]"); if (b) { $("caixa-obj").value = mostrarValor(Number(b.dataset.usarSeis)); previaCaixa(); } };

// Primeira data do depósito: no dia escolhido deste mês, ou do próximo se já passou.
function primeiraData(dia) {
  const hj = hoje(), neste = `${hj.slice(0, 7)}-${String(dia).padStart(2, "0")}`;
  return neste >= hj ? neste : somarMeses(neste, 1);
}

// Cria, muda ou para o depósito mensal (uma conta fixa sem fim ligada à caixinha).
async function ajustarDeposito(c, mensal, dia) {
  const s = serieDaCaixinha(c), hj = hoje();
  const descricao = `Guardar ${c.nome}`;
  if (s) {
    const futuros = s.ls.filter((l) => !l.pago && l.data >= hj).map((l) => l.id);
    const mudouDia = Number(s.ultimo.data.slice(8)) !== dia;
    if (mensal && !mudouDia) {
      if (futuros.length && (Number(s.ultimo.valor) !== mensal || s.ultimo.descricao !== descricao)) {
        const { error } = await sb.from("lancamentos").update({ valor: mensal, descricao }).in("id", futuros);
        if (error) throw error;
      }
      return;
    }
    // Parar (ou trocar o dia): encerra a série e apaga os depósitos que ainda não aconteceram.
    if (estado.seriesDb?.get(s.grupo)?.sem_fim) {
      const r = await sb.from("series").update({ sem_fim: false }).eq("grupo", s.grupo);
      if (r.error) throw r.error;
    }
    await apagarIds(futuros);
    if (!mensal) return;
  }
  if (!mensal) return;
  const ini = primeiraData(dia), grupo = crypto.randomUUID();
  const linhas = Array.from({ length: 12 }, (_, i) => ({
    id: crypto.randomUUID(), casa_id: estado.casa.id, descricao, tipo: "despesa", valor: mensal, data: somarMeses(ini, i),
    pago: false, recorrente: true, parcela: null, parcelas: null, grupo, caixinha_id: c.id,
    ...(estado.temCategoria ? { categoria: "outros" } : {}),
  }));
  if (!estado.seriesDb) throw new Error("Não consegui confirmar as contas fixas. Atualize a tela e tente de novo.");
  const { error } = await sb.from("lancamentos").insert(linhas);
  if (error) throw error;
  const r = await sb.from("series").insert({ grupo, casa_id: estado.casa.id, passo: "mes", sem_fim: true, gerado_ate: linhas[11].data });
  if (r.error) { await apagarIds(linhas.map((l) => l.id)).catch(() => {}); throw r.error; }
}

$("painel-caixa").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const erro = (m) => { $("caixa-erro").textContent = m; };
  const nome = $("caixa-nome").value.trim().replace(/\s+/g, " ");
  const txt = (id) => $(id).value.trim();
  const obj = txt("caixa-obj") ? lerValor(txt("caixa-obj")) : null;
  const mensal = txt("caixa-mensal") ? lerValor(txt("caixa-mensal")) : 0;
  const real = txt("caixa-real") ? lerValor(txt("caixa-real")) : null;
  const dia = parseInt($("caixa-dia").value, 10);
  if (!nome) return erro("Dê um nome para a caixinha.");
  if (obj !== null && !(obj > 0)) return erro("Objetivo inválido. Ex.: 20000 ou 20.000,00.");
  if (!Number.isFinite(mensal)) return erro("Depósito mensal inválido. Ex.: 200 ou 150,50.");
  if (mensal && !(dia >= 1 && dia <= 28)) return erro("O dia do depósito vai de 1 a 28.");
  if (real !== null && !Number.isFinite(real)) return erro("Saldo inválido. Ex.: 1250,30.");
  const prazo = txt("caixa-prazo");
  if (prazo && prazo < hoje().slice(0, 7)) return erro("O prazo já passou. Escolha um mês daqui para frente.");

  const btn = $("caixa-salvar");
  btn.disabled = true;
  try {
    const c = caixaEditando;
    const linha = {
      id: c?.id || crypto.randomUUID(), casa_id: estado.casa.id, nome, icone: caixaIconeSel,
      objetivo: obj, prazo: prazo ? prazo + "-01" : null, atualizado_em: new Date().toISOString(),
      ...(c ? {} : { ordem: (estado.caixinhas || []).length }),
      ...(real !== null ? { saldo_real: real, saldo_real_em: hoje() } : {}),
    };
    const { error } = await sb.from("caixinhas").upsert(linha);
    if (error) throw error;
    await ajustarDeposito({ ...c, ...linha }, mensal || 0, dia);
    await carregar();
    vibrar(12);
    avisar(c ? "Caixinha atualizada." : `Caixinha "${nome}" criada.`);
    abrirCaixinhas();
  } catch (e) {
    await carregar();
    erro(`${msgErro(e)} Confira os depósitos da caixinha antes de salvar de novo.`);
  } finally {
    btn.disabled = false;
  }
});

// Sem movimento, apaga. Com movimento, arquiva: o dinheiro guardado continua contando certo no histórico.
$("caixa-apagar").onclick = async () => {
  const c = caixaEditando;
  if (!c) return;
  const temMov = estado.lancs.some((l) => l.caixinha_id === c.id);
  const saldo = saldoCaixinha(c).atual;
  const ok = await confirmar(temMov ? `Arquivar "${c.nome}"?` : `Apagar "${c.nome}"?`,
    temMov ? `Ela some da lista e os depósitos que ainda não aconteceram são apagados.${saldo ? ` Ela tem ${brl.format(saldo)}: se o dinheiro voltou para a conta, faça um resgate antes.` : ""}` : "Ela ainda não tem nenhum depósito.",
    temMov ? "Arquivar" : "Apagar");
  if (!ok) return;
  try {
    if (temMov) {
      const r = await sb.from("caixinhas").update({ arquivada: true, atualizado_em: new Date().toISOString() }).eq("id", c.id);
      if (r.error) throw r.error;
      await ajustarDeposito(c, 0, 1);
    } else {
      const r = await sb.from("caixinhas").delete().eq("id", c.id);
      if (r.error) throw r.error;
    }
    await carregar();
    avisar(temMov ? `"${c.nome}" arquivada.` : `"${c.nome}" apagada.`);
    abrirCaixinhas();
  } catch (e) { await carregar(); abrirCaixinhas(); avisar(msgErro(e)); }
};

// ---------- guardar e resgatar ----------

let movSel = null; // { c, tipo }
function abrirMov(c, tipo) {
  if (!c) return;
  movSel = { c, tipo, id: crypto.randomUUID() };
  const guardar = tipo === "despesa", p = planoCaixinha(c);
  $("mov-tit").textContent = guardar ? `Guardar em ${c.nome}` : `Resgatar de ${c.nome}`;
  $("mov-valor").value = guardar && p.mensal ? mostrarValor(p.mensal) : "";
  $("mov-data").value = hoje();
  $("mov-feito").checked = true;
  $("mov-feito-rot").textContent = guardar ? "Já saiu da conta" : "Já voltou para a conta";
  $("mov-nota").textContent = guardar
    ? `Sai do saldo da conta e entra na caixinha. Ela tem ${brl.format(p.atual)}.`
    : `Volta para o saldo da conta. A caixinha tem ${brl.format(p.atual)}.`;
  $("mov-erro").textContent = "";
  abrirPainel($("painel-mov"));
  setTimeout(() => $("mov-valor").focus(), 300);
}
$("mov-data").addEventListener("change", () => { $("mov-feito").checked = $("mov-data").value <= hoje(); });

$("painel-mov").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const { c, tipo } = movSel || {};
  if (!c) return;
  const erro = (m) => { $("mov-erro").textContent = m; };
  const valor = lerValor($("mov-valor").value), data = $("mov-data").value;
  if (!(valor > 0)) return erro("Digite um valor, por exemplo 200 ou 150,50.");
  if (!data) return erro("Escolha a data.");
  const saldo = saldoCaixinha(c).atual;
  if (tipo === "receita" && valor > saldo + 0.005) return erro(`A caixinha tem só ${brl.format(saldo)}.`);
  const btn = $("mov-salvar");
  btn.disabled = true;
  try {
    const linha = {
      id: movSel.id, casa_id: estado.casa.id, descricao: tipo === "despesa" ? `Guardar ${c.nome}` : `Resgate ${c.nome}`,
      tipo, valor, data, pago: $("mov-feito").checked, recorrente: false, parcela: null, parcelas: null, grupo: null, caixinha_id: c.id,
      ...(estado.temCategoria ? { categoria: "outros" } : {}),
    };
    const { error } = await sb.from("lancamentos").upsert(linha);
    if (error) throw error;
    movSel.id = crypto.randomUUID();
    await carregar();
    vibrar(12);
    avisar(tipo === "despesa" ? `${brl.format(valor)} guardados em ${c.nome}.` : `${brl.format(valor)} resgatados de ${c.nome}.`, () => apagarIds([linha.id]));
    abrirCaixinhas();
  } catch (e) {
    erro(msgErro(e));
  } finally {
    btn.disabled = false;
  }
});

// ---------- visão do ano ----------

function numerosDoMes(m) {
  let ent = 0, gasto = 0, guardou = 0, n = 0;
  for (const l of estado.lancs) {
    if (!l.data.startsWith(m)) continue;
    const v = Number(l.valor);
    n++;
    if (l.caixinha_id) guardou += l.tipo === "despesa" ? v : -v;
    else if (l.tipo === "receita") ent += v;
    else gasto += v;
  }
  return { mes: m, ent: r2(ent), gasto: r2(gasto), guardou: r2(guardou), sobra: r2(ent - gasto - guardou), n };
}

let anoSel = null;
function abrirAno(ano) { anoSel = ano; renderAno(); abrirPainel($("painel-ano")); }

$("painel-ano").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ano-passo]");
  if (b) { anoSel += Number(b.dataset.anoPasso); renderAno(); $("painel-ano").scrollTop = 0; return; }
  if (e.target.closest("[data-ano-caixinhas]")) abrirCaixinhas();
});

function renderAno() {
  const ano = anoSel, mesAtual = hoje().slice(0, 7);
  const anos = estado.lancs.map((l) => Number(l.data.slice(0, 4)));
  $("ano-tit").textContent = `Visão de ${ano}`;
  $("ano-ant").disabled = !anos.length || ano <= Math.min(...anos);
  $("ano-prox").disabled = !anos.length || ano >= Math.max(...anos);
  const meses = Array.from({ length: 12 }, (_, i) => numerosDoMes(`${ano}-${String(i + 1).padStart(2, "0")}`)).filter((x) => x.n);
  const corpo = $("ano-corpo");
  if (!meses.length) { corpo.innerHTML = `<div class="vazio">Nada lançado em ${ano}.</div>`; return; }

  const tot = meses.reduce((a, x) => ({ ent: a.ent + x.ent, gasto: a.gasto + x.gasto, guardou: a.guardou + x.guardou, sobra: a.sobra + x.sobra }), { ent: 0, gasto: 0, guardou: 0, sobra: 0 });
  const previstos = meses.filter((x) => x.mes > mesAtual).length;
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const frases = [
    `Em ${ano} entram <b class="num">${brl.format(tot.ent)}</b> e vão para gastos <b class="num">${brl.format(tot.gasto)}</b>.`,
    tot.guardou > 0 ? `Vocês guardam <b class="num">${brl.format(tot.guardou)}</b> nas caixinhas, ${pct(tot.guardou, tot.ent)}% do que entra.` : "Ainda não há nada guardado nas caixinhas neste ano.",
    `${tot.sobra >= 0 ? "Sobram" : "Faltam"} <b class="num" style="color:var(${tot.sobra >= 0 ? "--verde" : "--vermelho"})">${brl.format(Math.abs(tot.sobra))}</b> no ano${tot.guardou > 0 ? ", depois de guardar" : ""}.`,
    `<span class="nota">${meses.length} ${meses.length === 1 ? "mês" : "meses"} com lançamentos${previstos ? `, ${previstos} ainda ${previstos === 1 ? "previsto" : "previstos"}` : ""}. Conta também o que ainda não tem check.</span>`,
  ];

  // Mês a mês: a barra mostra como o que entrou foi dividido.
  const mesesHtml = meses.map((x) => {
    const base = Math.max(x.ent, x.gasto + Math.max(0, x.guardou), 1);
    const g = (x.gasto / base) * 100, gu = (Math.max(0, x.guardou) / base) * 100;
    return `<div class="mes-linha ${x.mes > mesAtual ? "futuro" : ""}">
      <div class="barra-topo"><span>${nomeDoMes(x.mes + "-01")}${x.mes > mesAtual ? ' <small>previsto</small>' : x.mes === mesAtual ? ' <small>agora</small>' : ""}</span>
        <b class="num" style="color:var(${x.sobra >= 0 ? "--verde" : "--vermelho"})">${x.sobra >= 0 ? "sobra" : "falta"} ${brl.format(Math.abs(x.sobra))}</b></div>
      <div class="trilho pilha"><span class="seg-gasto" style="width:${g.toFixed(1)}%"></span><span class="seg-guardado" style="left:${g.toFixed(1)}%;width:${gu.toFixed(1)}%"></span></div>
      <div class="barra-rodape num"><span>entrou ${brl.format(x.ent)} · gastou ${brl.format(x.gasto)}</span><span>guardou ${pct(Math.max(0, x.guardou), x.ent)}%</span></div>
    </div>`;
  }).join("");

  const doAno = estado.lancs.filter((l) => l.data.startsWith(String(ano)));
  const cats = totaisPorCategoria(doAno, "despesa");
  const maxCat = Math.max(...cats.map(([, v]) => v), 1);
  const catsHtml = cats.map(([k, v]) => {
    const c = catInfo("despesa", k);
    return `<div class="barra">
      <span class="cat-ic">${c.icone}</span>
      <span class="barra-corpo">
        <span class="barra-topo"><span>${esc(c.nome)}</span><b class="num">${brl.format(v)}</b></span>
        <span class="trilho"><span class="enche" style="width:${((v / maxCat) * 100).toFixed(1)}%"></span></span>
        <span class="barra-rodape num"><span>${pct(v, tot.gasto)}% dos gastos</span><span>média ${brl.format(v / meses.length)} por mês</span></span>
      </span>
    </div>`;
  }).join("");

  const cxs = caixinhasAtivas();
  const cxHtml = cxs.length
    ? `<div class="lista lista-plana">${cxs.map((c) => {
        const p = planoCaixinha(c), dela = doAno.filter((l) => l.caixinha_id === c.id);
        const feito = guardadoEm(dela.filter((l) => l.pago)), previsto = guardadoEm(dela.filter((l) => !l.pago));
        return `<button class="linha-simples" type="button" data-ano-caixinhas>
          <span class="cat-ic cx">${caixaIcone(c.icone)}</span>
          <span class="desc cx-ano">${esc(c.nome)}<span class="quando num">${feito || previsto ? [feito && `${brl.format(feito)} guardados em ${ano}`, previsto && `${brl.format(previsto)} previstos`].filter(Boolean).join(" + ") : `nada em ${ano}`}${p.obj ? ` · ${p.falta ? `faltam ${brl.format(p.falta)}` : "objetivo alcançado"}` : ""}</span></span>
          <b class="num">${brl.format(p.atual)}</b></button>`;
      }).join("")}</div>`
    : `<button class="linha-resumo" type="button" data-ano-caixinhas>${caixaIcone("cofre")}<span>Criar as caixinhas (emergência, Gael, Dante, Nós)</span>${IC.ir}</button>`;

  corpo.innerHTML = `
    <div class="frases">${frases.map((f) => `<p>${f}</p>`).join("")}</div>
    <h3 class="sub">Mês a mês</h3>
    <div class="legenda-pilha"><span><i class="seg-gasto"></i>gastos</span><span><i class="seg-guardado"></i>guardado</span><span><i></i>sobra</span></div>
    ${mesesHtml}
    <h3 class="sub">Como estamos</h3>
    ${analiseAno(ano, meses, tot, cats).map((a) => `<div class="insight ${a.tom}">${a.linhas.map((l) => `<p>${l}</p>`).join("")}</div>`).join("")}
    <h3 class="sub">Caixinhas</h3>
    ${cxHtml}
    <h3 class="sub">Gastos por categoria no ano</h3>
    ${catsHtml || '<div class="nota">Nenhum gasto no ano.</div>'}`;
}

// Leitura do ano com números: cada item é uma ou duas frases curtas e o que fazer.
function analiseAno(ano, meses, tot, cats) {
  const out = [], n = meses.length, b = (v) => `<b class="num">${brl.format(v)}</b>`;
  const entMedia = tot.ent / n, gastoMedio = tot.gasto / n;
  const cat = new Map(cats);
  const pct = (a, base) => (base > 0 ? Math.round((a / base) * 100) : 0);

  // Quanto da renda vira poupança.
  const taxa = tot.ent > 0 ? tot.guardou / tot.ent : 0;
  out.push({
    tom: taxa >= 0.15 ? "bom" : taxa >= 0.05 ? "atencao" : "ruim",
    linhas: [
      `Vocês guardam ${pct(tot.guardou, tot.ent)}% do que entra.`,
      taxa >= 0.15 ? "Está dentro da faixa que costuma ser recomendada, de 10% a 20%."
        : `Uma meta comum é guardar de 10% a 20%. Com 10%, seriam ${b(entMedia * 0.1)} por mês.`,
    ],
  });

  // Reserva de emergência.
  const emerg = caixinhasAtivas().find(ehEmergencia);
  const alvo6 = gastoMedio * 6;
  if (emerg) {
    const s = saldoCaixinha(emerg).atual, cobre = gastoMedio > 0 ? s / gastoMedio : 0;
    out.push({
      tom: cobre >= 6 ? "bom" : cobre >= 3 ? "atencao" : "ruim",
      linhas: [
        `A reserva de emergência tem ${b(s)} e cobre ${cobre < 1 ? "menos de 1 mês" : `${cobre.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses`} de gastos.`,
        cobre >= 6 ? "Já passou dos 6 meses recomendados." : `O recomendado é 6 meses: ${b(alvo6)}. Faltam ${b(Math.max(0, alvo6 - s))}.`,
      ],
    });
  } else if (gastoMedio > 0) {
    out.push({ tom: "ruim", linhas: [
      "Ainda não há reserva de emergência.",
      `Com gastos médios de ${b(gastoMedio)} por mês, o recomendado é juntar ${b(alvo6)} (6 meses) antes de outros objetivos.`,
    ] });
  }

  // Dívidas.
  const div = cat.get("dividas") || 0;
  if (div > 0) {
    const p = div / Math.max(1, tot.ent);
    out.push({ tom: p > 0.3 ? "ruim" : p > 0.15 ? "atencao" : "bom", linhas: [
      `Empréstimos e cartões levam ${pct(div, tot.ent)}% do que entra: ${b(div / n)} por mês.`,
      p > 0.3 ? "Passa dos 30% que costumam ser o limite. Quitar primeiro as dívidas com juros mais altos libera dinheiro para guardar."
        : p > 0.15 ? "Está abaixo dos 30% que costumam ser o limite, mas vale não aumentar." : "Está abaixo dos 30% que costumam ser o limite.",
    ] });
  }

  // Meses no vermelho.
  const vermelho = meses.filter((x) => x.sobra < 0);
  if (vermelho.length) {
    out.push({ tom: "ruim", linhas: [
      `${vermelho.length === 1 ? "1 mês fecha" : `${vermelho.length} meses fecham`} no vermelho: ${vermelho.map((x) => mesCurto(x.mes + "-01")).join(", ")}.`,
      `O pior é ${mesCurto(vermelho.reduce((a, x) => (x.sobra < a.sobra ? x : a)).mes + "-01")}, com ${b(Math.abs(Math.min(...vermelho.map((x) => x.sobra))))} faltando.`,
    ] });
  }

  // Onde dá para cortar: os dois maiores gastos que dependem de escolha.
  const flex = ["lazer", "mercado", "transporte", "assinaturas", "outros"].map((k) => [k, cat.get(k) || 0]).filter(([, v]) => v > 0).sort((a, b2) => b2[1] - a[1]).slice(0, 2);
  if (flex.length) {
    const corte = flex.reduce((s, [, v]) => s + v, 0) * 0.1 / n;
    out.push({ tom: "info", linhas: [
      `Se gastarem 10% menos em ${flex.map(([k]) => catInfo("despesa", k).nome.toLowerCase()).join(" e ")}, sobram mais ${b(corte)} por mês.`,
      `Em um ano, são ${b(corte * 12)} a mais para guardar.`,
    ] });
  }

  const assin = cat.get("assinaturas") || 0;
  if (assin > 0) out.push({ tom: "info", linhas: [`Assinaturas somam ${b(assin / n)} por mês, ${b((assin / n) * 12)} por ano.`, "Vale revisar as que ninguém usa."] });

  // Projeção.
  const proj = [];
  if (ano >= Number(hoje().slice(0, 4))) proj.push(`Com o que já está lançado, a conta termina ${ano} com ${b(saldoAte(`${ano}-12-31`))}.`);
  const sobraMedia = tot.sobra / n;
  if (sobraMedia > 0) proj.push(`A sobra média é de ${b(sobraMedia)} por mês. Se ela for para as caixinhas, em 12 meses são ${b(sobraMedia * 12)} a mais guardados.`);
  for (const c of caixinhasAtivas()) {
    const p = planoCaixinha(c);
    if (p.obj && p.falta && p.mensal) proj.push(`${esc(c.nome)}: no ritmo de ${b(p.mensal)} por mês, chega a ${b(p.obj)} em ${mesCurto(p.chegaEm + "-01")}.`);
  }
  if (proj.length) out.push({ tom: "info", linhas: proj });

  if (n < 3) out.push({ tom: "", linhas: [`Esta leitura usa ${n} ${n === 1 ? "mês" : "meses"} de lançamentos. Fica mais precisa a cada mês.`] });
  return out;
}

// Check em tudo o que é de hoje de uma vez, com desfazer.
async function checkEmTudoDeHoje() {
  const ids = estado.lancs.filter((l) => l.data === hoje() && !l.pago).map((l) => l.id);
  if (!ids.length) return;
  const { data, error } = await sb.from("lancamentos").update({ pago: true }).in("id", ids).select("id");
  if (error) { avisar(msgErro(error)); return; }
  vibrar(12);
  await carregar();
  avisar(`${data.length === 1 ? "1 lançamento" : `${data.length} lançamentos`} com check.`, async () => {
    const r = await sb.from("lancamentos").update({ pago: false }).in("id", data.map((x) => x.id));
    if (r.error) throw r.error;
  });
}

// ---------- conferir com o banco ----------

// Valor que pode ser negativo (conta no cheque especial): "-150,30".
function lerSaldo(txt) {
  const s = String(txt).trim(), neg = /^[-−]/.test(s) || /^R\$\s*[-−]/.test(s);
  const v = lerValor(s.replace(/[-−]/g, ""));
  return Number.isFinite(v) ? (neg ? -v : v) : NaN;
}
const naContaAgora = () => r2(estado.lancs.reduce((s, l) => (l.pago ? s + sinal(l) : s), 0));

function abrirConferir() {
  $("conferir-app").textContent = brl.format(naContaAgora());
  $("conferir-valor").value = "";
  $("conferir-previa").textContent = "";
  $("conferir-sugestoes").innerHTML = "";
  $("conferir-salvar").classList.remove("sec");
  $("conferir-erro").textContent = "";
  abrirPainel($("painel-conferir"));
  setTimeout(() => $("conferir-valor").focus(), 300);
}
// Diferença com o banco muitas vezes é um check esquecido: procura sem check dos últimos 15 dias
// (um lançamento ou dois somados) que explicam a diferença.
function checksQueExplicam(dif) {
  const hj = hoje(), desde = somarDias(hj, -15);
  const cand = estado.lancs.filter((l) => !l.pago && l.data >= desde && l.data <= hj && Number(l.valor) > 0);
  const um = cand.filter((l) => Math.abs(sinal(l) - dif) < 0.01).map((l) => [l]);
  if (um.length) return um.slice(0, 3);
  const dois = [];
  for (let a = 0; a < cand.length && dois.length < 3; a++)
    for (let b = a + 1; b < cand.length && dois.length < 3; b++)
      if (Math.abs(sinal(cand[a]) + sinal(cand[b]) - dif) < 0.01) dois.push([cand[a], cand[b]]);
  return dois;
}
function previaConferir() {
  const v = lerSaldo($("conferir-valor").value), dif = r2(v - naContaAgora());
  const caixa = $("conferir-sugestoes");
  const sugestoes = Number.isFinite(v) && Math.abs(dif) >= 0.01 ? checksQueExplicam(dif) : [];
  caixa.innerHTML = sugestoes.length
    ? `<p class="nota">Pode ser ${sugestoes.length === 1 ? "isto" : "um destes"}, sem check:</p>` + sugestoes.map((g) => `<button class="linha-simples" type="button" data-conferir-check="${g.map((l) => l.id).join(",")}">
        <span class="desc">${g.map((l) => esc(l.descricao)).join(" + ")}</span><span class="num quando">${g.map((l) => dataCurta(l.data)).join(", ")}</span><b class="num">Dar check</b></button>`).join("")
    : "";
  $("conferir-salvar").classList.toggle("sec", sugestoes.length > 0);
  $("conferir-previa").textContent = !Number.isFinite(v) ? ""
    : Math.abs(dif) < 0.01 ? "Bate com o app. Nada a ajustar."
    : sugestoes.length ? `Diferença de ${brl.format(Math.abs(dif))}. Se não for isso, o ajuste entra como ${dif > 0 ? "entrada" : "saída"} com check, hoje.`
    : `Diferença de ${brl.format(Math.abs(dif))}: entra um ajuste de ${dif > 0 ? "entrada" : "saída"} com check, hoje, para a conta bater.`;
}
$("conferir-valor").addEventListener("input", previaConferir);
$("conferir-sugestoes").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-conferir-check]");
  if (!b) return;
  const ids = b.dataset.conferirCheck.split(",");
  b.disabled = true;
  const { error } = await sb.from("lancamentos").update({ pago: true }).in("id", ids);
  if (error) { b.disabled = false; $("conferir-erro").textContent = msgErro(error); return; }
  await carregar();
  $("conferir-app").textContent = brl.format(naContaAgora());
  previaConferir();
  avisar(ids.length === 1 ? "Check dado. Era isso que faltava?" : "Checks dados. Era isso que faltava?", async () => {
    const r = await sb.from("lancamentos").update({ pago: false }).in("id", ids);
    if (r.error) throw r.error;
  });
});
$("painel-conferir").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const v = lerSaldo($("conferir-valor").value);
  if (!Number.isFinite(v)) { $("conferir-erro").textContent = "Digite o saldo do banco, por exemplo 1.250,30 ou -80,00."; return; }
  const dif = r2(v - naContaAgora());
  if (Math.abs(dif) < 0.01) { fecharPaineis(); avisar("Bate com o banco."); return; }
  const btn = $("conferir-salvar");
  btn.disabled = true;
  try {
    const linha = {
      id: crypto.randomUUID(), casa_id: estado.casa.id, descricao: "Ajuste com o banco", tipo: dif > 0 ? "receita" : "despesa",
      valor: Math.abs(dif), data: hoje(), pago: true, recorrente: false, parcela: null, parcelas: null, grupo: null,
      ...(estado.temCategoria ? { categoria: dif > 0 ? "ajuste" : "outros" } : {}),
    };
    const { error } = await sb.from("lancamentos").upsert(linha);
    if (error) throw error;
    fecharPaineis();
    await carregar();
    avisar(`Ajustado: a conta agora mostra ${brl.format(v)}.`, () => apagarIds([linha.id]));
  } catch (e) {
    $("conferir-erro").textContent = msgErro(e);
  } finally {
    btn.disabled = false;
  }
});

// ---------- primeira vez ----------

// O que já foi feito para a casa começar, lido dos próprios dados.
function progressoInicio() {
  const L = estado.lancs;
  return {
    saldo: L.length > 0,
    casal: estado.membros.size >= 2,
    receita: L.some((l) => l.tipo === "receita" && l.recorrente),
    fixas: L.some((l) => l.tipo === "despesa" && l.recorrente),
  };
}
const CHAVE_INICIO = "fin-inicio-dispensado-v1";
function inicioDispensado() { try { return localStorage.getItem(CHAVE_INICIO) === estado.casa?.id; } catch (e) { return false; } }

function passosHtml(p) {
  const passo = (n, feito, corpo, attrs) => `<${feito ? "div" : "button type=\"button\""} class="passo ${feito ? "feito" : ""}" ${feito ? "" : attrs}>
    <span class="passo-n">${feito ? '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : n}</span><div>${corpo}</div>${feito ? "" : IC.ir}</${feito ? "div" : "button"}>`;
  return [
    passo(2, p.casal, "<b>Chame quem divide a casa</b><small>Os dois veem e lançam juntos, cada um no seu celular.</small>", 'data-bv="convidar"'),
    passo(3, p.receita, "<b>O que entra todo mês</b><small>Salário, vale, renda extra.</small>", 'data-bv="receita"'),
    passo(4, p.fixas, "<b>As contas fixas</b><small>Aluguel, luz, internet, escola.</small>", 'data-bv="fixa"'),
  ].join("");
}

function boasVindasHtml() {
  return `<section class="boas-vindas">
    <h2>Vamos começar.</h2>
    <p>O app soma o que já tem <b>check</b> (pago ou recebido) e prevê o resto do mês com o que ainda não tem. São quatro passos, em qualquer ordem.</p>
    <form class="passo" id="bv-saldo" novalidate>
      <span class="passo-n">1</span>
      <div><b>Quanto tem na conta hoje?</b><small>O saldo que o banco mostra agora.</small>
        <div class="linha-nome"><input id="bv-saldo-valor" class="num" inputmode="decimal" placeholder="0,00" autocomplete="off" aria-label="Saldo de hoje"><button class="btn" type="submit">Salvar</button></div>
      </div>
    </form>
    ${passosHtml(progressoInicio())}
  </section>`;
}

// Depois do primeiro lançamento, o que falta aparece numa faixa até tudo estar feito (ou ser dispensado).
function faltaPoucoHtml() {
  if (!estado.lancs.length || inicioDispensado()) return "";
  const p = progressoInicio(), feitos = Object.values(p).filter(Boolean).length;
  if (feitos === 4) return "";
  return `<section class="falta-pouco" aria-label="Para começar">
    <div class="falta-cab"><b>Falta pouco: ${feitos} de 4</b><button class="link" type="button" data-bv="dispensar">Agora não</button></div>
    ${passosHtml(p)}
  </section>`;
}
$("conteudo").addEventListener("submit", async (ev) => {
  if (ev.target.id !== "bv-saldo") return;
  ev.preventDefault();
  const v = lerSaldo($("bv-saldo-valor").value);
  if (!Number.isFinite(v)) { avisar("Digite o saldo, por exemplo 1.250,30."); return; }
  const linha = {
    id: crypto.randomUUID(), casa_id: estado.casa.id, descricao: "Saldo inicial", tipo: v >= 0 ? "receita" : "despesa",
    valor: Math.abs(v), data: hoje(), pago: true, recorrente: false, parcela: null, parcelas: null, grupo: null,
    ...(estado.temCategoria || !estado.lancs.length ? { categoria: v >= 0 ? "ajuste" : "outros" } : {}),
  };
  const { error } = await sb.from("lancamentos").upsert(linha);
  if (error) { avisar(msgErro(error)); return; }
  await carregar();
  avisar(estado.membros.size < 2 ? "Saldo de hoje salvo. Agora chame quem divide a casa." : "Saldo de hoje salvo. Agora o que entra todo mês.");
});
$("conteudo").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-bv]");
  if (!b) return;
  if (b.dataset.bv === "dispensar") { try { localStorage.setItem(CHAVE_INICIO, estado.casa.id); } catch (e) {} render(); return; }
  if (b.dataset.bv === "receita") abrirLanc(null, { tipo: "receita", repetir: "mensal", semFim: true });
  else if (b.dataset.bv === "fixa") abrirLanc(null, { tipo: "despesa", repetir: "mensal", semFim: true });
  else $("btn-convidar").click();
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
        <span class="cat-ic">${iconeDe(l)}</span><span class="desc">${esc(l.descricao)}</span>
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
  document.querySelector('meta[name="theme-color"]').content = escuro ? "#0a0b0f" : "#f3f7f9";
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
  let noServidor = false, resumo = false;
  if (sub) {
    const { data } = await sb.from("push_inscricoes").select("endpoint, resumo").eq("endpoint", sub.endpoint);
    noServidor = !!data?.length;
    resumo = !!data?.[0]?.resumo;
  }
  chave.checked = !!sub && noServidor && Notification.permission === "granted";
  // O resumo vai pelo mesmo canal: só aparece com os lembretes ligados.
  $("bloco-resumo").hidden = !chave.checked;
  $("resumo-ligar").checked = resumo;
  $("resumo-estado").textContent = resumo ? "Ligado" : "Desligado";
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
      if (error) await sub.unsubscribe().catch(() => {});
      if (error) throw (/push_inscricoes/.test(error.message) ? new Error("Falta atualizar o banco (05_lembretes.sql).") : error);
      avisar("Lembretes ligados neste celular.");
    } else {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const r = await sb.from("push_inscricoes").delete().eq("endpoint", sub.endpoint);
        if (r.error) throw new Error("Não consegui desligar no servidor: " + msgErro(r.error));
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

$("resumo-ligar").addEventListener("change", async (e) => {
  const chave = e.target;
  chave.disabled = true;
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (!sub) throw new Error("Ligue os lembretes primeiro.");
    const { data, error } = await sb.from("push_inscricoes").update({ resumo: chave.checked }).eq("endpoint", sub.endpoint).select("endpoint");
    if (error) throw error;
    if (!data.length) throw new Error("Este celular não está inscrito. Desligue e ligue os lembretes de novo.");
    $("resumo-estado").textContent = chave.checked ? "Ligado" : "Desligado";
    avisar(chave.checked ? "Resumo da semana ligado neste celular." : "Resumo da semana desligado neste celular.");
  } catch (err) {
    chave.checked = !chave.checked;
    avisar(msgErro(err));
  } finally {
    chave.disabled = false;
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
    l.data.split("-").reverse().join("/"), l.descricao, rotTipo(l.tipo), nomeCatDe(l),
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

// Um pedido por vez: cada pedido novo invalida o link do anterior.
let esqueciAte = 0;
$("login-esqueci").onclick = async () => {
  const email = $("login-email").value.trim();
  const b = $("login-esqueci");
  if (!email) { $("login-erro").textContent = "Digite seu e-mail acima e toque de novo em \"Esqueci a senha\"."; return; }
  if (Date.now() < esqueciAte) { $("login-erro").textContent = "O link já foi enviado. Use o e-mail mais recente; se não chegar, espere um minuto e peça de novo."; return; }
  b.disabled = true;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  b.disabled = false;
  if (!error) esqueciAte = Date.now() + 60000;
  $("login-erro").textContent = error ? msgErro(error) : "Enviamos um link para trocar a senha. Abra o e-mail mais recente; os anteriores deixam de valer.";
};

$("form-nova-senha").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const btn = ev.submitter || $("form-nova-senha").querySelector("button");
  btn.disabled = true;
  const { error } = await sb.auth.updateUser({ password: $("nova-senha").value });
  btn.disabled = false;
  if (error) { $("nova-senha-erro").textContent = msgErro(error); return; }
  estado.recuperando = false;
  history.replaceState(null, "", location.pathname);
  avisar("Senha trocada.");
  abrirCasa();
});

$("form-casa").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("casa-erro").textContent = "";
  const { data, error } = await sb.rpc("entrar_na_casa", { p_codigo: $("casa-codigo").value });
  if (error) { $("casa-erro").textContent = msgErro(error); return; }
  if (!data) { $("casa-erro").textContent = "Código não encontrado. Confira as letras e tente de novo."; return; }
  abrirCasa();
});

// ---------- PWA ----------

if ("serviceWorker" in navigator) {
  // Versão nova do app: procura ao voltar para a tela e recarrega sozinho quando nada está aberto.
  const tinhaVersao = !!navigator.serviceWorker.controller;
  let recarregarDepois = false;
  const recarregarSeLivre = () => {
    const ocupado = PAINEIS.some((id) => !$(id).hidden) || !$("painel-confirma").hidden;
    if (ocupado) { recarregarDepois = true; return; }
    location.reload();
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (tinhaVersao) recarregarSeLivre(); });
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js")
    .then((reg) => document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
      else if (recarregarDepois) location.reload();
    }))
    .catch((e) => console.warn("service worker não registrado", e)));
}

iniciar();
