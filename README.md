# Polaris Assistence

Sistema pessoal tudo-em-um: agenda, e-mail, notícias, clima, livros, treino, notas, tarefas e hábitos num painel só. Roda 100% no seu computador, com banco SQLite e custo zero.

## Requisitos

- [Node.js](https://nodejs.org) **22 ou mais** (versão LTS)
- [Git](https://git-scm.com)

## Primeiros passos

```bash
npm install      # instala tudo (só na primeira vez ou quando mudar dependências)
npm run dev      # abre o sistema em modo desenvolvimento
```

Depois abra **http://localhost:5173** no navegador.

No primeiro start, o arquivo `.env` é criado sozinho com a chave `POLARIS_SECRET`, que criptografa suas credenciais. **Não apague nem compartilhe esse arquivo.**

## Comandos

| Comando              | O que faz                                       |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Sobe o client (5173) e o servidor (3001) juntos |
| `npm run build`      | Checa os tipos e gera a versão final            |
| `npm start`          | Roda a versão final em http://localhost:3001    |
| `npm run db:migrate` | Aplica as migrações do banco                    |
| `npm run db:studio`  | Abre o visualizador do banco                    |
| `npm run backup`     | Copia o banco para `backups/`                   |
| `npm run typecheck`  | Checa os tipos                                  |
| `npm run lint`       | Checa o estilo do código                        |
| `npm run format`     | Formata o código com o Prettier                 |

## Estrutura

- `client/`: interface (React + Vite)
- `server/`: servidor (Express + SQLite)
- `shared/`: tipos, schemas e configurações usados pelos dois lados
- `data/`: seu banco de dados (fica fora do git)
- `backups/`: cópias do banco (fica fora do git)

A especificação completa e o roteiro estão em [CLAUDE.md](CLAUDE.md).
