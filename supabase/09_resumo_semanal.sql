-- Resumo semanal no celular: domingo às 20h de Brasília (23h UTC).
-- Cada celular escolhe se recebe (vem ligado para quem já tem os lembretes).
alter table public.push_inscricoes add column resumo boolean not null default true;

select cron.schedule('resumo-semanal', '0 23 * * 0', $$
  select net.http_post(
    url := 'https://fmzxkpqtsjmrcstcbluy.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'lembretes_cron_segredo')),
    body := '{"tipo":"resumo"}'::jsonb,
    timeout_milliseconds := 30000);
$$);
