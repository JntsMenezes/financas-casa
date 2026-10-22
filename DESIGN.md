---
name: Finanças da Casa
description: PWA de finanças a dois, calmo, em tema escuro ou claro, que lê o mês em uma frase com o número em ciano.
colors:
  fundo: "#f3f7f9"
  superficie: "#ffffff"
  campo: "#ffffff"
  tinta: "#0d1823"
  tinta-suave: "#566373"
  linha: "#dde5eb"
  check-borda: "#b3c0cb"
  primaria: "#0a6b87"
  primaria-fundo: "#ddf0f6"
  sobre-primaria: "#ffffff"
  verde: "#0f766e"
  verde-fundo: "#ddf3ef"
  vermelho: "#c62828"
  vermelho-fundo: "#fcebeb"
  aviso-ruim-texto: "#8f1d1d"
  ambar: "#995a00"
  ambar-fundo: "#fcf0da"
  aviso-atencao-texto: "#6b3e00"
  pessoa-1: "#0a6b87"
  pessoa-2: "#a3367a"
  vidro: "rgba(243, 247, 249, .78)"
  grade: "rgba(10, 107, 135, .07)"
  brilho: "rgba(10, 107, 135, .12)"
  fundo-escuro: "#0a0b0f"
  superficie-escuro: "#101319"
  campo-escuro: "#0e1015"
  tinta-escuro: "#e6e8ee"
  tinta-suave-escuro: "#8a91a3"
  linha-escuro: "rgba(255,255,255,.08)"
  check-borda-escuro: "rgba(255,255,255,.24)"
  primaria-escuro: "oklch(.82 .14 210)"
  primaria-fundo-escuro: "oklch(.82 .14 210 / .13)"
  sobre-primaria-escuro: "#06121b"
  verde-escuro: "#5eead4"
  verde-fundo-escuro: "rgba(94,234,212,.1)"
  vermelho-escuro: "#f87171"
  vermelho-fundo-escuro: "rgba(248,113,113,.1)"
  aviso-ruim-texto-escuro: "#fca5a5"
  ambar-escuro: "#fbbf24"
  ambar-fundo-escuro: "rgba(251,191,36,.1)"
  aviso-atencao-texto-escuro: "#fcd34d"
  pessoa-1-escuro: "oklch(.82 .14 210)"
  pessoa-2-escuro: "oklch(.8 .12 330)"
  vidro-escuro: "rgba(10, 11, 15, .72)"
  grade-escuro: "rgba(255,255,255,.04)"
  brilho-escuro: "oklch(.82 .14 210 / .16)"
typography:
  display:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(31px, 9vw, 40px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-.035em"
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
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "-.03em"
    fontFeature: "tnum"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: ".08em"
    fontFeature: "tnum"
rounded:
  tag: "6px"
  selo: "7px"
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
    backgroundColor: "{colors.primaria}"
    textColor: "{colors.sobre-primaria}"
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
    textColor: "{colors.primaria}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.sobre-primaria}"
    rounded: "{rounded.raio}"
    height: "50px"
  chip:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.chip}"
    padding: "0 14px"
    height: "40px"
  chip-active:
    backgroundColor: "{colors.primaria-fundo}"
    textColor: "{colors.primaria}"
    rounded: "{rounded.chip}"
    height: "40px"
  input:
    backgroundColor: "{colors.campo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.campo}"
    padding: "13px 14px"
  selo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta-suave}"
    typography: "{typography.label}"
    rounded: "{rounded.selo}"
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
  fab:
    backgroundColor: "{colors.primaria}"
    textColor: "{colors.sobre-primaria}"
    rounded: "{rounded.fab}"
    size: "60px"
  painel:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.painel}"
    padding: "8px 18px 18px"
  aviso-ruim:
    backgroundColor: "{colors.vermelho-fundo}"
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

