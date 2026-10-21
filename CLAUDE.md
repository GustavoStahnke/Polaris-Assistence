# Polaris Assistence — Especificação do projeto

> Este arquivo é lido automaticamente pelo Claude Code sempre que você abre o projeto.
> Ele descreve o sistema inteiro, as regras de desenvolvimento e o roteiro em etapas.

## Como usar (para o dono do projeto)

1. Instale o **Node.js LTS** (nodejs.org) e o **Git** (git-scm.com).
2. Crie uma pasta chamada `polaris-assistence` e coloque este arquivo dentro dela com o nome `CLAUDE.md`.
3. Abra a pasta no VS Code e abra o Claude Code.
4. Digite: **`Execute a Etapa 0 do CLAUDE.md`**
5. Quando ele terminar, teste do jeito que ele explicar. Se estiver tudo certo, peça a próxima: `Execute a Etapa 1`, e assim por diante.

Dica: faça uma etapa por vez. Se algo quebrar, descreva o erro (ou cole a mensagem) e peça para corrigir antes de seguir.

---

## 1. Visão

**Polaris Assistence** é um sistema pessoal tudo-em-um. Em vez de abrir vários apps toda manhã (agenda, e-mail, notícias, livros, treino), o usuário abre o Polaris e faz tudo num lugar só.

Polaris é a estrela-guia, a que orienta o caminho. O sistema é isso: o ponto central que organiza o dia.

### Princípios

- **Local primeiro e custo zero:** roda 100% no computador do usuário, com banco SQLite. Nenhum serviço pago.
- **Tudo num lugar só:** um painel com o briefing do dia e módulos para cada área da vida.
- **Hub de Integrações:** toda API externa e todo programa ligado ao sistema passa por uma área central de Integrações. Nenhum módulo chama API externa diretamente.
- **Pronto para crescer** sem reescrever:
  - Fase 1: computador.
  - Fase 2: celular na mesma rede Wi-Fi.
  - Fase 3: web com Supabase + Netlify.
  - Fase 4: assistente de voz (estilo Jarvis).
- **Privacidade:** os dados ficam no PC do usuário. Segredos são criptografados.
- **Visual futurista:** painel escuro, grade luminosa, cards de vidro com brilho ciano e um núcleo animado no centro.

---

## 2. Sobre o usuário e o idioma

- Considere que o usuário está aprendendo a programar. Ao final de cada etapa, explique em linguagem simples:
  - o que foi feito;
  - os comandos exatos para rodar;
  - o que testar, passo a passo.
- **Interface:** 100% em português do Brasil.
- **Código:** nomes de variáveis, funções e arquivos em inglês. Comentários e mensagens ao usuário em português.
- O projeto precisa funcionar em Windows, macOS e Linux. Use apenas scripts npm, sem comandos exclusivos de um sistema.

---

## 3. Nome e identidade

- Nome do sistema: **Polaris Assistence**. Fica definido em um único lugar, `shared/src/config.ts` (`APP_NAME`), para poder ser trocado facilmente.
- A assistente se chama **Polaris** e trata o usuário pelo nome configurado no perfil.
- Logo: uma estrela-guia de 4 pontas com brilho, ao lado do texto "POLARIS" (fonte Orbitron).

---

## 4. Stack (tudo gratuito)

| Camada | Tecnologia |
|---|---|
| Interface | React + Vite + TypeScript (strict) |
| Estilo | Tailwind CSS v4, com tokens do design system (seção 6) definidos em `@theme` no CSS |
| Animações | Motion (antigo Framer Motion) + Canvas 2D para o núcleo animado |
| Ícones | lucide-react |
| Gráficos | Recharts |
| Rotas | React Router |
| Dados no front | TanStack Query |
| Estado global leve | Zustand |
| Formulários | react-hook-form + zod (+ `@hookform/resolvers`, a ponte oficial entre os dois) |
| Fontes | @fontsource (Orbitron, Space Grotesk, JetBrains Mono), para funcionar offline |
| Servidor | Node.js 22+ + Express + TypeScript (rodando com `tsx` em desenvolvimento e no `npm start`, sem etapa de compilação) |
| Banco | SQLite (better-sqlite3) + Drizzle ORM + drizzle-kit |
| Tarefas agendadas | node-cron (sincronização das integrações) |
| Notícias | rss-parser |
| Google | googleapis (OAuth2, Agenda, Gmail) |
| IA local | Ollama via HTTP (opcional) |
| App instalável | vite-plugin-pwa (+ `@vite-pwa/assets-generator`, só em dev, para gerar os ícones) |
| QR code | qrcode (endereço do modo rede local para o celular) |
| Monorepo | npm workspaces + concurrently |

