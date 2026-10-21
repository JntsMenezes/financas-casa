-- Finanças da casa: estrutura do banco.
-- Rodar uma vez no SQL Editor do projeto Supabase novo.

create table public.casas (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  codigo    text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  criado_em timestamptz not null default now()
);

create table public.membros (
  casa_id   uuid not null references public.casas(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (casa_id, user_id)
);
create index membros_user_idx on public.membros(user_id);

create table public.lancamentos (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid not null references public.casas(id) on delete cascade,
  data          date not null,
  descricao     text not null check (char_length(descricao) between 1 and 120),
  tipo          text not null check (tipo in ('receita', 'despesa')),
  valor         numeric(12,2) not null check (valor >= 0),
  pago          boolean not null default false,
  recorrente    boolean not null default false,
  parcela       int,
  parcelas      int,
  grupo         uuid,  -- liga os lançamentos de uma mesma série (recorrente ou parcelado)
  criado_por    uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check ((parcela is null and parcelas is null) or (parcelas >= 1 and parcela between 1 and parcelas))
);
create index lancamentos_casa_data_idx on public.lancamentos(casa_id, data);
create index lancamentos_grupo_idx on public.lancamentos(grupo) where grupo is not null;

create function public.tocar_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger lancamentos_atualizado_em before update on public.lancamentos
  for each row execute function public.tocar_atualizado_em();

-- Acesso: só quem é membro da casa enxerga e mexe nos dados dela.
create function public.sou_membro(p_casa uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m where m.casa_id = p_casa and m.user_id = auth.uid());
$$;

alter table public.casas       enable row level security;
alter table public.membros     enable row level security;
alter table public.lancamentos enable row level security;

create policy casas_ver on public.casas for select to authenticated
  using (public.sou_membro(id));

create policy membros_ver on public.membros for select to authenticated
  using (public.sou_membro(casa_id));

create policy lancamentos_ver on public.lancamentos for select to authenticated
  using (public.sou_membro(casa_id));
create policy lancamentos_criar on public.lancamentos for insert to authenticated
  with check (public.sou_membro(casa_id));
create policy lancamentos_alterar on public.lancamentos for update to authenticated
  using (public.sou_membro(casa_id)) with check (public.sou_membro(casa_id));
create policy lancamentos_apagar on public.lancamentos for delete to authenticated
  using (public.sou_membro(casa_id));

-- Entrar numa casa pelo código. No máximo 2 pessoas por casa.
create function public.entrar_na_casa(p_codigo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_casa uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro';
  end if;

  select id into v_casa from public.casas where codigo = upper(trim(p_codigo));
  if v_casa is null then
    raise exception 'Código não encontrado';
  end if;

  if exists (select 1 from public.membros where casa_id = v_casa and user_id = auth.uid()) then
    return v_casa;
  end if;

  if (select count(*) from public.membros where casa_id = v_casa) >= 2 then
    raise exception 'Essa casa já tem 2 pessoas';
  end if;

  insert into public.membros (casa_id, user_id) values (v_casa, auth.uid());
  return v_casa;
end $$;

revoke execute on function public.entrar_na_casa(text) from public, anon;
grant execute on function public.entrar_na_casa(text) to authenticated;
revoke execute on function public.sou_membro(uuid) from public, anon;
grant execute on function public.sou_membro(uuid) to authenticated;

-- Atualização em tempo real entre os dois celulares.
alter publication supabase_realtime add table public.lancamentos;
