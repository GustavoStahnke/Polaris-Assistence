// Formatação de datas para textos gerados no servidor (fuso do computador do usuário).

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** "21/10, 14:30" */
export const formatInTimeZone = (iso: string) => dateTime.format(new Date(iso));

/** "14:30" */
export const formatHour = (iso: string) => time.format(new Date(iso));
