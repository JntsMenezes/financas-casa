"use strict";

const cfg = window.FIN_CONFIG || {};
const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (id) => document.getElementById(id);
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const nomeDia = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

const estado = {
  sessao: null,
  casa: null,
  lancs: [],
  saldoApos: new Map(),
  mes: null, // "AAAA-MM"
  filtro: "todos",
  editando: null,
  canal: null,
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
function fimDoMes(mes) { const [a, m] = mes.split("-").map(Number); return iso(new Date(a, m, 0)); }
function dataCurta(s) { return s.slice(8, 10) + "/" + s.slice(5, 7); }

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

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visivel"), 2800);
}

function msgErro(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada).";
  if (/User already registered/i.test(m)) return "Esse e-mail já tem conta. Use \"Entrar\".";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Sem internet. Tente de novo quando conectar.";
  return m;
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
  if (estado.canal) { sb.removeChannel(estado.canal); estado.canal = null; }
  estado.casa = null;
  estado.lancs = [];
  fecharPaineis();
  mostrarTela("tela-login");
}

async function abrirCasa() {
  if (!estado.sessao) { mostrarTela("tela-login"); return; }
  const { data, error } = await sb.from("membros").select("casa_id, casas(id, nome, codigo)").limit(1);
  if (error) { toast(msgErro(error)); mostrarTela("tela-casa"); return; }
  if (!data.length) { mostrarTela("tela-casa"); return; }
  estado.casa = data[0].casas;
  estado.mes = estado.mes || hoje().slice(0, 7);
  mostrarTela("tela-app");
  await carregar();
  assinarMudancas();
  const diaHoje = $("dia-hoje");
  if (diaHoje) diaHoje.scrollIntoView({ block: "start" });
}

async function carregar() {
  const todos = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from("lancamentos").select("*")
      .eq("casa_id", estado.casa.id).order("data").order("criado_em").range(de, de + 999);
    if (error) { toast(msgErro(error)); return; }
    todos.push(...data);
    if (data.length < 1000) break;
  }
  definirLancs(todos);
}

function definirLancs(lista) {
  // Mesma ordem da planilha: por data, receitas antes das despesas.
  lista.sort((a, b) =>
    a.data.localeCompare(b.data) ||
    (a.tipo === b.tipo ? 0 : a.tipo === "receita" ? -1 : 1) ||
    a.criado_em.localeCompare(b.criado_em));
  estado.lancs = lista;
  estado.saldoApos = new Map();
  let s = 0;
  for (const l of lista) { s += sinal(l); estado.saldoApos.set(l.id, Math.round(s * 100) / 100); }
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

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && estado.casa) carregar();
});

// ---------- tela principal ----------