Ferramentas de desenvolvimento (ESLint e plugins, Prettier, `globals`, `@types/*`) também são permitidas. O TypeScript fica fixado em `~6.0`, porque o `typescript-eslint` ainda não suporta o TypeScript 7.

Não adicione bibliotecas fora desta lista sem explicar por quê. Nunca adicione serviço pago sem perguntar.

---

## 5. Estrutura e arquitetura

```
polaris-assistence/
├── CLAUDE.md
├── package.json              # workspaces + scripts
├── .env.example
├── .gitignore                # inclui .env, data/, backups/, node_modules/
├── client/                   # React + Vite
│   └── src/
│       ├── app/              # rotas, layout, providers
│       ├── components/ui/    # design system (PolarisCard, Badge, etc.)
│       ├── components/core/  # NucleoPolaris, TopBar, Sidebar, MobileNav
│       ├── modules/          # painel, agenda, email, noticias, clima,
│       │                     # biblioteca, academia, notas, tarefas,
│       │                     # habitos, integracoes, configuracoes
│       ├── lib/              # api client, helpers, formatadores pt-BR
│       └── styles/
├── server/
│   └── src/
│       ├── index.ts          # Express; em produção serve o client buildado
│       ├── routes/           # rotas finas, só recebem e respondem
│       ├── services/         # regras de negócio (funções puras)
│       ├── repositories/     # acesso a dados (o único lugar que fala com o banco)
│       ├── integrations/     # Hub de Integrações (seção 7)
│       ├── db/               # schema Drizzle, migrações, seed
│       ├── jobs/             # agendamentos (sync, backup diário, lembretes)
│       └── security/         # criptografia, PIN
├── shared/
│   └── src/                  # tipos, schemas zod, config (APP_NAME)
├── data/                     # polaris.db (fora do git)
└── backups/                  # cópias do banco (fora do git)
```

### Regras de arquitetura

1. **Rotas finas, services puros.** Toda lógica fica em `services/` como funções independentes do Express. Na Fase 3, elas vão virar Netlify Functions ou Supabase Edge Functions.
2. **Repositórios isolam o banco.** Só `repositories/` usa o Drizzle. Trocar SQLite por Supabase (Postgres) deve mexer só nessa camada.
3. **Dados portáveis:**
   - IDs em texto UUID.
   - Datas em ISO 8601 UTC (texto).
   - Nada exclusivo do SQLite fora dos repositórios, exceto a busca FTS5, que fica isolada.
4. **Toda API externa passa pelo Hub de Integrações.** Os módulos pedem dados ao hub, nunca chamam a API direto.
5. **Falha de integração nunca derruba o painel.** O card mostra o estado de erro, o último dado em cache e um atalho para Integrações.
6. **Validação com zod** dos dois lados. Os schemas ficam em `shared/`.
7. **Portas:** client em 5173 (com proxy de `/api` para o servidor) e servidor em 3001. Com `npm start`, o servidor entrega o client buildado em `http://localhost:3001`.
8. **Offline:** sem internet, o app abre normalmente com os dados locais e o cache das integrações.

### Segurança

- Credenciais e tokens são criptografados com AES-256-GCM. A chave `POLARIS_SECRET` é gerada automaticamente no primeiro start e salva no `.env`.
- Por padrão, o servidor escuta só em `127.0.0.1`.
- O **modo rede local** (para o celular) só liga se o usuário ativar e exige um **PIN de acesso**.
- `.env`, `data/` e `backups/` nunca vão para o git.

### Scripts npm

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe client e servidor juntos |
| `npm run build` | Gera a versão final |
| `npm start` | Roda a versão final em `localhost:3001` |
| `npm run db:migrate` | Aplica as migrações do banco |
| `npm run db:studio` | Abre o visualizador do banco |
| `npm run backup` | Copia o banco para `backups/` |
| `npm run typecheck` | Checa os tipos |
| `npm run lint` | Checa o estilo do código |

---

## 6. Design system — visual futurista

Referência: painéis estilo "centro de comando" com fundo azul-marinho profundo, grade luminosa, cards de vidro com bordas ciano brilhantes, rótulos em fonte mono maiúscula e um orbe de energia animado no centro.

### Cores (tokens no Tailwind e em variáveis CSS)

