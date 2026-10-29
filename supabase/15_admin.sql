-- Admin e pedidos de casa (29/10/2026).
-- O admin vê só a visão geral das outras casas (quem participa, quando entrou, último uso,
-- quantos lançamentos). Nunca valores, descrições ou saldo.
-- Quem cadastra o admin: um insert direto no banco (fica fora do repositório).

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;  -- sem policy: só as funções leem

create function public.sou_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke execute on function public.sou_admin() from public, anon;
grant execute on function public.sou_admin() to authenticated;

-- Pedido de casa: quem criou a conta sem código pede, o admin aprova ou recusa.
create table public.pedidos_casa (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  email       text,
  nome        text check (char_length(nome) <= 60),
  mensagem    text check (char_length(mensagem) <= 200),
  status      text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  criado_em   timestamptz not null default now(),
  decidido_em timestamptz,
  casa_id     uuid references public.casas(id) on delete set null
);
alter table public.pedidos_casa enable row level security;
create policy "vejo o meu pedido" on public.pedidos_casa
  for select to authenticated using (user_id = (select auth.uid()));

create function public.pedir_casa(p_nome text, p_mensagem text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_ped public.pedidos_casa;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro';
  end if;
  if exists (select 1 from public.membros where user_id = auth.uid()) then
    return 'aprovado';
  end if;
  select * into v_ped from public.pedidos_casa where user_id = auth.uid();
  if v_ped.id is not null then
    if v_ped.status = 'pendente' then
      return 'pendente';
    end if;
    if v_ped.status = 'recusado' and v_ped.decidido_em > now() - interval '7 days' then
      raise exception 'O pedido foi recusado. Dá para pedir de novo depois de 7 dias';
    end if;
    update public.pedidos_casa
      set status = 'pendente', nome = nullif(trim(p_nome), ''), mensagem = nullif(trim(p_mensagem), ''),
          criado_em = now(), decidido_em = null, casa_id = null
      where id = v_ped.id;
    return 'pendente';
  end if;
  insert into public.pedidos_casa (user_id, email, nome, mensagem)
    values (auth.uid(), auth.jwt() ->> 'email', nullif(trim(p_nome), ''), nullif(trim(p_mensagem), ''));
  return 'pendente';
end $$;
revoke execute on function public.pedir_casa(text, text) from public, anon;
grant execute on function public.pedir_casa(text, text) to authenticated;

-- Convite de casa nova agora é só do admin. O admin pode ter vários sem uso.
create or replace function public.gerar_convite_casa() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
begin
  if not public.sou_admin() then
    raise exception 'Só o admin cria convites de casa nova';
  end if;
  insert into public.convites_casa (criado_por) values (auth.uid()) returning codigo into v_codigo;
  return v_codigo;
end $$;

create function public.admin_cancelar_convite(p_codigo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.sou_admin() then
    raise exception 'Só o admin';
  end if;
  delete from public.convites_casa where codigo = p_codigo and usado_por is null;
end $$;
revoke execute on function public.admin_cancelar_convite(text) from public, anon;
grant execute on function public.admin_cancelar_convite(text) to authenticated;

create function public.admin_decidir_pedido(p_id uuid, p_aprovar boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ped public.pedidos_casa;
  v_casa uuid;
begin
  if not public.sou_admin() then
    raise exception 'Só o admin';
  end if;
  select * into v_ped from public.pedidos_casa where id = p_id and status = 'pendente' for update;
  if v_ped.id is null then
    raise exception 'Esse pedido já foi decidido';
  end if;
  if not p_aprovar then
    update public.pedidos_casa set status = 'recusado', decidido_em = now() where id = p_id;
    return;
  end if;
  select casa_id into v_casa from public.membros where user_id = v_ped.user_id limit 1;
  if v_casa is null then
    insert into public.casas (nome) values ('Casa') returning id into v_casa;
    insert into public.membros (casa_id, user_id, email, nome) values (v_casa, v_ped.user_id, v_ped.email, v_ped.nome);
  end if;
  update public.pedidos_casa set status = 'aprovado', decidido_em = now(), casa_id = v_casa where id = p_id;
end $$;
revoke execute on function public.admin_decidir_pedido(uuid, boolean) from public, anon;
grant execute on function public.admin_decidir_pedido(uuid, boolean) to authenticated;

-- Visão geral para o painel do admin. Sem valores, descrições nem saldo.
create function public.admin_visao() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.sou_admin() then
    raise exception 'Só o admin';
  end if;
  return jsonb_build_object(
    'casas', coalesce((select jsonb_agg(x order by x->>'criado_em') from (
      select jsonb_build_object(
        'id', c.id, 'codigo', c.codigo, 'criado_em', c.criado_em,
        'minha', exists (select 1 from public.membros m where m.casa_id = c.id and m.user_id = auth.uid()),
        'membros', coalesce((select jsonb_agg(jsonb_build_object('nome', m.nome, 'email', m.email, 'criado_em', m.criado_em) order by m.criado_em)
                    from public.membros m where m.casa_id = c.id), '[]'::jsonb),
        'lancamentos', (select count(*) from public.lancamentos l where l.casa_id = c.id),
        'ultimo_uso', (select max(l.atualizado_em) from public.lancamentos l where l.casa_id = c.id)
      ) x from public.casas c) t), '[]'::jsonb),
    'convites', coalesce((select jsonb_agg(jsonb_build_object(
        'codigo', v.codigo, 'criado_em', v.criado_em, 'usado_em', v.usado_em,
        'usado_por', (select u.email from auth.users u where u.id = v.usado_por)) order by v.criado_em desc)
      from public.convites_casa v), '[]'::jsonb),
    'pedidos', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'email', p.email, 'nome', p.nome, 'mensagem', p.mensagem, 'status', p.status,
        'criado_em', p.criado_em, 'decidido_em', p.decidido_em) order by p.criado_em desc)
      from public.pedidos_casa p), '[]'::jsonb)
  );
end $$;
revoke execute on function public.admin_visao() from public, anon;
grant execute on function public.admin_visao() to authenticated;
