-- Celulares que aceitaram receber lembretes de contas.
-- O agendamento diário (pg_cron) é criado à parte, porque leva o segredo da função.

create table public.push_inscricoes (
  endpoint  text primary key,
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  casa_id   uuid not null references public.casas(id) on delete cascade,
  p256dh    text not null,
  auth      text not null,
  criado_em timestamptz not null default now()
);
create index push_inscricoes_casa_idx on public.push_inscricoes(casa_id);

alter table public.push_inscricoes enable row level security;

-- Cada pessoa só vê e mexe nas inscrições do próprio celular.
create policy push_ver on public.push_inscricoes for select to authenticated
  using (user_id = auth.uid());
create policy push_criar on public.push_inscricoes for insert to authenticated
  with check (user_id = auth.uid() and public.sou_membro(casa_id));
create policy push_alterar on public.push_inscricoes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.sou_membro(casa_id));
create policy push_apagar on public.push_inscricoes for delete to authenticated
  using (user_id = auth.uid());
