-- Observação livre no lançamento (24/10/2026). Fica só no lançamento editado: não passa para os próximos da série.
alter table public.lancamentos add column observacao text check (char_length(observacao) <= 300);