| Token | Valor | Uso |
|---|---|---|
| `bg-deep` | `#030814` | Fundo base |
| `bg-base` | `#061026` | Fundo das áreas |
| `panel` | `rgba(10, 26, 64, 0.55)` | Cards de vidro |
| `grid-line` | `rgba(56, 140, 255, 0.08)` | Linhas da grade |
| `border` | `rgba(90, 170, 255, 0.28)` | Borda dos cards |
| `glow` | `rgba(56, 189, 248, 0.6)` | Brilho e foco |
| `primary` | `#38BDF8` | Ciano Polaris |
| `primary-2` | `#3B82F6` | Azul elétrico |
| `star` | `#A5F3FC` | Brilho estelar |
| `text` | `#E6F0FF` | Texto principal |
| `text-dim` | `#8EA6CF` | Texto secundário |
| `text-faint` | `#5B6F95` | Rótulos discretos |
| `success` | `#34D399` | Conectado / ok |
| `warning` | `#FBBF24` | Atenção |
| `danger` | `#F87171` | Erro |

O sistema é **só tema escuro**.

### Tipografia

- **Orbitron:** logo, títulos de página ("PAINEL") e números grandes de destaque (relógio, temperatura).
- **Space Grotesk:** títulos de cards (peso 600) e textos.
- **JetBrains Mono:** rótulos em MAIÚSCULAS com espaçamento largo (11px, `tracking 0.18em`), badges, dados e relógio.

### Fundo

- Grade de linhas a cada 48px, com um leve efeito de perspectiva curva nas bordas.
- Brilho radial azul no centro e vinheta escura nas bordas.
- Campo de estrelas discreto (poucos pontos piscando devagar, em canvas e com baixo custo).

### Anatomia do card (`PolarisCard`)

```
┌──────────────────────────────────────────┐
│ [ícone]  RADAR · NOTÍCIAS        (AGORA) │  ← rótulo mono + badge em pílula
│          Título em destaque              │  ← Space Grotesk 600
│                                          │
│  conteúdo do módulo                      │
│                                          │
│ FONTE · DETALHE              [ABRIR ↗]   │  ← rodapé mono pequeno
└──────────────────────────────────────────┘
```

- **Vidro:** fundo `panel`, `backdrop-blur` de 14px, borda de 1px `border` e cantos de 16px.
- **Brilho:** uma linha fina luminosa no topo e sombra externa ciano suave.
- **Hover:** o brilho aumenta e o card sobe 2px.
- **Ícone:** fica numa caixinha quadrada com borda luminosa.
- **Rótulo:** segue o padrão "CATEGORIA · ASSUNTO", como "PANORAMA · CLIMA", "AGENDA · HOJE", "COMUNICAÇÕES · E-MAIL", "RADAR · NOTÍCIAS", "BIBLIOTECA · LEITURA", "TREINO · HOJE".
- **Estados obrigatórios:** carregando (skeleton com brilho passando), vazio (mensagem com personalidade) e erro (com atalho para Integrações).

### Núcleo Polaris (elemento central)

- Orbe de energia em Canvas 2D: vários anéis e fitas translúcidas ciano e azul girando em órbitas diferentes, com uma estrela de 4 pontas brilhando no centro.
- **Estados:**
  - `ocioso`: gira devagar e pulsa suave.
  - `processando`: gira mais rápido e brilha mais.
  - `ouvindo` e `falando`: ficam preparados para a Fase 4, reagindo ao áudio.
- Sobre o orbe aparece um painel de status, por exemplo:
  - rótulo "BRIEFING DO DIA";
  - frase "3 compromissos · 5 e-mails importantes · 26° ensolarado";
  - botões em pílula: AGENDA, E-MAILS, NOTÍCIAS, CLIMA, LEITURA.
- **Desempenho:** usa `requestAnimationFrame`, pausa quando a aba está oculta e fica estático com `prefers-reduced-motion`.

### Layout

- **Top bar:**
  - logo à esquerda;
  - no centro, relógio `HH:MM:SS` em fonte mono e data por extenso;
  - à direita, "SISTEMA ONLINE" com um ponto verde pulsando, "INTEGRAÇÕES 5/7" e o indicador de sincronização.
- **Sidebar:** fina, só com ícones, tooltips e item ativo com brilho.
- **Desktop:** grid de 3 colunas.
- **Celular:**
  - a sidebar vira barra inferior com Painel, Agenda, Livros, Treino e Mais;
  - os cards ficam em uma coluna;
  - o orbe fica menor.
- **Paleta de comandos (Ctrl+K):** busca global e ações rápidas ("nova nota", "registrar leitura", "iniciar treino").
- Toasts e notificações no estilo do sistema.

### Movimento

- Cards entram com fade e slide em sequência (40ms entre cada um).
- Números sobem animados (contagem).
- Pontos de status pulsam.
- Páginas trocam com transição suave.
- Tudo respeita `prefers-reduced-motion`.

### Acessibilidade

- Contraste mínimo de 4.5:1 no texto.
- Foco visível com anel ciano.
- `aria-label` em botões que só têm ícone.

---