function render() {
  const mes = estado.mes;
  const tituloMes = nomeMes.format(deIso(mes + "-01"));
  $("mes-nome").textContent = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1);
  const fim = fimDoMes(mes);
  const hj = hoje();
  const doMes = estado.lancs.filter((l) => l.data.startsWith(mes));

  const naConta = estado.lancs.reduce((s, l) => (l.pago ? s + sinal(l) : s), 0);
  let fimMes = 0;
  for (const l of estado.lancs) if (l.data <= fim) fimMes += sinal(l);
  const entradas = doMes.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
  const saidas = doMes.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);

  // Ponto mais baixo do saldo previsto dentro do mês.
  let menor = null;
  for (const l of doMes) {
    const s = estado.saldoApos.get(l.id);
    if (menor === null || s < menor.saldo) menor = { saldo: s, data: l.data };
  }
  const atrasados = estado.lancs.filter((l) => !l.pago && l.data < hj);

  const avisos = [];
  if (menor && menor.saldo < 0) {
    avisos.push(`<div class="aviso ruim">O saldo previsto fica negativo em ${dataCurta(menor.data)}: ${brl.format(menor.saldo)}.</div>`);
  }
  if (atrasados.length) {
    const tot = atrasados.reduce((s, l) => s + sinal(l), 0);
    avisos.push(`<div class="aviso atencao">${atrasados.length} ${atrasados.length === 1 ? "lançamento passou da data" : "lançamentos passaram da data"} sem check (${brl.format(tot)}).</div>`);
  }

  let lista = doMes;
  if (estado.filtro === "pendentes") lista = doMes.filter((l) => !l.pago);
  if (estado.filtro === "despesas") lista = doMes.filter((l) => l.tipo === "despesa");
  if (estado.filtro === "receitas") lista = doMes.filter((l) => l.tipo === "receita");

  const grupos = new Map();
  for (const l of lista) { if (!grupos.has(l.data)) grupos.set(l.data, []); grupos.get(l.data).push(l); }

  let corpo = "";
  for (const [data, itens] of grupos) {
    const ehHoje = data === hj;
    const saldoDia = estado.saldoApos.get(itens[itens.length - 1].id);
    corpo += `<div class="dia" ${ehHoje ? 'id="dia-hoje"' : ""}>
      <div class="dia-cab ${ehHoje ? "hoje" : ""}"><span>${ehHoje ? "Hoje · " : ""}${nomeDia.format(deIso(data))}</span>${estado.filtro === "todos" ? `<span class="num">fim do dia ${brl.format(saldoDia)}</span>` : ""}</div>
      <div class="lista">${itens.map((l) => itemHtml(l, hj)).join("")}</div>
    </div>`;
  }
  if (!lista.length) corpo = `<div class="vazio">${doMes.length ? "Nada nesse filtro." : "Nenhum lançamento neste mês.<br>Toque em + para adicionar."}</div>`;

  const chip = (v, t) => `<button class="chip ${estado.filtro === v ? "ativo" : ""}" data-filtro="${v}">${t}</button>`;

  $("conteudo").innerHTML = `
    <section class="resumo">
      <div class="card"><div class="rot">Na conta agora</div><div class="val num ${naConta < 0 ? "neg" : ""}">${brl.format(naConta)}</div></div>
      <div class="card"><div class="rot">Previsto no fim do mês</div><div class="val num ${fimMes < 0 ? "neg" : ""}">${brl.format(fimMes)}</div></div>
      <div class="card largo">
        <div><div class="rot">Entradas do mês</div><div class="val num pos">${brl.format(entradas)}</div></div>
        <div><div class="rot">Saídas do mês</div><div class="val num neg">${brl.format(saidas)}</div></div>
      </div>
    </section>
    <section class="avisos">${avisos.join("")}</section>
    <nav class="filtros">${chip("todos", "Todos")}${chip("pendentes", "Sem check")}${chip("despesas", "Despesas")}${chip("receitas", "Receitas")}</nav>
    ${corpo}`;
}

function itemHtml(l, hj) {
  const atrasado = !l.pago && l.data < hj;
  const s = estado.saldoApos.get(l.id);
  const tags = [];
  if (l.parcelas) tags.push(`<span class="tag">${l.parcela}/${l.parcelas}</span>`);
  if (l.recorrente) tags.push(`<span class="tag">fixa</span>`);
  if (atrasado) tags.push(`<span class="tag atraso">atrasado</span>`);
  return `<div class="item ${l.pago ? "" : "previsto"}">
    <button class="check ${l.pago ? "ok" : ""} ${atrasado ? "atrasado" : ""}" data-check="${l.id}" aria-label="${l.pago ? "Tirar check" : "Marcar como pago"}">✓</button>
    <button class="corpo" data-editar="${l.id}">
      <div class="txt">
        <div class="desc">${esc(l.descricao)}</div>
        ${tags.length ? `<div class="meta">${tags.join("")}</div>` : ""}
      </div>
      <div class="dir">
        <div class="valor num ${l.tipo === "receita" ? "pos" : "neg"}">${l.tipo === "receita" ? "+" : "−"} ${brl.format(Number(l.valor))}</div>
        <div class="saldo-linha num ${s < 0 ? "neg" : ""}">saldo ${brl.format(s)}</div>
      </div>
    </button>
  </div>`;
}

$("conteudo").addEventListener("click", async (ev) => {
  const f = ev.target.closest("[data-filtro]");
  if (f) { estado.filtro = f.dataset.filtro; render(); return; }
  const c = ev.target.closest("[data-check]");
  if (c) { await alternarPago(c.dataset.check); return; }
  const e = ev.target.closest("[data-editar]");
  if (e) abrirLanc(estado.lancs.find((l) => l.id === e.dataset.editar));
});