O app é um painel noturno de leitura do mês. A tela abre com uma frase grande em Manrope 800, de letras juntas, e o número que importa vem aceso em ciano. Tudo em volta é instrumento: rótulos curtos em JetBrains Mono maiúsculo, valores em mono tabular, superfícies finas de 1px, uma grade quase invisível com um brilho ciano só no alto da tela. O mundo visual é o mesmo do portfólio pessoal do dono do projeto, traduzido para um app de uso diário no celular.

A densidade é de app de bolso: uma coluna de até 560px, alvos de toque de 44px ou mais, e listas compactas de 60px por linha. Em tela larga (900px ou mais) vira duas colunas, com o resumo fixo à esquerda e o extrato à direita. Há dois temas com o mesmo peso: escuro (#0a0b0f) e claro (#f3f7f9). O tema segue o sistema por padrão e pode ser fixado nos ajustes.

A calma vem da contenção. O ciano marca o que entra, o que é positivo e onde agir; vermelho e âmbar só aparecem quando pedem ação. As duas pessoas da casa têm cada uma a sua cor, usada em pontos pequenos (iniciais, bolinha de quem lançou), nunca em blocos.

**Key Characteristics:**
- Frase de leitura em Manrope 800 como peça principal, com o número em ciano.
- Rótulos e valores em JetBrains Mono, com números tabulares.
- Superfícies chapadas com borda de 1px e raio de 14px; profundidade quase nula.
- Grade fina e brilho ciano só no topo, sumindo por máscara.
- Selos com bolinha de status ("ao vivo", "sem internet").
- Dois temas equivalentes, escuro e claro, nos mesmos tokens.

## Colors

Fundo quase preto (ou névoa fria no claro), tinta fria, um único acento ciano e três cores de estado usadas com parcimônia.

### Primary
- **Ciano de Sinal** (`primaria`, oklch .82 .14 210 no escuro; azul-petróleo profundo no claro): o número-chave da frase, botão principal, botão +, chip ativo, foco, cursor dos campos, barras positivas do saldo previsto e a divisória de "Hoje". No claro ele escurece para manter contraste de texto sobre fundo branco.
- **Véu Ciano** (`primaria-fundo`): fundo de chip ativo, seleção de texto e anel de foco dos campos (3px).

### Secondary
- **Menta** (`verde`): o que já foi pago ou recebido (bola do check), dinheiro guardado nas caixinhas, valores de entrada na lista, bolinha do selo "ao vivo". Fundo correspondente (`verde-fundo`) em etiquetas "guardar" e ícones de caixinha.

### Tertiary
- **Vermelho Crítico** (`vermelho`): saldo previsto negativo (barras e número da frase), aviso que exige ação, botão de apagar. Com fundo próprio (`vermelho-fundo`) e texto escuro dedicado (`aviso-ruim-texto`).
- **Âmbar de Atenção** (`ambar`): lançamentos que passaram da data sem check, limite de categoria perto de estourar, selo "sem internet". Com `ambar-fundo` e `aviso-atencao-texto`.

### Pessoas da casa
- **Pessoa 1** (`pessoa-1`): igual ao ciano principal.
- **Pessoa 2** (`pessoa-2`): magenta suave (oklch .8 .12 330 no escuro).
Usadas só nas iniciais do casal, na bolinha de "lançou por último" e na etiqueta de autor de cada item.

### Neutral
- **Noite** (`fundo-escuro`) / **Névoa Fria** (`fundo`): fundo da página.
- **Placa** (`superficie`): listas, cartões de barras, chips, painéis de baixo para cima.
- **Tinta** (`tinta`) e **Tinta Suave** (`tinta-suave`): texto principal e texto de apoio, rótulos, datas, segunda linha da frase.
- **Fio** (`linha`): todas as bordas de 1px, divisórias entre itens, trilho das barras.
- **Vidro** (`vidro`): barra do topo depois de rolar, com desfoque de 14px.
- **Grade** e **Brilho** (`grade`, `brilho`): exclusivos do fundo do topo da home.

### Named Rules
**A Regra do Sinal Único.** O ciano é o único acento. Ele marca número-chave, ação e positivo; não vira fundo de bloco, nem decoração.

**A Regra do Alarme com Motivo.** Vermelho e âmbar só aparecem quando há algo a fazer (saldo negativo, atraso, limite). Um estado normal nunca usa cor de estado.

**A Regra das Duas Cores Pequenas.** As cores das pessoas aparecem só em pontos de até 30px (iniciais, bolinhas, etiquetas), nunca em fundos de seção ou gráficos.

## Typography

**Display Font:** Manrope (variável 200–800, auto-hospedada em `fonts/`), com system-ui de reserva
**Body Font:** Manrope
**Label/Mono Font:** JetBrains Mono (variável 100–800, auto-hospedada), com ui-monospace de reserva

**Character:** Manrope apertada e pesada fala a frase como manchete; JetBrains Mono dá o tom de instrumento a rótulos, datas e valores. A dupla é a mesma do portfólio.

### Hierarchy
- **Display** (800, clamp 31–40px, 38px em tela larga, entrelinha 1.08, -.035em, `text-wrap: balance`): a frase do mês na home. A segunda linha vem em tinta suave, com o número em tinta normal.
- **Headline** (650, 34px, entrelinha 1.02): total das caixinhas.
- **Title** (650, 20px, -.02em): título dos painéis. O título do mês no topo usa 650 a 16.5px.
- **Body** (400, 16px, entrelinha 1.45): texto corrido e campos (16px também evita zoom no iOS).
- **Apoio** (400, 15.5px, entrelinha 1.5, até 46ch): linha abaixo da frase; números nela vão em negrito 700 na cor de tinta.
- **Item** (500, 15.5px): descrição de cada lançamento, até 2 linhas.
- **Valor** (JetBrains Mono 500, 14px, -.03em, tabular): valores da lista, rótulos da fita (14px), saldo após cada item (11.5px).
- **Label** (JetBrains Mono, 10.5–11.5px, .06–.08em, MAIÚSCULAS): rótulos de dados da fita ("Entra", "Gastos", "Guardado"), cabeçalho do gráfico de barras, cabeçalho de cada dia, selos.

### Named Rules
**A Regra do Número em Mono.** Todo valor em reais que fica sozinho (lista, fita, saldo por item, eixos) vai em JetBrains Mono tabular. Dentro de uma frase corrida, o número fica em Manrope com `tabular-nums`.

**A Regra do Rótulo Colado ao Dado.** O mono maiúsculo nomeia um dado, um gráfico ou um dia. Ele não sobe acima de títulos como chamada decorativa.

## Layout

Coluna única centrada de até 560px, com margem lateral de 16px e folga inferior de 110px mais a área segura, para o botão + não cobrir o último item. A barra do topo é fixa, em grade de 44px por ícone, transparente no início e virando vidro com borda de 1px depois de rolar.

A partir de 900px, o conteúdo vai a 1040px com margens de 32px e vira duas colunas: resumo de 360px (fixo a 72px do topo) e extrato no resto, com 40px de vão. Os painéis deixam de ser folhas de baixo e viram cartões flutuantes a 24px do fundo.

O ritmo vertical da home é de 18–22px entre blocos (casal, frase, fita, barras, avisos), 8–14px dentro deles. Filtros e categorias rolam na horizontal, sangrando até a borda da tela. Os atalhos ("Para onde foi", "Caixinhas", "Como estamos") ficam em grade de 3 colunas com 8px de vão.

O fundo do topo da home é uma camada de 620px de altura e largura total: grade de 44px em linhas de 1px mais um brilho radial ciano em 30% / 18%, apagado por máscara a partir de 35% da altura.

## Elevation & Depth

O sistema é chapado. A profundidade vem de borda de 1px (`linha`) e de tons entre fundo e superfície, não de sombra. No escuro, a sombra de base é só um contorno de 1px em branco a 6%. Sombras reais existem em três lugares com função: a folha de baixo para cima (separa o painel do conteúdo), o botão + (brilho da própria cor, herdado do botão principal do portfólio) e o segmento ativo dos seletores no tema claro.

### Shadow Vocabulary
- **Contorno** (`box-shadow: 0 0 0 1px rgba(255,255,255,.06)` no escuro; `0 1px 2px rgba(13,24,35,.04), 0 10px 28px -16px rgba(13,24,35,.16)` no claro): segmento ativo de seletor.
- **Folha** (`box-shadow: 0 -12px 48px rgba(0,0,0,.6)` no escuro; `0 -10px 40px rgba(13,24,35,.16)` no claro): painel de baixo para cima.
- **Brilho do +** (`box-shadow: 0 10px 30px -8px var(--primaria), 0 2px 6px rgba(0,0,0,.18)`): só o botão de adicionar.

### Named Rules
**A Regra do Fio.** Toda superfície em repouso se separa do fundo por 1px de `linha`. Sombra só quando algo flutua de verdade (painel, botão +).

**A Regra do Brilho no Topo.** Grade e brilho ciano vivem só no fundo do topo da home e somem por máscara. Não se repetem em cartões nem em painéis.

## Shapes

Cantos suaves e consistentes. O raio base é 14px (listas, avisos, botões, cartão de barras, linhas de atalho). Campos usam 12px, chips de filtro 10px, selos 7px, etiquetas 6px. Os cartões de caixinha usam 16px, o botão + 18px (um quadrado arredondado, não círculo) e o painel 24px nos cantos de cima. Formas circulares ficam para o que é pessoa ou estado: iniciais, bola do check, bolinhas de status, botões de ícone do topo. Chips de categoria usam pílula (999px). As barras do saldo previsto têm no máximo 2px de raio.

## Components

### Buttons
Diretos e firmes, sempre na largura toda dentro de painéis.
- **Shape:** raio de 14px, altura mínima de 50px.
- **Primary:** fundo ciano, texto `sobre-primaria`, peso 600.
- **Hover / Focus / Active:** foco com contorno de 2px ciano a 2px de distância; ao tocar, escala .97 em .14s com a curva de saída (`cubic-bezier(.23, 1, .32, 1)`). Desativado a 55% de opacidade.
- **Secondary:** transparente com borda de 1px `linha`, texto em tinta.
- **Texto:** sem fundo, texto ciano, 44px de altura. A variante de perigo troca o ciano por vermelho.
- **Botão +:** 60px, raio 18px, ciano com o brilho da própria cor, fixo no canto inferior direito da coluna; escala .92 ao tocar.

### Chips
- **Style:** filtros com fundo de superfície, borda de 1px, raio 10px, 40px de altura, texto suave 600.
- **State:** ativo ganha véu ciano, texto ciano e borda ciano. Chips de categoria nos painéis são pílulas sem fundo; ativos ganham véu ciano sem borda.

### Selo de status
Pequena placa mono de 26px, raio 7px, borda de 1px, com bolinha de 7px à esquerda cercada por halo de 3px. Menta para "ao vivo", âmbar para "sem internet". Também marca o dia de hoje no cabeçalho do gráfico.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** `superficie` sobre `fundo`.
- **Shadow Strategy:** nenhuma; ver A Regra do Fio.
- **Border:** 1px `linha`.
- **Internal Padding:** 14px (cartão de barras), itens de lista com 6px à esquerda para a área do check.

### Inputs / Fields
- **Style:** fundo `campo`, borda de 1px `linha`, raio 12px, 13px × 14px de respiro, texto a 16px. Rótulo acima em 13px, tinta suave, peso 500.
- **Focus:** borda vira ciano e ganha anel de 3px em véu ciano, em .15s.
- **Error:** mensagem em vermelho a 14px abaixo do campo.
- **Valor grande:** campo do valor no lançamento a 30px, peso 650.

### Navigation
Barra do topo fixa com seta de mês, título do mês (650, 16.5px), atalho "Hoje" em pílula de véu ciano e ícones de busca e ajustes em círculos de 44px. Os meses também trocam por gesto lateral. Transparente no topo, vidro desfocado com fio inferior depois de rolar.

### Item de lançamento
Linha de 60px dentro de uma lista com fio entre itens: bola de check de 26px (borda `check-borda`; menta cheia quando pago; borda âmbar quando atrasado; pulso de .32s ao marcar), ícone de categoria em quadrado de 34px com raio 11px, descrição em até 2 linhas, etiquetas pequenas (parcela, fixa, guardar, atrasado, autor com bolinha da pessoa) e, à direita, valor em mono com sinal (+ em menta para entrada). Itens pagos de dias passados ficam riscados e em tinta suave, a pedido do usuário.

### Fita do mês
Trilho de 10px com raio 5px mostrando o que entra como comprimento total: gastos em tinta suave, guardado em menta, e o que passou do que entra em vermelho na ponta direita. Abaixo, três rótulos mono maiúsculos com o valor em mono de 14px.

### Barras do saldo previsto (assinatura)
Cartão com uma coluna fina por dia do mês (86px de altura). Positivas em ciano, negativas em vermelho abaixo da linha do zero. Dias passados a 32% de opacidade, futuros a 70%, hoje aceso a 100% com um ponto ciano de 3px acima. Eixo de datas em mono de 10.5px e uma frase embaixo dizendo o ponto mais baixo com o valor.

### Avisos
Botões de linha inteira com ícone, frase e seta. Neutro: superfície com fio. Crítico: fundo vermelho translúcido, texto `aviso-ruim-texto`, sem borda. Atenção: o mesmo em âmbar. Informativo: neutro com ícone ciano. Escala .98 ao tocar.

### Painéis
Folhas de baixo para cima até 92% da altura, raio 24px em cima, alça de 40px × 5px, entrada em .32s com a curva de saída e arrasto para fechar. Fundo escurecido atrás.

### Insight da visão do ano
Bloco com faixa de 3px à esquerda na cor do estado (menta, âmbar, vermelho ou ciano), fundo `fundo`, raio 4px à esquerda e 14px à direita. Primeira frase em tinta, segunda em tinta suave.

## Do's and Don'ts

### Do:
- **Do** abrir cada tela com uma frase que diz o número, em Manrope 800 (clamp 31–40px), com o número-chave em ciano.
- **Do** separar superfícies com 1px de `linha` e raio de 14px.
- **Do** escrever valores soltos em JetBrains Mono tabular, e rótulos de dados em mono maiúsculo de 10.5–11.5px com .06–.08em.
- **Do** definir toda cor nova como token nos três blocos (`:root`, escuro por preferência do sistema e `[data-theme="dark"]`) e testar os dois temas.
- **Do** manter alvos de toque com 44px ou mais e campos com texto a 16px.
- **Do** usar a curva de saída `cubic-bezier(.23, 1, .32, 1)` entre .14s e .32s e respeitar `prefers-reduced-motion`.
- **Do** manter o riscado nos itens pagos de dias passados.

### Don't:
- **Don't** usar o ciano como fundo de seção ou de cartão inteiro; ele marca número e ação.
- **Don't** usar vermelho ou âmbar em estado normal; cor de estado só quando há algo a fazer.
- **Don't** pintar blocos ou gráficos com as cores das pessoas; elas ficam em pontos pequenos.
- **Don't** repetir a grade e o brilho fora do topo da home.
- **Don't** pôr sombra em cartão em repouso; sombra só no painel e no botão +.
- **Don't** usar o rótulo mono maiúsculo como chamada decorativa acima de títulos.
- **Don't** trocar as fontes auto-hospedadas por fontes de CDN.