## 7. Hub de Integrações (área central)

A página **Integrações** (`/integracoes`) é onde todas as APIs e programas externos são conectados, configurados, testados e monitorados. Funciona como uma "central de conexões" do sistema.

### Contrato de cada integração (`server/src/integrations/types.ts`)

```ts
type IntegrationCategory =
  | 'clima' | 'noticias' | 'livros' | 'google' | 'ia'
  | 'produtividade' | 'saude' | 'musica' | 'nuvem' | 'financas';

type IntegrationStatus =
  | 'nao_configurada' | 'conectada' | 'erro' | 'expirada' | 'desativada' | 'em_breve';

interface IntegrationDefinition<Config> {
  id: string;                       // ex.: 'open-meteo'
  name: string;                     // ex.: 'Open-Meteo'
  category: IntegrationCategory;
  description: string;              // uma frase em pt-BR
  icon: string;                     // nome do ícone lucide
  authType: 'none' | 'apiKey' | 'oauth2' | 'local';
  availability: 'available' | 'soon';
  free: boolean;                    // mostra selo "GRATUITO" ou "PAGO"
  configSchema: ZodType<Config>;    // gera o formulário de configuração
  dependsOn?: string[];             // ex.: 'gmail' depende de 'google-account'
  syncIntervalMinutes?: number;
  test(ctx: IntegrationContext<Config>): Promise<TestResult>;
  connect?(ctx: IntegrationContext<Config>): Promise<ConnectResult>; // OAuth: retorna a URL de autorização
  disconnect?(ctx: IntegrationContext<Config>): Promise<void>;
  sync?(ctx: IntegrationContext<Config>): Promise<SyncResult>;
}
```

### Como o hub funciona

- **`registry.ts`:** registra todas as integrações. Para adicionar um programa novo, basta criar uma pasta em `integrations/` e registrar ali.
- **`integrationService`:** é o que os módulos usam. Exemplos: `getWeather()`, `getNews()`, `getTodayEvents()`, `getImportantEmails()`, `askAI()`. Ele cuida de cache, erros e status.
- **Cache com validade:**
  - clima: 30 minutos;
  - notícias: 60 minutos;
  - e-mails: 5 minutos;
  - agenda: 10 minutos.
- **Agendador:** sincroniza cada integração ativa no seu intervalo.
- **Log:** cada teste, sincronização ou erro vira uma linha em `integration_logs`.
- **Configuração e tokens** ficam criptografados na tabela `integrations`.

### Endpoints

| Método e rota | O que faz |
|---|---|
| `GET /api/integrations` | Lista todas, com status, última sincronização e erro |
| `PATCH /api/integrations/:id` | Salva a configuração e ativa ou desativa |
| `POST /api/integrations/:id/test` | Testa a conexão |
| `POST /api/integrations/:id/connect` | Inicia a conexão (no OAuth, devolve a URL) |
| `POST /api/integrations/:id/sync` | Sincroniza agora |
| `POST /api/integrations/:id/disconnect` | Desconecta |
| `GET /api/integrations/:id/logs` | Histórico de eventos |
| `GET /api/integrations/google/callback` | Retorno do OAuth do Google |

### Interface da página Integrações

- **Topo:** resumo com "7 conectadas · 1 com erro · 6 em breve" e o botão "Sincronizar tudo".
- **Filtros:** Todas, Conectadas, Disponíveis, Em breve. Os cards ficam agrupados por categoria.
- **Card de cada integração:**
  - ícone, nome e descrição;
  - badge de status: CONECTADO (verde), ERRO (vermelho), RECONECTAR (amarelo), DESATIVADO (cinza) ou EM BREVE;
  - selo GRATUITO ou PAGO;
  - última sincronização ("há 4 min");
  - interruptor de ativar ou desativar;
  - botões Configurar, Testar, Sincronizar e Desconectar.
- **Gaveta lateral de configuração:**
  - formulário gerado a partir do `configSchema`;
  - guia passo a passo quando a integração exige configuração externa (como o Google);
  - aba com o log de eventos.
- **Mapa de conexões (visual):** o Núcleo Polaris no centro, com linhas luminosas ligando cada integração conectada. Integrações com erro aparecem em vermelho, e desativadas ficam apagadas.

### Catálogo de integrações

**Disponíveis (implementar nas etapas):**

