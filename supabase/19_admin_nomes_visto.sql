-- Painel do admin (29/10/2026): nome de cada casa (só o admin vê) e quando cada pessoa abriu o app.

alter table public.membros add column visto_em timestamptz;

-- O app chama ao abrir. No máximo uma gravação por hora por pessoa.
create function public.marcar_visto() returns void
language sql security definer set search_path = '' as $$
  update public.membros set visto_em = now()
  where user_id = auth.uid() and (visto_em is null or visto_em < now() - interval '1 hour');
$$;
revoke execute on function public.marcar_visto() from public, anon;
grant execute on function public.marcar_visto() to authenticated;

create table public.admin_apelidos (
  casa_id uuid primary key references public.casas(id) on delete cascade,
  apelido text not null check (char_length(apelido) between 1 and 40)
);
alter table public.admin_apelidos enable row level security;  -- sem policy: só as funções do admin

create function public.admin_dar_nome(p_casa uuid, p_apelido text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.sou_admin() then
    raise exception 'Só o admin';
  end if;
  if nullif(trim(p_apelido), '') is null then
    delete from public.admin_apelidos where casa_id = p_casa;
  else
    insert into public.admin_apelidos (casa_id, apelido) values (p_casa, trim(p_apelido))
      on conflict (casa_id) do update set apelido = excluded.apelido;
  end if;
end $$;
revoke execute on function public.admin_dar_nome(uuid, text) from public, anon;
grant execute on function public.admin_dar_nome(uuid, text) to authenticated;

create or replace function public.admin_visao() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.sou_admin() then
    raise exception 'Só o admin';
  end if;
  return jsonb_build_object(
    'casas', coalesce((select jsonb_agg(x order by x->>'criado_em') from (
      select jsonb_build_object(
        'id', c.id, 'codigo', c.codigo, 'criado_em', c.criado_em, 'so_eu', c.so_eu,
        'apelido', (select a.apelido from public.admin_apelidos a where a.casa_id = c.id),
        'minha', exists (select 1 from public.membros m where m.casa_id = c.id and m.user_id = auth.uid()),
        'membros', coalesce((select jsonb_agg(jsonb_build_object('nome', m.nome, 'email', m.email, 'criado_em', m.criado_em, 'visto_em', m.visto_em) order by m.criado_em)
                    from public.membros m where m.casa_id = c.id), '[]'::jsonb),
        'visto_em', (select max(m.visto_em) from public.membros m where m.casa_id = c.id),
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
