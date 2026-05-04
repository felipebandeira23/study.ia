# StudyAI 🎓

> Plataforma de estudos potencializada por Inteligência Artificial — gere resumos, flashcards e planos de estudo personalizados em segundos.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/felipebandeira23/study.ia)

---

## Visão Geral do Produto

O **StudyAI** é uma aplicação web que auxilia estudantes a aprender mais rapidamente com o apoio de IA generativa (Google Gemini). O usuário faz login, cola ou descreve o conteúdo que deseja estudar, e a plataforma gera automaticamente:

- **Resumos de estudo** — organizados, com títulos e marcadores, prontos para revisão.
- **Flashcards** — baralhos de perguntas e respostas gerados a partir do conteúdo colado.
- **Planos de estudo** — cronogramas personalizados por tema, duração e nível de conhecimento.

O produto é pensado como um MVP focado em velocidade de entrega e experiência simples, com escalabilidade para features futuras (quizzes, progresso, colaboração, etc.).

---

## Tecnologias e Serviços

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + TypeScript |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com) |
| Autenticação | [Supabase Auth](https://supabase.com/docs/guides/auth) (e-mail/senha + OAuth Google) |
| Banco de Dados | [Supabase](https://supabase.com) (PostgreSQL + Row Level Security) |
| IA | [Google AI Studio](https://aistudio.google.com) — modelo Gemini 2.0 Flash |
| Hospedagem | [Vercel](https://vercel.com) |
| Lint / Format | ESLint + Prettier |

---

## Requisitos

- **Node.js** >= 20.x
- **npm** >= 10.x (ou pnpm/yarn equivalente)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita)
- Chave de API no [Google AI Studio](https://aistudio.google.com/app/apikey) (gratuita com limites generosos)

---

## Setup Local — Passo a Passo

### 1. Clone o repositório

```bash
git clone https://github.com/felipebandeira23/study.ia.git
cd study.ia
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env.local
```

Edite `.env.local` com as suas credenciais (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente) abaixo).

### 4. Configure o banco de dados no Supabase

Acesse o [painel do Supabase](https://supabase.com/dashboard), abra o **SQL Editor** do seu projeto e execute os arquivos de migração na ordem:

```sql
-- Execute primeiro:
supabase/migrations/001_initial_schema.sql

-- Execute depois:
supabase/migrations/002_rls_policies.sql
```

> **Dica:** Você pode copiar o conteúdo de cada arquivo e colar diretamente no SQL Editor do Supabase.

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no browser.

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

| Variável | Descrição | Onde encontrar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima/pública do Supabase | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (somente server-side!) | Dashboard → Settings → API |
| `GOOGLE_AI_STUDIO_API_KEY` | API key do Google AI Studio | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_SITE_URL` | URL base do site | `http://localhost:3000` em dev; URL da Vercel em produção |

### Exemplo de `.env.local`

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xyzxyzxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_AI_STUDIO_API_KEY=AIzaSy...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ **NUNCA** commite `.env.local` ou qualquer arquivo com valores reais. O `.gitignore` já está configurado para ignorar todos os arquivos `.env*` (exceto `.env.example`).

---

## Como Rodar, Testar e Fazer Lint

```bash
# Servidor de desenvolvimento (hot reload)
npm run dev

# Build de produção
npm run build

# Iniciar servidor de produção (após build)
npm run start

# Lint (ESLint)
npm run lint

# Lint com auto-fix
npm run lint:fix

# Verificar formatação (Prettier)
npm run format:check

# Aplicar formatação (Prettier)
npm run format
```

---

## Estrutura do Projeto

```
study.ia/
├── public/                   # Arquivos estáticos (imagens, ícones, etc.)
├── src/
│   ├── app/                  # App Router do Next.js
│   │   ├── api/              # Route Handlers (server-side)
│   │   │   ├── ai/
│   │   │   │   ├── summarize/route.ts   # POST /api/ai/summarize
│   │   │   │   ├── flashcards/route.ts  # POST /api/ai/flashcards
│   │   │   │   └── generate/route.ts    # POST /api/ai/generate (plano)
│   │   │   └── auth/
│   │   │       ├── callback/route.ts    # GET  /api/auth/callback (OAuth)
│   │   │       └── signout/route.ts     # POST /api/auth/signout
│   │   ├── auth/
│   │   │   ├── login/page.tsx           # Página de login
│   │   │   ├── signup/page.tsx          # Página de cadastro
│   │   │   └── error/page.tsx           # Erro de autenticação
│   │   ├── dashboard/page.tsx           # Painel principal (autenticado)
│   │   ├── study/
│   │   │   ├── summarize/page.tsx       # Gerador de resumos
│   │   │   ├── flashcards/page.tsx      # Gerador de flashcards
│   │   │   └── plan/page.tsx            # Gerador de plano de estudo
│   │   ├── globals.css                  # Estilos globais
│   │   ├── layout.tsx                   # Layout raiz
│   │   └── page.tsx                     # Landing page
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx            # Formulário de login
│   │   │   └── SignupForm.tsx           # Formulário de cadastro
│   │   └── study/
│   │       ├── SummarizeClient.tsx      # UI do gerador de resumos
│   │       ├── FlashcardsClient.tsx     # UI do gerador de flashcards
│   │       └── StudyPlanClient.tsx      # UI do gerador de planos
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Supabase client (browser)
│   │   │   ├── server.ts               # Supabase client (server)
│   │   │   └── middleware.ts           # Supabase session refresh
│   │   └── ai/
│   │       └── gemini.ts               # Wrapper Google AI Studio
│   ├── types/
│   │   └── index.ts                    # Tipos TypeScript da aplicação
│   └── proxy.ts                        # Proxy/Middleware do Next.js
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql       # Schema inicial (tabelas + triggers)
│   │   └── 002_rls_policies.sql         # Row Level Security policies
│   └── seed.sql                         # Dados de exemplo (dev)
├── .env.example                         # Exemplo de variáveis de ambiente
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config (via postcss)
└── tsconfig.json
```

---

## Fluxo de Deploy na Vercel

### 1. Conecte o repositório

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `felipebandeira23/study.ia`
3. Selecione o framework **Next.js** (detectado automaticamente)

### 2. Configure as variáveis de ambiente na Vercel

No painel de configuração do projeto, adicione todas as variáveis do `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_STUDIO_API_KEY`
- `NEXT_PUBLIC_SITE_URL` → coloque a URL da Vercel (ex: `https://study-ia.vercel.app`)

> 💡 **Dica de segurança:** Marque `SUPABASE_SERVICE_ROLE_KEY` e `GOOGLE_AI_STUDIO_API_KEY` como **"Sensitive"** na Vercel para que não apareçam nos logs.

### 3. Deploy

Clique em **Deploy**. A cada push na branch `main`, a Vercel fará redeploy automaticamente.

### 4. Configure a URL de callback no Supabase

Após o deploy, adicione a URL de callback nas configurações de Auth do Supabase:

- **Site URL:** `https://seu-projeto.vercel.app`
- **Redirect URLs:** `https://seu-projeto.vercel.app/api/auth/callback`

---

## Configuração do Supabase

### Auth

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Authentication → Providers**
3. **Email/Senha:** Já habilitado por padrão
4. **Google OAuth (opcional):**
   - Habilite o provider Google
   - Configure `Client ID` e `Client Secret` do [Google Cloud Console](https://console.cloud.google.com)
   - Adicione a URL de callback: `https://[seu-projeto].supabase.co/auth/v1/callback`

### Banco de Dados — Migrações

Execute os arquivos SQL no **SQL Editor** do Supabase, nesta ordem:

```
1. supabase/migrations/001_initial_schema.sql  ← tabelas, índices, triggers
2. supabase/migrations/002_rls_policies.sql    ← Row Level Security
```

### Chaves de API

Encontre no painel: **Settings → API**

| Chave | Uso |
|---|---|
| `URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` | `SUPABASE_SERVICE_ROLE_KEY` (somente server!) |

---

## Boas Práticas de Segurança

### 🔐 Nunca exponha API keys no código

- **`GOOGLE_AI_STUDIO_API_KEY`** — Usada apenas em Route Handlers (server-side). **Nunca** deve aparecer em código de client component ou ser prefixada com `NEXT_PUBLIC_`.
- **`SUPABASE_SERVICE_ROLE_KEY`** — Bypassa RLS. Use apenas em contextos administrativos server-side.

### 🛡️ Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. Cada usuário só acessa seus próprios dados. As políticas estão em `supabase/migrations/002_rls_policies.sql`.

### 🗂️ Arquivos `.env`

O `.gitignore` já está configurado para **nunca commitar** arquivos de variáveis de ambiente (`.env.local`, `.env.development.local`, etc.). Apenas o `.env.example` (sem valores reais) é versionado.

### ✅ Checklist de Segurança

- [ ] Chaves de API configuradas apenas como variáveis de ambiente
- [ ] `GOOGLE_AI_STUDIO_API_KEY` sem prefixo `NEXT_PUBLIC_`
- [ ] RLS habilitado em todas as tabelas
- [ ] `.env.local` no `.gitignore`
- [ ] Variáveis marcadas como "Sensitive" na Vercel
- [ ] Rotacionar chaves imediatamente se alguma vazar

---

## Roadmap do MVP e Próximos Passos

### ✅ MVP — Fase 1 (atual)

- [x] Autenticação (e-mail/senha + Google OAuth)
- [x] Gerador de resumos com IA
- [x] Gerador de flashcards com IA
- [x] Gerador de plano de estudo com IA
- [x] Schema do banco de dados (profiles, decks, flashcards, study_notes, study_plans)
- [x] Row Level Security completo
- [x] Deploy na Vercel + integração Supabase

### 🚧 Fase 2 — Funcionalidades Core

- [ ] Salvar resumos no banco de dados
- [ ] Salvar e gerenciar decks de flashcards
- [ ] Modo de revisão de flashcards (flip + progresso)
- [ ] Histórico de planos de estudo
- [ ] Dashboard com estatísticas de estudo

### 🔮 Fase 3 — Engajamento

- [ ] Quiz gerado por IA com pontuação
- [ ] Sistema de repetição espaçada (Anki-like)
- [ ] Upload de PDF/imagem para gerar conteúdo
- [ ] Notificações de revisão programada
- [ ] Compartilhamento de decks entre usuários

### 💡 TODOs e Pontos de Decisão

> Marque estes pontos para decisão futura antes de implementar:

- **TODO:** Definir limite de chamadas de IA por usuário (rate limiting) para controle de custos
- **TODO:** Decidir se o conteúdo de IA será cacheado no banco para reduzir chamadas repetidas
- **TODO:** Avaliar se deve haver plano gratuito vs pago (integração Stripe)
- **TODO:** Definir política de retenção de dados (LGPD)
- **TODO:** Adicionar testes automatizados (Jest + Testing Library)
- **TODO:** Configurar CI/CD completo com GitHub Actions

---

## Contribuindo

1. Crie uma branch a partir de `main`: `git checkout -b feat/nome-da-feature`
2. Faça suas alterações e certifique-se de que o lint e build passam:
   ```bash
   npm run lint && npm run build
   ```
3. Abra um Pull Request com descrição clara das mudanças.

---

## Licença

Projeto privado — todos os direitos reservados.