| ID | Nome | Categoria | Autenticação | Configuração |
|---|---|---|---|---|
| `open-meteo` | Open-Meteo | clima | nenhuma | Cidade (busca pela API de geocoding do Open-Meteo), unidades |
| `rss` | Feeds de notícias (RSS) | noticias | nenhuma | Lista de feeds por categoria; adicionar ou remover; validar o feed |
| `open-library` | Open Library | livros | nenhuma | — |
| `google-account` | Conta Google | google | OAuth2 | Client ID, Client Secret, conta conectada |
| `google-calendar` | Google Agenda | google | via Conta Google | Calendários que aparecem no sistema |
| `gmail` | Gmail | google | via Conta Google | Filtro de importância, remetentes VIP, quantos dias olhar |
| `ollama` | IA local (Ollama) | ia | local | URL (padrão `http://localhost:11434`); modelo escolhido da lista retornada por `/api/tags` |

**Em breve (aparecem como cards com o selo EM BREVE, para o usuário ver o que vem por aí):**

- Supabase: sincronização na nuvem (Fase 3).
- Google Drive: backup automático do banco.
- Telegram: notificações e lembretes no celular.
- Spotify: tocar playlists.
- Google Fit ou relógio: passos e sono.
- Cotações (dólar, euro, bitcoin), para o módulo de finanças.
- IA na nuvem (Claude ou outra): PAGO e opcional.

### Configuração do Google (guia dentro do card "Conta Google")

Esse guia deve aparecer na própria interface, passo a passo:

1. Acessar o Google Cloud Console e criar um projeto chamado "Polaris".
2. Ativar a **Google Calendar API** e a **Gmail API**.
3. Configurar a tela de consentimento OAuth:
   - tipo **Externo**;
   - status **Teste**;
   - adicionar o próprio e-mail como usuário de teste.
4. Criar uma credencial **ID do cliente OAuth** do tipo "Aplicativo da Web", com o URI de redirecionamento `http://localhost:3001/api/integrations/google/callback`.
5. Colar o Client ID e o Client Secret no Polaris e clicar em "Conectar".

Detalhes de implementação:

- **Escopos iniciais (só leitura):** `calendar.readonly` e `gmail.readonly`.
- **Aviso na interface:** em modo de teste, o Google expira o acesso a cada 7 dias. Quando isso acontecer, o status vira **RECONECTAR** e basta um clique para renovar. Trate esse caso sem quebrar nada.

---

## 8. Módulos

### 8.1 Painel — "Briefing do dia" (`/`)

A tela inicial. Mostra tudo o que importa hoje, num relance:

- **Saudação por horário:** "Bom dia, [nome]", com data por extenso.
- **Núcleo Polaris no centro**, com a frase-resumo do dia. Sem IA, a frase é montada por modelo de texto. Com IA, ela escreve o briefing.
- **Cards:**
  - **Clima:** temperatura atual, condição, mínima, máxima, sensação e alerta de chuva.
  - **Agenda hoje:** próximo compromisso com contagem regressiva e lista do dia. Se não houver nada, mostra o estado "Agenda livre".
  - **E-mails importantes:** quantidade e os 3 principais.
  - **Radar de notícias:** um destaque com imagem e uma lista curta.
  - **Leitura atual:** capa, barra de progresso e botão "+ páginas".
  - **Treino de hoje:** ficha planejada e botão "Iniciar treino".
  - **Hábitos de hoje:** checklist rápido.
  - **Tarefas e lembretes do dia.**
  - **Relembrar:** 2 anotações antigas de livros escolhidas ao acaso (revisão espaçada simples).
- **Alertas no topo quando houver**, por exemplo:
  - "Vai chover às 16h."
  - "Reunião em 20 minutos."
  - "3 e-mails urgentes."
- **Canal Polaris:** painel de conversa por texto com a IA (ativo depois da Etapa 9).

### 8.2 Agenda (`/agenda`)

- Visões de hoje e da semana, com eventos do Google Agenda.
- Próximo compromisso em destaque.
- Mostra também os lembretes locais do Polaris.
- No começo é só leitura. Criar eventos fica para o futuro.

### 8.3 E-mail (`/email`)

- Lista dos e-mails importantes.
  - Filtro padrão: não lidos dos últimos 3 dias, marcados como importantes ou na caixa principal.
  - Remetentes VIP sempre aparecem.
- **Triagem:** Urgente, Responder, Pode esperar e Ignorar.
  - Primeiro por regras simples.
  - Depois pela IA, se o Ollama estiver conectado.
  - O usuário pode corrigir a classificação.
- Para cada e-mail: remetente, assunto, prévia e o botão "Abrir no Gmail".
- Só leitura. Rascunhar respostas fica para o futuro.

### 8.4 Notícias (`/noticias`)

- Feeds RSS organizados por categoria (Brasil, Tecnologia, IA, Economia...), configurados em Integrações.
- Junta os feeds, remove notícias duplicadas, mostra imagem quando houver e destaca a mais recente.
- Filtro por palavra-chave, "salvar para ler depois" e "marcar como lida".
- Use alguns feeds brasileiros conhecidos como sugestão inicial no seed. Valide se ainda funcionam antes de incluir.

