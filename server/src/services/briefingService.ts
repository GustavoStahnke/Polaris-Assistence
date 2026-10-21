import { describeWeather, displayName, toDateKey, type Briefing } from '@polaris/shared';
import { getAgenda } from './agendaService';
import { getEmails } from './emailService';
import { getToday as getWorkoutToday } from './gymService';
import { listHabits } from './habitService';
import { getCurrentReading } from './libraryService';
import { getTodayAgenda } from './productivityService';
import { getProfile } from './settingsService';
import { getWeatherReport } from './weatherService';
import { formatHour } from './textFormat';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Coleta o dia inteiro. Cada fonte é independente: se uma falhar, as outras seguem. */
async function collectDay(now: Date) {
  const [weather, agenda, emails] = await Promise.allSettled([
    getWeatherReport(),
    getAgenda('hoje', now),
    getEmails(),
  ]);
  const safe = <T>(fn: () => T): T | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  return {
    profile: getProfile(),
    weather: weather.status === 'fulfilled' ? weather.value : null,
    agenda: agenda.status === 'fulfilled' ? agenda.value : null,
    emails: emails.status === 'fulfilled' ? emails.value : null,
    reading: safe(() => getCurrentReading()),
    workout: safe(() => getWorkoutToday(now)),
    habits: safe(() => listHabits(now)),
    tasks: safe(() => getTodayAgenda(now)),
  };
}

/** Frase-resumo do Núcleo, montada por modelo de texto (sem IA). */
export async function getBriefing(now: Date = new Date()): Promise<Briefing> {
  const day = await collectDay(now);
  const parts: Briefing['parts'] = [];

  const upcoming = day.agenda?.items.filter((i) => i.allDay || new Date(i.start) >= now) ?? [];
  if (day.agenda && day.agenda.state !== 'not_configured' && day.agenda.state !== 'disabled') {
    parts.push({
      key: 'agenda',
      label: upcoming.length ? plural(upcoming.length, 'compromisso', 'compromissos') : 'agenda livre',
      to: '/agenda',
    });
  }
  const important = day.emails?.emails.filter((e) => e.category !== 'ignorar').length ?? 0;
  if (day.emails && day.emails.state !== 'not_configured' && day.emails.state !== 'disabled') {
    parts.push({
      key: 'email',
      label: important ? plural(important, 'e-mail importante', 'e-mails importantes') : 'caixa em dia',
      to: '/email',
    });
  }
  const weather = day.weather?.weather;
  if (weather) {
    const short = describeWeather(weather.current.weatherCode, weather.current.isDay).short;
    parts.push({
      key: 'clima',
      label: `${Math.round(weather.current.temperature)}° ${short}`.trim(),
      to: '/clima',
    });
  }
  const tasks = day.tasks?.tasks.length ?? 0;
  if (tasks) parts.push({ key: 'tarefas', label: plural(tasks, 'tarefa', 'tarefas'), to: '/tarefas' });
  if (day.workout?.planned.length && !day.workout.doneToday)
    parts.push({ key: 'treino', label: `treino: ${day.workout.planned[0]!.name}`, to: '/academia' });

  return {
    sentence: parts.length
      ? parts.map((p) => p.label).join(' · ')
      : 'Um dia em branco: hora de definir o que importa.',
    greetingName: displayName(day.profile),
    parts,
  };
}

/** O dia em texto corrido, para dar contexto à IA (Canal Polaris e frase do briefing). */
export async function getBriefingContext(now: Date = new Date()): Promise<string> {
  const day = await collectDay(now);
  const lines: string[] = [];
  const name = displayName(day.profile) || 'usuário';
  lines.push(`Nome do usuário: ${name}${day.profile.city ? ` (mora em ${day.profile.city})` : ''}.`);
  lines.push(
    `Agora: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(now)}.`,
  );

  const weather = day.weather?.weather;
  if (weather) {
    const info = describeWeather(weather.current.weatherCode, weather.current.isDay);
    lines.push(
      `Clima em ${weather.location.name}: ${Math.round(weather.current.temperature)}°, ${info.label.toLowerCase()}, mínima ${Math.round(weather.today.min)}° e máxima ${Math.round(weather.today.max)}°, chance de chuva ${weather.today.precipitationProbability}%.`,
    );
    for (const alert of day.weather?.alerts ?? []) lines.push(`Alerta de clima: ${alert.message}`);
  } else lines.push('Clima: indisponível (Open-Meteo não configurado ou sem internet).');

  if (day.agenda?.state === 'not_configured' || day.agenda?.state === 'disabled')
    lines.push('Agenda: Google Agenda não conectado.');
  else if (day.agenda) {
    if (day.agenda.items.length === 0) lines.push('Agenda de hoje: livre.');
    for (const item of day.agenda.items) {
      lines.push(
        `Agenda: ${item.allDay ? 'dia inteiro' : formatHour(item.start)} - ${item.title}${item.location ? ` (${item.location})` : ''}${item.source === 'lembrete' ? ' [lembrete]' : ''}.`,
      );
    }
  }

  if (day.emails?.state === 'not_configured' || day.emails?.state === 'disabled')
    lines.push('E-mail: Gmail não conectado.');
  else if (day.emails) {
    const c = day.emails.counts;
    lines.push(
      `E-mails: ${c.urgente} urgentes, ${c.responder} para responder, ${c.pode_esperar} podem esperar.`,
    );
    for (const e of day.emails.emails
      .filter((x) => x.category === 'urgente' || x.category === 'responder')
      .slice(0, 5)) {
      lines.push(`E-mail (${e.category}): de ${e.fromName} - "${e.subject}".`);
    }
  }

  for (const book of day.reading ?? []) {
    lines.push(
      `Leitura atual: "${book.title}" de ${book.authors.join(', ') || 'autor desconhecido'}, página ${book.currentPage}${book.pageCount ? ` de ${book.pageCount}` : ''} (${book.progress}%).`,
    );
  }
  if (day.workout) {
    if (day.workout.doneToday) lines.push(`Treino: já treinou hoje (${day.workout.doneToday.routineName}).`);
    else if (day.workout.planned.length)
      lines.push(`Treino planejado para hoje: ${day.workout.planned.map((r) => r.name).join(', ')}.`);
    else lines.push('Treino: nenhum planejado para hoje (dia de descanso).');
  }
  if (day.habits?.length) {
    const done = day.habits.filter((h) => h.doneToday).map((h) => h.name);
    const pending = day.habits.filter((h) => !h.doneToday).map((h) => h.name);
    lines.push(
      `Hábitos feitos hoje: ${done.join(', ') || 'nenhum'}. Pendentes: ${pending.join(', ') || 'nenhum'}.`,
    );
  }
  if (day.tasks) {
    for (const t of day.tasks.tasks) {
      lines.push(
        `Tarefa${t.dueDate && t.dueDate < toDateKey(now) ? ' ATRASADA' : ''}: ${t.title} (prioridade ${t.priority}).`,
      );
    }
    for (const r of day.tasks.reminders)
      lines.push(`Lembrete hoje às ${formatHour(r.remindAt)}: ${r.title}.`);
  }
  return lines.join('\n');
}
