-- Planejamento (24/10/2026).
-- planejamento: o gasto do dia a dia que a projeção desconta todo mês (não vira lançamento).
-- descontos_folha: empréstimos e outros descontos que saem do salário antes de cair na conta.
-- Quando um acaba, o salário sobe esse valor; a projeção soma a partir do mês seguinte.

create table public.planejamento (
  casa_id       uuid primary key references public.casas(id) on delete cascade,
  dia_a_dia     numeric(12,2) check (dia_a_dia >= 0),
  atualizado_em timestamptz not null default now()
);

alter table public.planejamento enable row level security;

create policy planejamento_ver on public.planejamento for select to authenticated using (public.sou_membro(casa_id));
create policy planejamento_criar on public.planejamento for insert to authenticated with check (public.sou_membro(casa_id));
create policy planejamento_alterar on public.planejamento for update to authenticated
  using (public.sou_membro(casa_id)) with check (public.sou_membro(casa_id));

create table public.descontos_folha (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid not null references public.casas(id) on delete cascade,
  descricao     text not null check (char_length(descricao) between 1 and 60),
  valor         numeric(12,2) not null check (valor > 0),
  ate           date not null, -- mês do último desconto (dia 1)
  criado_em     timestamptz not null default now()
);
create index descontos_folha_casa on public.descontos_folha (casa_id);

alter table public.descontos_folha enable row level security;

create policy descontos_ver on public.descontos_folha for select to authenticated using (public.sou_membro(casa_id));
create policy descontos_criar on public.descontos_folha for insert to authenticated with check (public.sou_membro(casa_id));
create policy descontos_alterar on public.descontos_folha for update to authenticated
  using (public.sou_membro(casa_id)) with check (public.sou_membro(casa_id));
create policy descontos_apagar on public.descontos_folha for delete to authenticated using (public.sou_membro(casa_id));