async function alternarPago(id) {
  const l = estado.lancs.find((x) => x.id === id);
  if (!l) return;
  l.pago = !l.pago;
  render();
  const { error } = await sb.from("lancamentos").update({ pago: l.pago }).eq("id", id);
  if (error) { l.pago = !l.pago; render(); toast(msgErro(error)); }
}

function mudarMes(n) {
  estado.mes = somarMeses(estado.mes + "-01", n).slice(0, 7);
  render();
  window.scrollTo({ top: 0 });
}
$("mes-ant").onclick = () => mudarMes(-1);
$("mes-prox").onclick = () => mudarMes(1);

// Deslizar para os lados troca o mês.
let toqueX = null, toqueY = null;
$("tela-app").addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY; }, { passive: true });
$("tela-app").addEventListener("touchend", (e) => {
  if (toqueX === null) return;
  const dx = e.changedTouches[0].clientX - toqueX, dy = e.changedTouches[0].clientY - toqueY;
  toqueX = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) mudarMes(dx < 0 ? 1 : -1);
}, { passive: true });

// ---------- painéis ----------

function abrirPainel(p) {
  fecharPaineis(true);
  $("fundo").hidden = false;
  p.hidden = false;
  requestAnimationFrame(() => { $("fundo").classList.add("aberto"); p.classList.add("aberto"); });
}
function fecharPaineis(semAnimar) {
  for (const p of [$("painel-lanc"), $("painel-ajustes"), $("fundo")]) {
    p.classList.remove("aberto");
    if (semAnimar) p.hidden = true; else setTimeout(() => { if (!p.classList.contains("aberto")) p.hidden = true; }, 250);
  }
}
$("fundo").onclick = () => fecharPaineis();
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharPaineis(); });

// ---------- lançamento ----------

let tipoSel = "despesa";
function definirTipo(t) {
  tipoSel = t;
  for (const b of $("lanc-tipo").children) b.classList.toggle("ativo", b.dataset.tipo === t);
  $("lanc-pago-rot").textContent = t === "receita" ? "Já foi recebido" : "Já foi pago";
}
$("lanc-tipo").onclick = (e) => { const b = e.target.closest("[data-tipo]"); if (b) definirTipo(b.dataset.tipo); };

$("lanc-repetir").onchange = () => {
  const v = $("lanc-repetir").value;
  $("bloco-meses").hidden = v !== "mensal";
  $("bloco-parcelas").hidden = v !== "parcelado";
};

$("lanc-data").onchange = () => {
  if (!estado.editando) $("lanc-pago").checked = $("lanc-data").value <= hoje();
};

// Ao escolher uma descrição já usada, sugere o tipo e o último valor.
$("lanc-desc").addEventListener("change", () => {
  if (estado.editando || $("lanc-valor").value.trim()) return;
  const d = $("lanc-desc").value.trim().toLowerCase();
  const ultimo = [...estado.lancs].reverse().find((l) => l.descricao.toLowerCase() === d);
  if (ultimo) { definirTipo(ultimo.tipo); $("lanc-valor").value = mostrarValor(Number(ultimo.valor)); }
});

function preencherSugestoes() {
  const vistos = new Map();
  for (const l of estado.lancs) vistos.set(l.descricao.toLowerCase(), l.descricao);
  $("sugestoes").innerHTML = [...vistos.values()].sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((d) => `<option value="${esc(d)}"></option>`).join("");
}

