---
name: Finanças da Casa
description: PWA de finanças a dois, calmo e quente, no mundo do logo Ninho (creme, verde-ninho e um ovo âmbar), que lê o mês em uma frase com o número na cor de ação. Três paletas por celular (Ninho, Rosa, Noite) sobre os mesmos papéis.
colors:
  fundo: "#faf6ee"
  superficie: "#fffdf8"
  campo: "#fffdf8"
  tinta: "#1f2a27"
  tinta-suave: "#675f53"
  linha: "#e8dfcf"
  check-borda: "#8a8172"
  acao: "#123f3b"
  sobre-acao: "#f4ecdd"
  acao-texto: "#1c6b5d"
  acao-fundo: "#e3ebe4"
  guardado: "#e3a33b"
  guardado-texto: "#7a4f0c"
  guardado-fundo: "#f7ead2"
  negativo: "#9b1c13"
  negativo-fundo: "#fbe8e3"
  aviso-ruim-texto: "#7a1a12"
  verde: "#0f766e"
  verde-fundo: "#e1efe8"
  ambar: "#9a5b00"
  ambar-fundo: "#f8ead0"
  aviso-atencao-texto: "#6b3e00"
  topo: "#f1e7d4"
  pessoa-1: "#3f51a8"
  pessoa-2: "#a3367a"
  vidro: "rgba(250, 246, 238, .84)"
  fundo-escuro: "#0e1917"
  superficie-escuro: "#152320"
  campo-escuro: "#111e1b"
  tinta-escuro: "#f1e9da"
  tinta-suave-escuro: "#a59d8d"
  linha-escuro: "rgba(241,233,218,.09)"
  acao-escuro: "#f4ecdd"
  sobre-acao-escuro: "#123f3b"
  acao-texto-escuro: "#9fd3bf"
  guardado-texto-escuro: "#f0c27a"
  negativo-escuro: "#f08a7e"
  verde-escuro: "#8fd3bf"
  ambar-escuro: "#f2b54d"
  pessoa-1-escuro: "oklch(.78 .1 265)"
  pessoa-2-escuro: "oklch(.8 .11 345)"
  rosa-fundo: "#edbec6"
  rosa-superficie: "#fffaf9"
  rosa-tinta: "#2a2b2e"
  rosa-tinta-suave: "#5a4f4c"
  rosa-acao: "#22e3a2"
  rosa-acao-texto: "#085a3f"
  rosa-guardado: "#d99a2b"
  rosa-guardado-texto: "#6b4408"
  rosa-fundo-escuro: "#1e1619"
  rosa-superficie-escuro: "#2a2024"
  noite-fundo: "#0b1430"
  noite-superficie: "#142049"
  noite-tinta: "#eef1f8"
  noite-tinta-suave: "#a3abc4"
  noite-acao: "#3d6bff"
  noite-acao-texto: "#8eaaff"
  noite-guardado: "#ffa53d"
