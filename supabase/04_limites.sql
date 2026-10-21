-- Limite mensal de gasto por categoria.
-- Rodar uma vez no SQL Editor, depois do 03_categorias_series.sql.

create table public.limites (
  casa_id       uuid not null references public.casas(id) on delete cascade,
  categoria     text not null check (char_length(categoria) between 1 and 30),
  valor         numeric(12,2) not null check (valor > 0),
  atualizado_em timestamptz not null default now(),
  primary key (casa_id, categoria)
);

alter table public.limites enable row level security;

create policy limites_ver on public.limites for select to authenticated using (public.sou_membro(casa_id));
create policy limites_criar on public.limites for insert to authenticated with check (public.sou_membro(casa_id));
create policy limites_alterar on public.limites for update to authenticated
  using (public.sou_membro(casa_id)) with check (public.sou_membro(casa_id));
create policy limites_apagar on public.limites for delete to authenticated using (public.sou_membro(casa_id));