function abrirLanc(l) {
  estado.editando = l || null;
  preencherSugestoes();
  $("lanc-erro").textContent = "";
  $("lanc-titulo").textContent = l ? "Editar lançamento" : "Novo lançamento";
  definirTipo(l ? l.tipo : "despesa");
  $("lanc-valor").value = l ? mostrarValor(Number(l.valor)) : "";
  $("lanc-desc").value = l ? l.descricao : "";
  const dataPadrao = estado.mes === hoje().slice(0, 7) ? hoje() : estado.mes + "-01";
  $("lanc-data").value = l ? l.data : dataPadrao;
  $("lanc-pago").checked = l ? l.pago : dataPadrao <= hoje();
  $("bloco-repetir").hidden = !!l;
  $("lanc-repetir").value = "nao";
  $("lanc-repetir").onchange();
  $("lanc-meses").value = 12;
  $("lanc-parc").value = 1;
  $("lanc-parcs").value = 2;
  const temSerie = !!(l && l.grupo);
  $("bloco-serie").hidden = !temSerie;
  $("lanc-serie").checked = false;
  $("lanc-acoes").hidden = !l;
  $("lanc-apagar-serie").hidden = !temSerie;
  $("lanc-estender").hidden = !(temSerie && l.recorrente);
  abrirPainel($("painel-lanc"));
  if (!l) setTimeout(() => $("lanc-valor").focus(), 260);
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
    if (l) {
      const campos = { descricao, tipo: tipoSel, valor };
      let r = await sb.from("lancamentos").update({ ...campos, data, pago: $("lanc-pago").checked }).eq("id", l.id);
      if (r.error) throw r.error;
      if (l.grupo && $("lanc-serie").checked) {
        r = await sb.from("lancamentos").update(campos).eq("grupo", l.grupo).gt("data", l.data);
        if (r.error) throw r.error;
      }
      toast("Alterado.");
    } else {
      const base = { casa_id: estado.casa.id, descricao, tipo: tipoSel, valor };
      const pagoPrimeiro = $("lanc-pago").checked;
      const rep = $("lanc-repetir").value;
      let linhas;
      if (rep === "mensal") {
        const n = Math.min(60, Math.max(2, parseInt($("lanc-meses").value, 10) || 12));
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
      const { error } = await sb.from("lancamentos").insert(linhas);
      if (error) throw error;
      toast(linhas.length > 1 ? `${linhas.length} lançamentos criados.` : "Lançado.");
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
  if (!l || !confirm(`Apagar "${l.descricao}" de ${dataCurta(l.data)}?`)) return;
  const { error } = await sb.from("lancamentos").delete().eq("id", l.id);
  if (error) return toast(msgErro(error));
  fecharPaineis(); toast("Apagado."); carregar();
};

$("lanc-apagar-serie").onclick = async () => {
  const l = estado.editando;
  if (!l) return;
  const n = estado.lancs.filter((x) => x.grupo === l.grupo && x.data >= l.data).length;
  if (!confirm(`Apagar "${l.descricao}" de ${dataCurta(l.data)} em diante (${n} lançamentos)?`)) return;
  const { error } = await sb.from("lancamentos").delete().eq("grupo", l.grupo).gte("data", l.data);
  if (error) return toast(msgErro(error));
  fecharPaineis(); toast(`${n} apagados.`); carregar();
};

$("lanc-estender").onclick = async () => {
  const l = estado.editando;
  if (!l) return;
  const serie = estado.lancs.filter((x) => x.grupo === l.grupo);
  const ultimo = serie[serie.length - 1];
  const linhas = Array.from({ length: 12 }, (_, i) => ({
    casa_id: estado.casa.id, descricao: ultimo.descricao, tipo: ultimo.tipo, valor: ultimo.valor,
    data: somarMeses(ultimo.data, i + 1), pago: false, recorrente: true, grupo: l.grupo,
  }));
  const { error } = await sb.from("lancamentos").insert(linhas);
  if (error) return toast(msgErro(error));
  fecharPaineis(); toast(`Repetido até ${dataCurta(linhas[11].data)}/${linhas[11].data.slice(2, 4)}.`); carregar();
};

// ---------- ajustes ----------

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
  abrirPainel($("painel-ajustes"));
};
$("btn-sair").onclick = () => sb.auth.signOut();
$("casa-sair").onclick = () => sb.auth.signOut();

$("btn-exportar").onclick = () => {
  const cab = ["Data", "Descrição", "Tipo", "Valor", "Pago", "Recorrente", "Parcela", "Saldo"];
  const linhas = estado.lancs.map((l) => [
    l.data.split("-").reverse().join("/"), l.descricao, l.tipo === "receita" ? "Receita" : "Despesa",
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
  $("login-btn").textContent = modoCadastro ? "Criar conta" : "Entrar";
  $("login-alternar").textContent = modoCadastro ? "Já tenho conta" : "Ainda não tenho conta";
  $("login-sub").textContent = modoCadastro ? "Crie sua conta com e-mail e uma senha de pelo menos 6 caracteres." : "Entre com seu e-mail e senha.";
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
  toast("Senha trocada.");
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