typography:
  display:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(31px, 9vw, 40px)"
    fontWeight: 750
    lineHeight: 1.08
    letterSpacing: "-.03em"
  stat:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(20px, 6vw, 25px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.02em"
  body:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  body-apoio:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.5
  item:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-.005em"
  valor:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    letterSpacing: "-.01em"
    fontFeature: "tnum"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0"
    fontFeature: "tnum"
rounded:
  tag: "6px"
  chip: "10px"
  campo: "12px"
  raio: "14px"
  caixinha: "16px"
  fab: "18px"
  painel: "24px"
  pilula: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "14px"
  gutter: "16px"
  lg: "18px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.acao}"
    textColor: "{colors.sobre-acao}"
    typography: "{typography.body}"
    rounded: "{rounded.raio}"
    padding: "13px"
    height: "50px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.raio}"
    padding: "13px"
    height: "50px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.acao-texto}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.negativo}"
    textColor: "{colors.sobre-acao}"
    rounded: "{rounded.raio}"
    height: "50px"
  chip:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.chip}"
    padding: "0 14px"
    height: "44px"
  chip-active:
    backgroundColor: "{colors.acao-fundo}"
    textColor: "{colors.acao}"
    rounded: "{rounded.chip}"
    height: "44px"
  input:
    backgroundColor: "{colors.campo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.campo}"
    padding: "13px 14px"
  selo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta-suave}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0 10px"
    height: "26px"
  lista:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.raio}"
  item:
    backgroundColor: "{colors.superficie}"
    typography: "{typography.item}"
    padding: "6px 14px 6px 6px"
    height: "60px"
  atalho:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.raio}"
    padding: "10px 11px"
    height: "64px"
  fab:
    backgroundColor: "{colors.acao}"
    textColor: "{colors.sobre-acao}"
    rounded: "{rounded.fab}"
    size: "60px"
  painel:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.painel}"
    padding: "8px 18px 18px"
  aviso-ruim:
    backgroundColor: "{colors.negativo-fundo}"
    textColor: "{colors.aviso-ruim-texto}"
    rounded: "{rounded.raio}"
    padding: "12px 14px"
    height: "48px"
  aviso-atencao:
    backgroundColor: "{colors.ambar-fundo}"
    textColor: "{colors.aviso-atencao-texto}"
    rounded: "{rounded.raio}"
    padding: "12px 14px"
    height: "48px"
---

# Design System: Finanças da Casa

## Overview

**Creative North Star: "O Extrato que Fala"**

O app lê o mês em voz alta. A tela abre com uma frase grande em Manrope 750, de letras juntas, que diz quanto há hoje, o dia mais apertado (se ficar negativo) e como o mês termina, com o número na cor de ação. Em volta, só o que ajuda a agir: três números do mês (entra, sai, guarda), a lista do que vence hoje e as barras do saldo dia a dia. O mundo visual é o do logo Ninho: creme quente, verde-ninho nas ações e um ovo âmbar que marca o que é guardado e o dia de hoje.

A densidade é de app de bolso, usado com uma mão: uma coluna de até 560px, alvos de toque de 44px ou mais, itens de 60px. A partir de 900px, vira duas colunas, com o resumo à esquerda e o extrato à direita. Cada celular escolhe a própria paleta (Ninho, Rosa ou Noite) e o tema (automático, claro, escuro; a Noite é só escura). Todas as paletas preenchem os mesmos papéis, então o desenho não muda, só a cor.

A calma vem da contenção. Vermelho aparece só para valor ou dia negativo; âmbar de aviso só quando há algo a fazer. As duas pessoas da casa têm cada uma a sua cor, tirada da paleta que cada uma escolheu, e ela aparece só em pontos pequenos.

**Key Characteristics:**
- Frase de leitura em Manrope 750 como peça principal; número em `acao-texto`, negativo em `negativo`.
- Só Manrope; valores com `tabular-nums`; sem mono e sem maiúsculas espaçadas.
- Superfícies chapadas com borda de 1px e raio de 14px; sombra só no que flutua.
- Âmbar (o ovo) só no guardado e no hoje.
- Três paletas por celular sobre os mesmos papéis: `--fundo`, `--acao`, `--guardado`, `--negativo`.
- Presença do casal: iniciais, "ao vivo", quem lançou cada item no próprio círculo do check.

## Colors

Creme quente e verde-ninho, um ovo âmbar e um vermelho que só aparece para negativo.

