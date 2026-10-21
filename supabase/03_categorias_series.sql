-- Categorias e contas fixas sem data para acabar.
-- Rodar uma vez no SQL Editor, depois do 02_historico.sql.

alter table public.lancamentos add column if not exists categoria text
  check (categoria is null or char_length(categoria) between 1 and 30);

-- Uma linha por conta fixa que se repete sozinha.
create table public.series (
  grupo      uuid primary key,
  casa_id    uuid not null references public.casas(id) on delete cascade,
  passo      text not null check (passo in ('mes', 'semana')),
  sem_fim    boolean not null default true,
  gerado_ate date,  -- até onde já foi gerado; o que for apagado depois não volta
  criado_em  timestamptz not null default now()
);

alter table public.series enable row level security;

create policy series_ver on public.series for select to authenticated using (public.sou_membro(casa_id));
create policy series_criar on public.series for insert to authenticated with check (public.sou_membro(casa_id));
create policy series_alterar on public.series for update to authenticated
  using (public.sou_membro(casa_id)) with check (public.sou_membro(casa_id));
create policy series_apagar on public.series for delete to authenticated using (public.sou_membro(casa_id));

-- Gera os próximos lançamentos das contas fixas sem fim:
-- 12 meses à frente para as mensais, 6 meses para as semanais.
-- O lock evita que os dois celulares gerem em dobro ao mesmo tempo.
create function public.manter_series(p_casa uuid) returns int
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
    select * into u from public.lancamentos where grupo = s.grupo order by data desc, criado_em desc limit 1;
    continue when u.id is null;

    v_lim   := case when s.passo = 'semana' then current_date + interval '6 months' else current_date + interval '12 months' end;
    v_desde := greatest(coalesce(s.gerado_ate, u.data), u.data);
    v_ult   := null;
    k := 1;
    loop
      v_data := case when s.passo = 'semana' then u.data + 7 * k else (u.data + make_interval(months => k))::date end;
      exit when v_data > v_lim or k > 400;
      if v_data > v_desde then
        insert into public.lancamentos (casa_id, data, descricao, tipo, valor, pago, recorrente, grupo, categoria, criado_por)
        values (u.casa_id, v_data, u.descricao, u.tipo, u.valor, false, true, u.grupo, u.categoria, auth.uid());
        n := n + 1;
        v_ult := v_data;
      end if;
      k := k + 1;
    end loop;

    if v_ult is not null then
      update public.series set gerado_ate = v_ult where grupo = s.grupo;
    end if;
  end loop;

  return n;
end $$;

revoke execute on function public.manter_series(uuid) from public, anon;
grant execute on function public.manter_series(uuid) to authenticated;
