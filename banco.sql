-- Criar tabela de prestadores conectada ao Auth
CREATE TABLE public.providers (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  profession TEXT NOT NULL,
  cnpj_cpf TEXT,
  city TEXT NOT NULL,
  work_radius INTEGER NOT NULL,
  is_ouro BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança de Nível de Linha (RLS)
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Prestadores podem ver o próprio perfil
CREATE POLICY "Prestador pode ver próprio perfil" ON public.providers
  FOR SELECT USING (auth.uid() = id);

-- Prestadores podem inserir e atualizar o próprio perfil
CREATE POLICY "Prestador pode atualizar próprio perfil" ON public.providers
  FOR ALL USING (auth.uid() = id);