### 8.5 Clima (`/clima`)

- Agora: temperatura, sensação, umidade, vento e chance de chuva.
- Gráfico das próximas 24 horas e previsão de 7 dias.
- Ícones e descrições em pt-BR mapeados a partir dos códigos WMO do Open-Meteo.
- Alertas simples (chuva nas próximas horas, calor acima de 32°, frio abaixo de 10°), que também aparecem no Painel.

### 8.6 Biblioteca (`/biblioteca`) — módulo diferencial

- **Estante:** status Quero ler, Lendo, Lido e Abandonado, com visual de capas.
- **Adicionar livro:** busca na Open Library por título, autor ou ISBN, que preenche capa, páginas e assuntos. Também é possível cadastrar à mão.
- **Progresso:**
  - página atual e porcentagem;
  - registro de sessões de leitura (data e páginas lidas);
  - páginas por dia e sequência de dias lendo.
- **Meta anual** de livros, com barra de progresso.
- **Anotações por livro:**
  - campos de capítulo ou página;
  - tipo: ideia, citação, dúvida ou aplicação prática;
  - tags e editor de texto simples.
- **"Minhas ideias sobre o livro":** com a IA conectada, um botão gera um resumo das **ideias do usuário** a partir das anotações dele (não um resumo do livro). O resumo é salvo com data e pode ser editado.
- **Recomendações:**
  - **Sem IA:** usa os assuntos dos livros com nota 4 ou 5 para buscar sugestões na Open Library, excluindo os que já estão na estante.
  - **Com IA:** cada sugestão vem com o motivo ("porque você gostou de X e anotou muito sobre Y").
  - Botão "Adicionar à estante".
- Avaliação de 1 a 5 estrelas e datas de início e fim.
- **Estatísticas:** livros por ano, páginas lidas, gêneros e autores mais lidos.

### 8.7 Academia (`/academia`)

- **Catálogo de exercícios** com grupo muscular e equipamento. O seed traz os exercícios mais comuns em português.
- **Fichas de treino** (A, B, C...):
  - exercícios na ordem;
  - séries e repetições alvo;
  - dias da semana planejados.
- **Sessão de treino:**
  - "Iniciar treino" abre a ficha do dia;
  - registra cada série (carga em kg, repetições, feita ou não);
  - cronômetro de descanso configurável e notas;
  - ao finalizar, mostra duração e volume total.
- **Histórico:** calendário de treinos e lista de sessões.
- **Evolução:**
  - gráfico por exercício (carga máxima, volume, 1RM estimado pela fórmula de Epley);
  - **recordes pessoais** destacados com um efeito de brilho.
- **Peso corporal e medidas (opcional),** com gráfico.

### 8.8 Notas — segundo cérebro (`/notas`)

- Captura rápida pelo botão "+" ou pelo Ctrl+K: o usuário solta a ideia e ela fica salva.
- Tags, notas fixadas e busca de texto completo (SQLite FTS5, isolado no repositório).
- Ligação opcional com um livro ou uma tarefa.

### 8.9 Tarefas e lembretes (`/tarefas`)

- **Tarefas:** prioridade (alta, média, baixa), prazo e status.
- **Lembretes:** data e hora, com notificação do navegador e toast no sistema. Recorrência simples (diária, semanal).

### 8.10 Hábitos (`/habitos`)

- Lista configurável (água, leitura, treino, sono, meditação...).
- Check diário, sequência de dias e mapa de calor anual.
- **Marcação automática:**
  - registrar um treino marca o hábito "Treino";
  - registrar leitura marca o hábito "Leitura".

### 8.11 Integrações (`/integracoes`)

Ver a seção 7.

### 8.12 Configurações (`/configuracoes`)

- **Perfil:** nome, como a Polaris chama o usuário e cidade (atalho para o Open-Meteo).
- **Aparência:** intensidade do brilho, animações ligadas ou desligadas, reduzir movimento.
- **Backup:**
  - "Fazer backup agora";
  - backup automático diário no primeiro uso do dia, mantendo os últimos 14;
  - exportar e importar tudo em JSON.
- **Acesso pelo celular:**
  - interruptor do modo rede local, com definição de PIN;
  - mostra o endereço `http://IP-DO-PC:3001` e um QR code para abrir no celular.
- **Sobre:** versão do sistema e status do banco.

---

## 9. Banco de dados (modelo inicial)

Este é o ponto de partida. O Claude Code pode ajustar, desde que siga as regras de portabilidade da seção 5.

