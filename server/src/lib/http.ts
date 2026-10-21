import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';

/** Erro com código HTTP e mensagem amigável em pt-BR. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (message = 'Não encontrado.') => new HttpError(404, 'NOT_FOUND', message);
export const badRequest = (message: string) => new HttpError(400, 'BAD_REQUEST', message);

/** Valida dados de entrada com zod. Se falhar, gera um erro 400 com a primeira mensagem. */
export function parseInput<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join('.')}: ` : '';
    throw badRequest(`Dados inválidos. ${where}${issue?.message ?? ''}`.trim());
  }
  return result.data;
}

/** Responde 404 em JSON para rotas /api que não existem. */
export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota da API não encontrada.' } });
};

/** Tratamento central de erros: sempre responde JSON no formato { error: { code, message } }. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Dados inválidos.' } });
    return;
  }
  console.error('❌ Erro inesperado:', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Algo deu errado no servidor.' } });
};
