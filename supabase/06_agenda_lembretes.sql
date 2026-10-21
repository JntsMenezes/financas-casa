-- Agenda diária dos lembretes: 8h de Brasília (11h UTC).
-- O segredo fica no Vault com o nome lembretes_cron_segredo, criado à parte:
--   select vault.create_secret('<valor do CRON_SEGREDO>', 'lembretes_cron_segredo');
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('lembretes-diarios', '0 11 * * *', $$
  select net.http_post(
    url := 'https://fmzxkpqtsjmrcstcbluy.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'lembretes_cron_segredo')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000);
$$);