- **Sistema:** `settings`, `integrations`, `integration_logs`, `cache_entries`
- **Biblioteca:** `books`, `reading_sessions`, `book_notes`, `book_idea_summaries`, `reading_goals`, `book_recommendations`
- **Academia:**
  - `exercises`, `workout_routines`, `routine_exercises`;
  - `workout_sessions`, `workout_sets`;
  - `personal_records`, `body_measurements`.
- **Produtividade:** `notes` (+ índice FTS), `tasks`, `reminders`, `habits`, `habit_logs`
- **Notícias e e-mail:**
  - `news_feeds`, `saved_articles`, `read_articles`;
  - `email_triage` (ID da mensagem do Gmail + classificação);
  - `vip_senders`.
- **IA:** `ai_conversations`, `ai_messages`

Todas as tabelas têm `id` (UUID em texto), `created_at` e `updated_at` (ISO 8601).

---

## 10. Roteiro em etapas

**Regra de ouro:** uma etapa por vez. Ao terminar cada uma:

1. Rodar `npm run typecheck`, `npm run lint` e `npm run build`, e corrigir o que falhar.
2. Fazer um commit no git com mensagem em português (ex.: `etapa 3: hub de integrações`).
3. Marcar a etapa na seção 12 (Progresso).
4. Explicar ao usuário, em linguagem simples, o que foi feito, como rodar e o que testar.
5. **Parar e aguardar** o usuário pedir a próxima etapa.

### Etapa 0 — Fundação

- Verificar se o Node.js (versão LTS, 22 ou mais, exigida pelo better-sqlite3) e o Git estão instalados. Se não estiverem, explicar como instalar.
- `git init`, monorepo com workspaces `client`, `server` e `shared`, TypeScript strict, ESLint e Prettier.
- Scripts da seção 5, `.gitignore`, `.env.example` e geração automática do `POLARIS_SECRET` no primeiro start.
- `README.md` curto em pt-BR explicando como rodar.
- **Pronto quando:** `npm run dev` abre uma página "Polaris online" e `GET /api/health` responde `ok`.

### Etapa 1 — Visual e esqueleto

- Design system completo da seção 6: tokens, fontes, fundo com grade e estrelas.
- Componentes: `PolarisCard`, `Badge`, `StatusDot`, `Button`, `Input`, `Drawer`, `Tabs`, `EmptyState`, `Skeleton`, `Toast` e `CommandPalette` (ainda vazia).
- Layout com `TopBar` (relógio ao vivo), `Sidebar`, `MobileNav` e o `NucleoPolaris` animado.
- Rotas com páginas provisórias para todos os módulos, e o Painel com cards de dados fictícios mostrando o visual final.
- **Pronto quando:** é possível navegar por tudo, o visual está futurista e funciona bem no celular (testar com o DevTools em modo celular).

### Etapa 2 — Banco de dados

- Drizzle + better-sqlite3, schema da seção 9, migrações e camada de repositórios.
- Seed: exercícios comuns, feeds sugeridos, hábitos padrão e perfil.
- Backup manual e diário, exportar e importar JSON, e a tela de Configurações (perfil e backup).
- **Pronto quando:** os dados do perfil salvam, sobrevivem a reiniciar o app e o backup gera um arquivo em `backups/`.

### Etapa 3 — Hub de Integrações

- Contrato, registry, `integrationService`, criptografia, cache, logs, agendador e endpoints da seção 7.
- Página Integrações completa: categorias, filtros, cards, gaveta de configuração gerada do schema, testar, sincronizar, logs, mapa de conexões e cards EM BREVE.
- Primeiras integrações: **Open-Meteo**, **RSS** e **Open Library**.
- **Pronto quando:** dá para configurar a cidade, testar a conexão, ver o status CONECTADO e o log, e desativar e reativar.

### Etapa 4 — Academia

- Todo o módulo 8.7 e o card "Treino de hoje" no Painel.

### Etapa 5 — Biblioteca (sem IA)

- Todo o módulo 8.6, exceto as partes que usam IA.
- Recomendações pela Open Library, card "Leitura atual" e card "Relembrar" no Painel.

### Etapa 6 — Clima e Notícias

- Módulos 8.4 e 8.5, os cards no Painel e os alertas de clima.

### Etapa 7 — Notas, tarefas, lembretes e hábitos

- Módulos 8.8, 8.9 e 8.10, com a paleta Ctrl+K funcionando (busca global e ações rápidas).

### Etapa 8 — Google (Agenda e Gmail)

- Conta Google com OAuth no hub, com o guia passo a passo na interface.
- Integrações Google Agenda e Gmail, módulos 8.2 e 8.3 (triagem por regras) e os cards no Painel.
- Tratamento do status RECONECTAR.

