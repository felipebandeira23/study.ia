-- StudyAI Seed Data
-- seed.sql — Optional sample data for development/testing
-- WARNING: Run only in development environments

-- Sample user profile (replace UUID with actual Supabase auth user ID)
-- INSERT INTO public.profiles (id, full_name)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Usuário Teste');

-- Sample deck
-- INSERT INTO public.decks (id, user_id, title, description, topic)
-- VALUES (
--   '00000000-0000-0000-0000-000000000010',
--   '00000000-0000-0000-0000-000000000001',
--   'JavaScript Básico',
--   'Conceitos fundamentais do JavaScript',
--   'programação'
-- );

-- Sample flashcards
-- INSERT INTO public.flashcards (deck_id, user_id, front, back) VALUES
--   ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
--    'O que é uma closure em JavaScript?',
--    'Uma closure é uma função que tem acesso às variáveis do seu escopo externo mesmo após a função externa ter retornado.'),
--   ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
--    'Qual a diferença entre let, const e var?',
--    'var tem escopo de função e é hoisted. let e const têm escopo de bloco. const não permite reatribuição.');
