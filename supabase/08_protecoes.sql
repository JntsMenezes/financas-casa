-- Proteções vindas da revisão do banco (22/10/2026).

-- 1. No máximo 2 pessoas por casa, mesmo com duas entradas ao mesmo tempo.
create function public.limitar_membros() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.casas where id = new.casa_id for update;
  if (select count(*) from public.membros where casa_id = new.casa_id) >= 2 then
    raise exception 'Essa casa já tem 2 pessoas';
  end if;
  return new;
end $$;
revoke execute on function public.limitar_membros() from public, anon, authenticated;
create trigger membros_limite before insert on public.membros
  for each row execute function public.limitar_membros();

-- 2. Código errado conta tentativa: 5 por hora por pessoa. Errar devolve null
--    (sem exceção, para a tentativa não sumir no rollback); o app mostra "Código não encontrado".
create table public.tentativas_codigo (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  quando  timestamptz not null default now()
);
create index tentativas_codigo_idx on public.tentativas_codigo(user_id, quando desc);
alter table public.tentativas_codigo enable row level security;  -- sem policy: só a função escreve

create or replace function public.entrar_na_casa(p_codigo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_casa uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro';
  end if;
  if (select count(*) from public.tentativas_codigo
       where user_id = auth.uid() and quando > now() - interval '1 hour') >= 5 then
    raise exception 'Muitas tentativas. Tente de novo daqui a uma hora';
  end if;

  select id into v_casa from public.casas where codigo = upper(trim(p_codigo));
  if v_casa is null then
    insert into public.tentativas_codigo (user_id) values (auth.uid());
    return null;
  end if;

  if exists (select 1 from public.membros where casa_id = v_casa and user_id = auth.uid()) then
    return v_casa;
  end if;

  insert into public.membros (casa_id, user_id, email) values (v_casa, auth.uid(), auth.jwt() ->> 'email');
  return v_casa;  -- o gatilho membros_limite barra a 3ª pessoa
end $$;

-- 3. Contas sem fim só leem e criam lançamentos da própria casa.
create or replace function public.manter_series(p_casa uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  s       record;
  u       public.lancamentos;
  v_data  date;
  v_desde date;
  v_lim   date;
  v_ult   date;
  k       int;
  n       int := 0;
begin
  if not public.sou_membro(p_casa) then
    raise exception 'Sem acesso a esta casa';
  end if;
  perform pg_advisory_xact_lock(hashtext('series:' || p_casa::text));

  for s in select * from public.series where casa_id = p_casa and sem_fim loop
    select * into u from public.lancamentos
      where grupo = s.grupo and casa_id = p_casa
      order by data desc, criado_em desc limit 1;
    continue when u.id is null;

    v_lim   := case when s.passo = 'semana' then current_date + interval '6 months' else current_date + interval '12 months' end;
    v_desde := greatest(coalesce(s.gerado_ate, u.data), u.data);
    v_ult   := null;
    k := 1;
    loop
      v_data := case when s.passo = 'semana' then u.data + 7 * k else (u.data + make_interval(months => k))::date end;
      exit when v_data > v_lim or k > 400;
      if v_data > v_desde then
        insert into public.lancamentos (casa_id, data, descricao, tipo, valor, pago, recorrente, grupo, categoria, caixinha_id, criado_por)
        values (p_casa, v_data, u.descricao, u.tipo, u.valor, false, true, u.grupo, u.categoria, u.caixinha_id, auth.uid());
        n := n + 1;
        v_ult := v_data;
      end if;
      k := k + 1;
    end loop;

    if v_ult is not null then
      update public.series set gerado_ate = v_ult where grupo = s.grupo and casa_id = p_casa;
    end if;
  end loop;

  return n;
end $$;
revoke execute on function public.manter_series(uuid) from public, anon;
grant execute on function public.manter_series(uuid) to authenticated;

-- 4. Lançamento não muda de casa; autor e data de criação não são editáveis.
--    No insert, o autor precisa ser alguém da casa (restaurar um apagado mantém o autor original).
create function public.proteger_lancamento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and (new.criado_por is null or not exists (
         select 1 from public.membros where casa_id = new.casa_id and user_id = new.criado_por)) then
      new.criado_por := auth.uid();
    end if;
  else
    if new.casa_id is distinct from old.casa_id then
      raise exception 'Não é possível mover lançamento para outra casa';
    end if;
    new.criado_por := old.criado_por;
    new.criado_em  := old.criado_em;
  end if;
  return new;
end $$;
revoke execute on function public.proteger_lancamento() from public, anon, authenticated;
create trigger lancamentos_proteger before insert or update on public.lancamentos
  for each row execute function public.proteger_lancamento();

-- 5. Datas dentro de um intervalo que faça sentido.
alter table public.lancamentos add constraint lancamentos_data_ck
  check (data between date '2000-01-01' and date '2100-12-31');

-- 6. Lembretes só para serviços de push conhecidos.
alter table public.push_inscricoes add constraint push_endpoint_ck check (
  char_length(endpoint) <= 1000
  and endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/'
);
alter table public.push_inscricoes add constraint push_chaves_ck
  check (char_length(p256dh) <= 200 and char_length(auth) <= 100);

drop policy push_ver on public.push_inscricoes;
drop policy push_criar on public.push_inscricoes;
drop policy push_alterar on public.push_inscricoes;
drop policy push_apagar on public.push_inscricoes;
create policy push_ver on public.push_inscricoes for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_criar on public.push_inscricoes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.sou_membro(casa_id));
create policy push_alterar on public.push_inscricoes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.sou_membro(casa_id));
create policy push_apagar on public.push_inscricoes for delete to authenticated
  using (user_id = (select auth.uid()));

-- 7. Índices das buscas do app e das chaves estrangeiras.
create index if not exists lancamentos_grupo_data_idx on public.lancamentos(grupo, data desc, criado_em desc) where grupo is not null;
drop index if exists public.lancamentos_grupo_idx;
create index if not exists lancamentos_caixinha_casa_idx on public.lancamentos(caixinha_id, casa_id) where caixinha_id is not null;
drop index if exists public.lancamentos_caixinha_idx;
create index if not exists lancamentos_criado_por_idx on public.lancamentos(criado_por) where criado_por is not null;
create index if not exists series_casa_idx on public.series(casa_id);
create index if not exists historico_user_idx on public.historico(user_id) where user_id is not null;
create index if not exists push_inscricoes_user_idx on public.push_inscricoes(user_id);
