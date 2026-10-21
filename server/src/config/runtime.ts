// Valores definidos no start do servidor e usados em outros pontos.

let clientOrigin = '';

/** Endereço da interface: em desenvolvimento é o Vite (5173); em produção, o próprio servidor. */
export function setClientOrigin(origin: string) {
  clientOrigin = origin;
}
export const getClientOrigin = () => clientOrigin;
