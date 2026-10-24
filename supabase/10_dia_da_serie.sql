-- Conta fixa mantém o dia (24/10/2026).
-- Antes, cada mês novo era "último lançamento + 1 mês": uma conta do dia 31 que caía num 30
-- ficava presa no 30 para sempre. Agora o dia vem da própria série (o mais comum nos últimos
-- meses de 31 dias) e só vira o último dia do mês quando o mês não tem esse dia.

create or replace function public.manter_series(p_casa uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  s       record;
  u       public.lancamentos;
  v_data  date;
  v_mes   date;
  v_desde date;
  v_lim   date;
  v_ult   date;
  v_dia   int;
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

    select d into v_dia from (
      select extract(day from l.data)::int as d, l.data
        from public.lancamentos l
        where l.grupo = s.grupo and l.casa_id = p_casa
          and extract(day from (date_trunc('month', l.data) + interval '1 month - 1 day')) = 31
        order by l.data desc limit 4
    ) t group by d order by count(*) desc, max(data) desc limit 1;
    v_dia := coalesce(v_dia, extract(day from u.data)::int);

    v_lim   := case when s.passo = 'semana' then current_date + interval '6 months' else current_date + interval '12 months' end;
    v_desde := greatest(coalesce(s.gerado_ate, u.data), u.data);
    v_ult   := null;
    k := 1;
    loop
      if s.passo = 'semana' then
        v_data := u.data + 7 * k;
      else
        v_mes  := (date_trunc('month', u.data) + make_interval(months => k))::date;
        v_data := v_mes + (least(v_dia, extract(day from (v_mes + interval '1 month - 1 day'))::int) - 1);
      end if;
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
