-- Caixinhas: dinheiro guardado (emergência, filhos, casal).
-- Guardar é um lançamento de despesa com caixinha_id (sai da conta, mas não é gasto);
-- resgatar é uma receita com caixinha_id (volta para a conta).

create table public.caixinhas (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid not null references public.casas(id) on delete cascade,
  nome          text not null check (char_length(nome) between 1 and 40),
  icone         text not null default 'cofre' check (char_length(icone) between 1 and 20),
  objetivo      numeric(12,2) check (objetivo > 0),
  prazo         date,
  saldo_real    numeric(12,2) check (saldo_real >= 0),   -- saldo informado na mão (com rendimento)
  saldo_real_em date,
  ordem         int not null default 0,
  arquivada     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, casa_id)
);
create index caixinhas_casa_idx on public.caixinhas(casa_id);

alter table public.caixinhas enable row level security;

create policy caixinhas_ver on public.caixinhas for select to authenticated using (public.sou_membro(casa_id));
create policy caixinhas_criar on public.caixinhas for insert to authenticated with check (public.sou_membro(casa_id));
create policy caixinhas_alterar on public.caixinhas for update to authenticated
  using (public.sou_membro(casa_id)) with check (public.sou_membro(casa_id));
create policy caixinhas_apagar on public.caixinhas for delete to authenticated using (public.sou_membro(casa_id));

-- A caixinha precisa ser da mesma casa do lançamento. Apagar a caixinha não apaga o dinheiro que saiu da conta.
alter table public.lancamentos add column caixinha_id uuid;
alter table public.lancamentos add constraint lancamentos_caixinha_fk
  foreign key (caixinha_id, casa_id) references public.caixinhas(id, casa_id) on delete set null (caixinha_id);
create index lancamentos_caixinha_idx on public.lancamentos(caixinha_id) where caixinha_id is not null;

-- Contas fixas sem fim passam a levar a caixinha junto (depósito mensal para o Gael, por exemplo).
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
        insert into public.lancamentos (casa_id, data, descricao, tipo, valor, pago, recorrente, grupo, categoria, caixinha_id, criado_por)
        values (u.casa_id, v_data, u.descricao, u.tipo, u.valor, false, true, u.grupo, u.categoria, u.caixinha_id, auth.uid());
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
