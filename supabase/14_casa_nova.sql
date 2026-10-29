-- Casa nova por convite (29/10/2026).
-- Quem já tem casa gera um código de "casa nova" e manda para outra família.
-- Sem esse código ninguém cria casa: o site é público e o banco é o mesmo.

create table public.convites_casa (
  codigo     text primary key default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  criado_por uuid not null references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  usado_por  uuid references auth.users(id) on delete set null,
  usado_em   timestamptz,
  casa_id    uuid references public.casas(id) on delete set null
);
create index convites_casa_criador_idx on public.convites_casa(criado_por);
alter table public.convites_casa enable row level security;
create policy "vejo os convites que gerei" on public.convites_casa
  for select to authenticated using (criado_por = (select auth.uid()));

-- Só quem já mora numa casa gera convite; no máximo 3 sem uso ao mesmo tempo.
-- Devolve um convite ainda sem uso, se houver, para não acumular códigos soltos.
create function public.gerar_convite_casa() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro';
  end if;
  if not exists (select 1 from public.membros where user_id = auth.uid()) then
    raise exception 'Só quem já tem uma casa pode convidar outra família';
  end if;
  select codigo into v_codigo from public.convites_casa
    where criado_por = auth.uid() and usado_por is null
    order by criado_em desc limit 1;
  if v_codigo is not null then
    return v_codigo;
  end if;
  insert into public.convites_casa (criado_por) values (auth.uid()) returning codigo into v_codigo;
  return v_codigo;
end $$;
revoke execute on function public.gerar_convite_casa() from public, anon;
grant execute on function public.gerar_convite_casa() to authenticated;

-- Um campo só na tela de entrada: o código pode ser de uma casa (entra nela)
-- ou um convite de casa nova (cria a casa e entra como primeira pessoa).
-- Código errado conta tentativa dentro de entrar_na_casa (5 por hora).
create function public.usar_codigo(p_codigo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text := upper(trim(p_codigo));
  v_convite public.convites_casa;
  v_casa uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro';
  end if;
  select casa_id into v_casa from public.membros where user_id = auth.uid() limit 1;
  if v_casa is not null then
    return v_casa;  -- já mora numa casa: não cria outra nem entra em segunda
  end if;

  select * into v_convite from public.convites_casa where codigo = v_codigo for update;
  if v_convite.codigo is null then
    return public.entrar_na_casa(v_codigo);
  end if;
  if v_convite.usado_por is not null then
    raise exception 'Esse convite já foi usado. Peça um novo para quem te convidou';
  end if;

  insert into public.casas (nome) values ('Casa') returning id into v_casa;
  insert into public.membros (casa_id, user_id, email) values (v_casa, auth.uid(), auth.jwt() ->> 'email');
  update public.convites_casa set usado_por = auth.uid(), usado_em = now(), casa_id = v_casa
    where codigo = v_convite.codigo;
  return v_casa;
end $$;
revoke execute on function public.usar_codigo(text) from public, anon;
grant execute on function public.usar_codigo(text) to authenticated;
