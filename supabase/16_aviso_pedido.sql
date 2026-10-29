-- Pedido de casa novo (ou pedido de novo depois de recusado): notificação no celular do admin.
-- Chama a função lembretes com {"tipo":"pedido"}, com o mesmo segredo do Vault dos agendamentos.
create function public.avisar_pedido_casa() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pendente' and (tg_op = 'INSERT' or old.status is distinct from 'pendente') then
    perform net.http_post(
      url := 'https://fmzxkpqtsjmrcstcbluy.supabase.co/functions/v1/lembretes',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'x-cron-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'lembretes_cron_segredo')),
      body := '{"tipo":"pedido"}'::jsonb,
      timeout_milliseconds := 20000);
  end if;
  return new;
end $$;
revoke execute on function public.avisar_pedido_casa() from public, anon, authenticated;
create trigger pedidos_casa_aviso after insert or update of status on public.pedidos_casa
  for each row execute function public.avisar_pedido_casa();
