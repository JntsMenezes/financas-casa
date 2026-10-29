-- Casa de uma pessoa só (29/10/2026): no começo, "Chame quem divide a casa" ganha a opção "Só eu".
alter table public.casas add column so_eu boolean not null default false;

create function public.definir_so_eu(p_so_eu boolean) returns void
language sql security definer set search_path = '' as $$
  update public.casas set so_eu = p_so_eu
  where id = (select casa_id from public.membros where user_id = auth.uid() limit 1);
$$;
revoke execute on function public.definir_so_eu(boolean) from public, anon;
grant execute on function public.definir_so_eu(boolean) to authenticated;