### Etapa 9 — IA local (Ollama)

- Integração `ollama` no hub: testa a URL e lista os modelos instalados para o usuário escolher.
- **Canal Polaris:** chat por texto com personalidade.
  - Responde em pt-BR, é prestativa e direta, e chama o usuário pelo nome.
  - Recebe como contexto o briefing do dia (agenda, clima, e-mails, leitura, treino) para responder coisas como "como está meu dia?".
  - O histórico fica salvo.
- Resumo das ideias dos livros, recomendações explicadas, triagem de e-mail por IA e frase de briefing no Núcleo.
- **Tudo opcional:** sem Ollama, esses recursos mostram "Conecte a IA em Integrações".

### Etapa 10 — Painel final, PWA e celular

- Painel "Briefing do dia" completo e polido, com animações e alertas.
- PWA com `vite-plugin-pwa` (nome, ícones da estrela, `theme_color #030814`), instalável no PC pelo Chrome.
- Modo rede local com PIN e QR code (seção 8.12).
- Ao explicar ao usuário, deixe claro: no celular, pelo IP local (http), o app funciona no navegador e pode virar um atalho na tela inicial. A instalação completa como app e o modo offline no celular exigem HTTPS, o que vem na Fase 3 ou com uma ferramenta como o Tailscale.
- **Pronto quando:** o celular na mesma rede Wi-Fi abre o Polaris pelo QR code, pede o PIN e mostra o Painel.

### Etapa 11 (futuro) — Web com Supabase + Netlify

- Trocar os repositórios para o Supabase (Postgres, Auth e RLS por usuário).
- Script de migração dos dados do SQLite para o Supabase.
- Front no Netlify. Os services do servidor viram Netlify Functions ou Supabase Edge Functions.
- Atualizar o redirect do OAuth do Google para a nova URL.
- Avisar o usuário: no plano grátis do Supabase, o projeto é pausado depois de uma semana sem uso.

### Etapa 12 (futuro) — Voz (Jarvis)

- Web Speech API em pt-BR: reconhecimento de fala e voz sintetizada.
- Palavra de ativação "Polaris". O Núcleo usa os estados `ouvindo`, `processando` e `falando`, reagindo ao áudio.
- Comandos como:
  - "Polaris, como está meu dia?"
  - "Anota uma ideia sobre o livro X."
  - "Registra 30 páginas lidas."
  - "Lê meus e-mails importantes."

---

## 11. Ideias futuras (backlog)

- **Finanças:** contas a vencer, gastos do mês, cotações do dólar e do bitcoin.
- **Resumo semanal:** "nesta semana você leu 120 páginas, treinou 4 vezes e teve 8 compromissos".
- **Modo foco:** Pomodoro com som ambiente, escondendo tudo menos o essencial.
- **Proatividade:** a Polaris avisa sozinha quando algo importante acontece.
- **E-mail:** rascunhar respostas para o usuário aprovar.
- **Agenda:** criar eventos.
- **Novas integrações:** Spotify, relógio ou Google Fit, Telegram, Google Drive (backup), casa inteligente.
- **Modos de personalidade da Polaris:** formal, amiga, mentora.
- **Revisão espaçada avançada** das anotações, no estilo flashcards.

---

## 12. Progresso

- [x] Etapa 0 — Fundação
- [x] Etapa 1 — Visual e esqueleto
- [x] Etapa 2 — Banco de dados
- [x] Etapa 3 — Hub de Integrações
- [x] Etapa 4 — Academia
- [x] Etapa 5 — Biblioteca
- [x] Etapa 6 — Clima e Notícias
- [ ] Etapa 7 — Notas, tarefas, lembretes e hábitos
- [ ] Etapa 8 — Google (Agenda e Gmail)
- [ ] Etapa 9 — IA local (Ollama)
- [ ] Etapa 10 — Painel final, PWA e celular
- [ ] Etapa 11 — Web (Supabase + Netlify)
- [ ] Etapa 12 — Voz (Jarvis)

---

## 13. Regras de trabalho para o Claude Code

- Siga este arquivo como fonte da verdade. Se algo aqui estiver errado ou desatualizado (uma biblioteca mudou, um feed saiu do ar), avise o usuário e proponha o ajuste antes de seguir.
- Nunca apague dados do usuário. Antes de uma migração que altere tabelas existentes, faça um backup automático.
- Nunca coloque segredos no código nem no git.
- Prefira soluções simples e legíveis. O usuário precisa conseguir entender e manter o projeto.
- Mantenha o visual consistente com a seção 6 em toda tela nova.
- Quando o usuário pedir algo fora do roteiro, encaixe na etapa certa ou adicione ao backlog, e atualize este arquivo.
