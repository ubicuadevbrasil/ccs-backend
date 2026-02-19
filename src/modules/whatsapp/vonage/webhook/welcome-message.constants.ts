/**
 * Holiday date range for welcome message variation.
 * When current date falls within this range, the holiday message is sent.
 * Reused from Otima for consistent behaviour.
 */
export const HOLIDAY_DATE_RANGE = {
  start: new Date('2026-02-14T00:00:00.000Z'),
  end: new Date('2026-02-17T23:59:59.999Z'),
} as const;

/** Default welcome message (non-holiday) */
export const DEFAULT_WELCOME_MESSAGE =
  'Bem vindo ao Canal de atendimento do Lar de Maria, seu contato é muito importante para nós. Nosso horário de atendimento é de Segunda a Sexta das 8:30 as 18:30 e aos Sábados das 9:00 as 15:00';

/** Holiday-specific welcome message */
export const HOLIDAY_WELCOME_MESSAGE =
  'Olá, somos o *Lar de Maria* ❤️\n\nInformamos que nos dias 14 a 17/02/2026 (Feriado), não haverá atendimento no 0800. Voltaremos ao expediente dia 18/02/2026.\n\nAgradecemos a compreensão ✨\n\nO *Lar de Maria* agradece seu contato☺️';