### Primary
- **Verde Ninho** (`acao`, #123f3b no claro; creme #f4ecdd no escuro): botão principal, botão +, check marcado, chip ativo. Texto sobre ele em `sobre-acao`.
- **Verde da Frase** (`acao-texto`, #1c6b5d / #9fd3bf): número da frase, links e textos de ação, cabeçalho de Hoje. É a mesma ação em tom de texto (4,5:1 sobre o fundo).

### Secondary
- **Ovo** (`guardado`, #e3a33b): caixinhas, "guarda" no resumo quando é maior que zero, ícone de caixinha, ponto de hoje no gráfico, ovinho na divisória de Hoje. Em texto, `guardado-texto`.

### Tertiary
- **Negativo** (`negativo`, #9b1c13 no claro; salmão #f08a7e no escuro): comum a todas as paletas. Só para valor ou dia negativo (linha do pior dia na frase, barras abaixo do zero, aviso de negativo) e botão de apagar.
- **Atenção** (`ambar`, #9a5b00): limite de categoria perto de estourar, selo "sem internet", avisos que pedem ação sem ser negativo. Sempre com texto (`aviso-atencao-texto`).
- **Verde de entrada** (`verde`, #0f766e / #8fd3bf): valores de entrada na lista e barras de entrada.

### Paletas (Ajustes > Cores, por celular)
- **Ninho** (padrão): os valores acima, claro e escuro.
- **Rosa:** fundo #edbec6 (escolhido pelo dono), superfície #fffaf9, tinta grafite #2a2b2e, ação menta #22e3a2 com texto de ação #085a3f, guardado #d99a2b. Escuro em ameixa #1e1619. A luz do alto é branca.
- **Noite:** só escura. Fundo azul-tinta #0b1430, superfície #142049, ação azul #3d6bff (texto #8eaaff), guardado #ffa53d. Com a Noite, o seletor de Tema some e aparece a explicação.

### Pessoas da casa
- **Pessoa 1 / Pessoa 2** (`--q1`, `--q2`): cada pessoa leva a cor de ação da paleta que escolheu (ninho #1c6b5d/#9fd3bf, rosa #c2547a/#f0a6b8, noite #3d6bff/#8eaaff). Se as duas escolherem a mesma paleta, a outra pessoa recebe a vizinha. A inicial vai em tinta escura ou clara, a que der mais contraste (`--q1-tx`, `--q2-tx`, calculados no app).

### Neutral
- **Creme** (`fundo`) / **Verde-noite** (`fundo-escuro`): fundo da página. No alto da home, um degradê de `topo` sumindo no fundo.
- **Placa** (`superficie`): listas, cartões, chips, painéis.
- **Tinta** e **Tinta Suave**: texto principal e de apoio.
- **Fio** (`linha`): bordas de 1px e divisórias.
- **Vidro** (`vidro`): barra do topo depois de rolar.

### Named Rules
**A Regra do Ovo.** O âmbar marca só o que é guardado e o dia de hoje. Zero guardado fica em tinta neutra. Âmbar não é cor de aviso.

**A Regra do Vermelho Só no Negativo.** Vermelho aparece para valor ou dia negativo e para apagar. Atraso, limite e meta não usam vermelho; a Visão do ano nunca pinta "guardam 0%" de vermelho.

**A Regra dos Papéis Comuns.** Toda paleta define `--fundo`, `--acao`, `--sobre-acao`, `--acao-texto`, `--guardado`, `--guardado-texto`; `--negativo` é o mesmo em todas. Nenhuma ação ou guardado é vermelho.

**A Regra das Duas Cores Pequenas.** As cores das pessoas ficam em pontos de até 30px (iniciais, círculo de quem lançou), nunca em blocos ou gráficos.

## Typography

**Display Font:** Manrope (variável 200–800, auto-hospedada em `fonts/`), com system-ui de reserva
**Body Font:** Manrope

**Character:** uma família só, apertada e pesada na frase, normal no resto. Números sempre tabulares.

### Hierarchy
- **Display** (750, clamp 31–40px, entrelinha 1.08, -.03em, `text-wrap: balance`): a frase do mês. A segunda linha (fim do mês) vem em tinta suave com o número em tinta; a linha do pior dia, quando negativo, vem toda em `negativo`.
- **Stat** (800, clamp 20–25px, tabular): entra, sai, guarda abaixo da frase, com "mil"/"mi" a 62% e uma casa decimal fixa.
- **Headline** (650, 34px): total das caixinhas.
- **Title** (650, 20px): título dos painéis.
- **Body** (400, 16px): texto corrido e campos (16px evita zoom no iOS).
- **Apoio** (400, 15.5px, até 46ch): linha abaixo da frase.
- **Item** (500, 15.5px): descrição do lançamento, uma linha com reticências.
- **Valor** (650, 15px, tabular): valor do item; "a definir" em 13px tinta suave quando o valor é zero.
- **Label** (600, 12.5px): rótulos dos stats, categoria e "fixa" sob o item, cabeçalho do gráfico.

### Named Rules
**A Regra da Letra Única.** Só Manrope. Valores e datas com `tabular-nums`; nada de mono e nada de maiúsculas espaçadas como rótulo.

## Layout

Coluna única centrada de até 560px, margem lateral de 16px e folga inferior para o botão + (a coluna do extrato tem folga extra). Barra do topo fixa, ícones de 44px, transparente no início e vidro depois de rolar.

A partir de 900px, conteúdo até 1040px em duas colunas: resumo de 360px fixo à esquerda (casal, frase, stats, hoje, avisos, barras, atalhos) e extrato à direita.

Ordem da home: casal e última ação da outra pessoa; frase; stats; "Conferir com o banco"; Hoje (atrasadas recolhidas com valor, cabeçalho do dia, lista de hoje); até 2 avisos; barras do saldo; atalhos; filtros e o resto do mês. Ritmo de 16–22px entre blocos e 8–14px dentro. Atalhos em grade de 3 colunas com 8px de vão; a última linha incompleta estica.

## Elevation & Depth

Chapado. A profundidade vem do fio de 1px e do tom entre fundo e superfície. Sombra só no que flutua: a folha de baixo para cima, o botão + e o segmento ativo dos seletores. Uma luz difusa por paleta no alto do app (`--luz1`, `--luz2`; o Ninho não tem).

### Shadow Vocabulary
- **Segmento** (`0 1px 2px rgba(60,45,20,.05), 0 10px 28px -16px rgba(60,45,20,.18)` no claro; contorno de 1px a 6% no escuro): segmento ativo de seletor.
- **Folha** (`0 -10px 40px rgba(60,45,20,.16)` no claro; `0 -12px 48px rgba(0,0,0,.55)` no escuro): painel de baixo para cima.
- **Botão +**: sombra na cor de ação da paleta (Rosa e Noite com tom próprio).

### Named Rules
**A Regra do Fio.** Toda superfície em repouso se separa do fundo por 1px de `linha`. Sombra só quando algo flutua de verdade.

## Shapes

Raio base de 14px (listas, avisos, botões, cartão de barras, atalhos). Campos 12px, chips 10px, etiquetas 6px, caixinhas 16px, botão + 18px (quadrado arredondado), painel 24px nos cantos de cima. Círculos só para pessoa e estado: iniciais, check, bolinhas de selo, ícones do topo. Selos e chips de categoria em pílula.

## Components

### Buttons
- **Shape:** 14px, altura mínima de 50px.
- **Primary:** fundo `acao`, texto `sobre-acao`, 600.
- **Focus / Active:** contorno de 2px na cor de ação a 2px de distância; ao tocar, escala .97 em .14s com `cubic-bezier(.23, 1, .32, 1)`. Desativado a 55%.
- **Secondary:** transparente com fio de 1px.
- **Texto:** sem fundo, `acao-texto`, 44px de altura; a variante de perigo usa `negativo`.
- **Botão +:** 60px, raio 18px, `acao` com sombra da própria cor, canto inferior direito; some ao rolar para baixo.

### Chips
- **Style:** filtros com fundo de superfície, fio de 1px, raio 10px, 44px, texto suave 600.
- **State:** ativo com véu de ação, texto e borda de ação.

### Selo de status
Pílula de 26px com fio, bolinha de 7px com halo. "ao vivo" quando a outra pessoa está com o app aberto.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** `superficie` sobre `fundo`.
- **Shadow Strategy:** nenhuma em repouso.
- **Border:** 1px `linha`.
- **Internal Padding:** 14px.

### Inputs / Fields
- **Style:** fundo `campo`, fio de 1px, raio 12px, 13 × 14px, texto 16px; rótulo acima em 13px tinta suave.
- **Focus:** borda na cor de ação e anel de 3px no véu de ação, em .15s.
- **Valor:** campo grande a 30px, com calculadora.
- **"Já foi pago":** vem marcado só quando a data é hoje ou passada.

### Navigation
Topo fixo: seta de mês, título do mês (650, 16.5px), pílula "Hoje" fora do mês atual, busca e ajustes em 44px. Meses também trocam por gesto lateral.

### Item de lançamento
Linha de 60px com fio entre itens. À esquerda, o círculo do check de 26px (borda `check-borda`; cheio em `acao` quando pago) com o avatar de quem lançou (foto ou inicial, 18px) no canto. Descrição em uma linha; abaixo, em texto pequeno, categoria e "fixa"/parcela, e etiquetas só para o que é de outro tipo (guardar, aguardando internet). À direita, o valor com sinal (+ em `verde` para entrada) ou "a definir", e o "depois R$ X" no último item sem check de cada dia. Itens pagos de dias passados ficam riscados e em tinta suave, a pedido do usuário.

### Cabeçalho do dia
Número do dia grande e dia da semana ao lado; Hoje em `acao-texto` com o link "Check em tudo de hoje".

### Atrasadas
Linha recolhida neutra "N atrasadas · ver" com "R$ X a pagar e R$ Y a receber, desde mês/aa" embaixo. Aberta, agrupa por dia com o mês.

### Barras do saldo dia a dia (assinatura)
Cartão com uma coluna fina por dia (86px). Positivas na cor de ação, negativas em `negativo` abaixo de uma linha tracejada do zero. Passado esmaecido, hoje aceso com o ovo âmbar acima. Tocar mostra o saldo do dia. A explicação "Cada barra é…" some depois do primeiro toque.

### Avisos
Linha inteira com ícone, frase e seta; no máximo 2 visíveis e "Mais N avisos". O de negativo diz os trechos de dias seguidos e o mesmo pior dia da frase.

### Painéis
Folhas de baixo para cima até 92% da altura, raio 24px em cima, alça, entrada em .32s e arrasto para fechar.

### Insight da Visão do ano
Bloco com faixa de 3px à esquerda no tom (bom em verde, atenção em âmbar, ruim em vermelho só para o que é negativo de fato; sem tom quando é convite).

## Do's and Don'ts

### Do:
- **Do** abrir cada tela com uma frase que diz o número, em Manrope 750 (clamp 31–40px), com o número em `acao-texto`.
- **Do** usar só os papéis comuns (`--fundo`, `--acao`, `--acao-texto`, `--guardado`, `--guardado-texto`, `--negativo`) ao pintar algo novo, para valer nas três paletas.
- **Do** definir cor nova nos blocos de claro, escuro por preferência, `[data-theme="dark"]` e nas paletas Rosa e Noite, e testar as cinco combinações.
- **Do** manter alvos de toque de 44px ou mais e campos com texto a 16px.
- **Do** usar a curva `cubic-bezier(.23, 1, .32, 1)` entre .14s e .32s e respeitar `prefers-reduced-motion`.
- **Do** manter o riscado nos itens pagos de dias passados.
- **Do** dizer o negativo uma vez na frase e uma vez no aviso, no mesmo pior dia.

### Don't:
- **Don't** usar âmbar fora do guardado e do hoje, nem em zero guardado.
- **Don't** usar vermelho para atraso, limite ou meta; vermelho é negativo.
- **Don't** pintar blocos ou gráficos com as cores das pessoas.
- **Don't** voltar ao mundo antigo do portfólio: ciano neon, grade, brilho no topo, JetBrains Mono, rótulos em maiúsculas espaçadas.
- **Don't** pôr sombra em cartão em repouso.
- **Don't** usar cor da marca no `background_color` do manifesto (pinta a barra de navegação do Android); manter #faf6ee.
- **Don't** trocar a fonte auto-hospedada por CDN.
