-- Quem lançou e histórico de alterações.
-- Rodar uma vez no SQL Editor, depois do schema.sql.

-- Nome e e-mail de cada pessoa da casa, para mostrar no app.
alter table public.membros add column if not exists nome text check (char_length(nome) between 1 and 40);
alter table public.membros add column if not exists email text;

update public.membros m set email = u.email
from auth.users u
where u.id = m.user_id and m.email is null;

create or replace function public.entrar_na_casa(p_codigo text) returns uuid
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

  insert into public.membros (casa_id, user_id, email) values (v_casa, auth.uid(), auth.jwt() ->> 'email');
  return v_casa;
end $$;

-- Cada um só muda o próprio nome.
create or replace function public.definir_meu_nome(p_nome text) returns void
language sql security definer set search_path = '' as $$
  update public.membros set nome = nullif(trim(p_nome), '') where user_id = auth.uid();
$$;

revoke execute on function public.definir_meu_nome(text) from public, anon;
grant execute on function public.definir_meu_nome(text) to authenticated;

-- Histórico: o banco grava sozinho cada criação, alteração e exclusão.
create table public.historico (
  id            bigint generated always as identity primary key,
  casa_id       uuid not null references public.casas(id) on delete cascade,
  lancamento_id uuid not null,  -- sem chave estrangeira para continuar existindo depois de apagado
  acao          text not null check (acao in ('criou', 'alterou', 'apagou')),
  user_id       uuid references auth.users(id) on delete set null,
  quando        timestamptz not null default now(),
  antes         jsonb,
  depois        jsonb
);
create index historico_casa_quando_idx on public.historico(casa_id, quando desc);
create index historico_lancamento_idx on public.historico(lancamento_id, quando desc);

alter table public.historico enable row level security;

-- Só leitura pelo app; ninguém edita nem apaga o histórico.
create policy historico_ver on public.historico for select to authenticated
  using (public.sou_membro(casa_id));

create function public.registrar_historico() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.historico (casa_id, lancamento_id, acao, user_id, depois)
    values (new.casa_id, new.id, 'criou', auth.uid(), to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    if (to_jsonb(new) - 'atualizado_em') is distinct from (to_jsonb(old) - 'atualizado_em') then
      insert into public.historico (casa_id, lancamento_id, acao, user_id, antes, depois)
      values (new.casa_id, new.id, 'alterou', auth.uid(), to_jsonb(old), to_jsonb(new));
    end if;
  else
    if exists (select 1 from public.casas where id = old.casa_id) then
      insert into public.historico (casa_id, lancamento_id, acao, user_id, antes)
      values (old.casa_id, old.id, 'apagou', auth.uid(), to_jsonb(old));
    end if;
  end if;
  return null;
end $$;

revoke execute on function public.registrar_historico() from public, anon, authenticated;

create trigger lancamentos_historico
  after insert or update or delete on public.lancamentos
  for each row execute function public.registrar_historico();
