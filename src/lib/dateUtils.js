/**
 * Utilitário de formatação de datas para exibição em Cuiabá (UTC-4 / America/Cuiaba).
 * 
 * REGRA: dados são gravados em UTC. A conversão para o fuso de Cuiabá
 * acontece APENAS na exibição — nunca na gravação ou cálculo de prazos.
 */

const CUIABA_OFFSET_HOURS = -4; // UTC-4 (sem horário de verão)

/**
 * Converte uma string ISO (UTC) para um objeto Date ajustado para Cuiabá (UTC-4).
 * @param {string|Date} value - string ISO ou Date
 * @returns {Date|null}
 */
export function toDateBRT(value) {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return null;
  // Desloca o Date object para UTC-4
  return new Date(d.getTime() + CUIABA_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Formata uma string ISO (UTC) como data local de Cuiabá (UTC-4).
 * @param {string|Date} value 
 * @param {string} fmt - formato: 'date' = dd/MM/yyyy | 'datetime' = dd/MM/yyyy HH:mm | 'long' = dd 'de' MMM 'de' yyyy
 * @returns {string}
 */
export function formatBRT(value, fmt = 'date') {
  const d = toDateBRT(value);
  if (!d) return '—';

  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getUTCDate());
  const month = pad(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());

  const MONTHS_PT = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ];

  switch (fmt) {
    case 'datetime':
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    case 'long':
      return `${day} de ${MONTHS_PT[d.getUTCMonth()]} de ${year}`;
    case 'date':
    default:
      return `${day}/${month}/${year}`;
  }
}