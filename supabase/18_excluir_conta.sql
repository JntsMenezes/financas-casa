-- Excluir a própria conta (29/10/2026).
-- Sai da casa e apaga o login. Se era a última pessoa da casa, a casa e tudo dela somem junto.
-- Se ainda mora alguém, a casa fica com essa pessoa (os lançamentos ficam sem autor).
-- O admin não se exclui por aqui, para o app não ficar sem admin.
create function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_casa uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login primeiro';
  end if;
  if public.sou_admin() then
    raise exception 'A conta do admin não pode ser excluída pelo app';
  end if;
  select casa_id into v_casa from public.membros where user_id = auth.uid() limit 1;
  delete from public.membros where user_id = auth.uid();
  if v_casa is not null and not exists (select 1 from public.membros where casa_id = v_casa) then
    delete from public.casas where id = v_casa;
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
