-- Foto de cada um no lugar da inicial (26/10/2026). Guardada pequena (JPEG ~128 px) direto no membro;
-- só a própria pessoa troca a dela, pela função abaixo, e só quem é da casa vê.
alter table public.membros add column foto text
  check (foto is null or (foto like 'data:image/jpeg;base64,%' and char_length(foto) <= 60000));

create or replace function public.definir_minha_foto(p_foto text) returns void
language sql security definer set search_path = '' as $$
  update public.membros set foto = nullif(p_foto, '') where user_id = auth.uid();
$$;

revoke execute on function public.definir_minha_foto(text) from public, anon;
grant execute on function public.definir_minha_foto(text) to authenticated;
