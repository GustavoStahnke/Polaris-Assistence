# Polaris Assistence

Sistema pessoal tudo-em-um: agenda, e-mail, notícias, clima, livros, treino, notas, tarefas e hábitos num painel só, com uma assistente (a Polaris) que conhece o seu dia. Roda 100% no seu computador, com banco SQLite e custo zero.

## Requisitos

- [Node.js](https://nodejs.org) **22 ou mais** (versão LTS)
- [Git](https://git-scm.com)
- Opcional: [Ollama](https://ollama.com) para a IA local

## Primeiros passos

```bash
npm install      # instala tudo (só na primeira vez ou quando mudar dependências)
npm run dev      # abre o sistema em modo desenvolvimento
```

Depois abra **http://localhost:5173** no navegador.

No primeiro start, o Polaris:

- cria o arquivo `.env` com a chave `POLARIS_SECRET`, que criptografa suas credenciais (**não apague nem compartilhe esse arquivo**);
- cria o banco em `data/polaris.db` com exercícios, hábitos e feeds de notícias sugeridos;
- faz o primeiro backup automático em `backups/`.

## Comandos

| Comando               | O que faz                                       |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Sobe o client (5173) e o servidor (3001) juntos |
| `npm run build`       | Checa os tipos e gera a versão final            |
| `npm start`           | Roda a versão final em http://localhost:3001    |
| `npm run db:migrate`  | Aplica as migrações do banco (faz backup antes) |
| `npm run db:generate` | Gera uma migração nova depois de mudar o schema |
| `npm run db:studio`   | Abre o visualizador do banco                    |
| `npm run backup`      | Copia o banco para `backups/`                   |
| `npm run typecheck`   | Checa os tipos                                  |
| `npm run lint`        | Checa o estilo do código                        |
| `npm run format`      | Formata o código com o Prettier                 |

## Primeiras configurações (dentro do app)

1. **Configurações › Perfil:** seu nome e como a Polaris deve te chamar.
2. **Integrações › Open-Meteo:** escolha sua cidade para ver o clima.
3. **Integrações › Feeds de notícias:** ative, remova ou adicione feeds RSS.
4. **Integrações › Conta Google** (opcional): siga o guia passo a passo da própria tela para ligar Agenda e Gmail (somente leitura). Em modo de teste, o Google expira o acesso a cada 7 dias; quando aparecer **RECONECTAR**, é só clicar.
5. **Integrações › IA local (Ollama)** (opcional): instale o Ollama, rode `ollama pull llama3.2:3b`, escolha o modelo e salve. Isso liga o Canal Polaris, o resumo das suas ideias sobre os livros, os motivos das recomendações, a triagem de e-mail por IA e a frase do briefing.

Atalhos: **Ctrl+K** (ou Cmd+K) abre a busca global e as ações rápidas; o botão **+** captura uma nota de qualquer tela.

## Usar no celular (mesma rede Wi-Fi)

1. Gere e rode a versão final: `npm run build` e depois `npm start`.
2. No computador, abra **Configurações › Celular**, defina um **PIN** e ligue o **modo rede local**.
3. No celular, leia o **QR code** (ou digite o endereço `http://IP-DO-PC:3001`) e digite o PIN.

Bom saber:

- Pelo endereço local (http), o Polaris funciona no navegador do celular e pode virar um atalho na tela inicial.
- A instalação completa como app e o modo offline no celular exigem HTTPS. Isso vem na Fase 3 (web) ou com uma ferramenta como o Tailscale.
- No computador, o Chrome já permite instalar o Polaris como app (ícone de instalar na barra de endereço).
- Se o celular não abrir, verifique se o firewall do computador permite conexões do Node.js.

## Backup e seus dados

- Tudo fica no seu computador: `data/polaris.db` (banco) e `data/covers/` (capas dos livros).
- Backup automático diário (mantém os últimos 14) e antes de qualquer migração ou importação.
- Em **Configurações › Backup** dá para fazer backup na hora, exportar tudo em JSON e importar de volta.

## Estrutura

- `client/`: interface (React + Vite + Tailwind)
- `server/`: servidor (Express + SQLite + Drizzle), com o Hub de Integrações em `server/src/integrations`
- `shared/`: tipos, schemas e configurações usados pelos dois lados
- `data/` e `backups/`: seus dados (ficam fora do git)

A especificação completa e o roteiro estão em [CLAUDE.md](CLAUDE.md).
