-- Paleta que cada um escolheu em Ajustes > Cores (10/11/2026). A outra pessoa aparece na cor da paleta dela
-- (bolinha da última atividade, inicial do topo, marca de quem lançou). Só a própria pessoa troca a dela.
alter table public.membros add column if not exists paleta text
  check (paleta is null or paleta in ('ninho', 'rosa', 'noite'));

create or replace function public.definir_minha_paleta(p_paleta text) returns void
language sql security definer set search_path = '' as $$
  update public.membros set paleta = p_paleta where user_id = auth.uid();
$$;

revoke execute on function public.definir_minha_paleta(text) from public, anon;
grant execute on function public.definir_minha_paleta(text) to authenticated;
