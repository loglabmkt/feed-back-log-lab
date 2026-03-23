/**
 * ADMIN DASHBOARD — Motor de métricas do painel administrativo
 *
 * Regras de vencimento:
 * - data prevista == hoje → NÃO vencido
 * - data prevista < hoje  → VENCIDO
 *
 * Offsets de rituais únicos:
 * - experience_45d: +45 dias da âncora
 * - experience_90d: +90 dias da âncora
 *
 * Intervalos de rituais recorrentes:
 * - evaluation  (Trimestral): 90 dias
 * - one_on_one  (1:1):        60 dias
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const UNIQUE_OFFSETS = { experience_45d: 45, experience_90d: 90 };
const RECURRENT_INTERVALS = { evaluation: 90, one_on_one: 60 };
const ALL_RITUAL_TYPES = ['experience_45d', 'experience_90d', 'evaluation', 'one_on_one'];
const ALERT_DAYS = 10;

// ---------- helpers ----------

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Retorna a data âncora do colaborador para o tipo de ritual.
 */
function getAnchor(colab, ritualType) {
  if (ritualType === 'experience_45d') {
    const d = colab.ritual_45d_use_admission === false && colab.ritual_45d_custom_start
      ? colab.ritual_45d_custom_start : colab.admission_date;
    return d ? new Date(d) : null;
  }
  if (ritualType === 'experience_90d') {
    const d = colab.ritual_90d_use_admission === false && colab.ritual_90d_custom_start
      ? colab.ritual_90d_custom_start : colab.admission_date;
    return d ? new Date(d) : null;
  }
  if (ritualType === 'evaluation') {
    const d = colab.ritual_trimestral_use_admission === false && colab.ritual_trimestral_custom_start
      ? colab.ritual_trimestral_custom_start : colab.admission_date;
    return d ? new Date(d) : null;
  }
  if (ritualType === 'one_on_one') {
    const d = colab.ritual_1on1_use_admission === false && colab.ritual_1on1_custom_start
      ? colab.ritual_1on1_custom_start : colab.admission_date;
    return d ? new Date(d) : null;
  }
  return null;
}

/**
 * Verifica se o ritual único foi concluído e quando.
 * Retorna { done: bool, conclusionDate, isLegacy }
 */
function getUniqueConclusion(colab, ritualType, records) {
  if (ritualType === 'experience_45d' && colab.ritual_45d_completed_manual) {
    return { done: true, conclusionDate: null, isLegacy: true };
  }
  if (ritualType === 'experience_90d' && colab.ritual_90d_completed_manual) {
    return { done: true, conclusionDate: null, isLegacy: true };
  }
  const rec = records.find(r =>
    r.employee_id === colab.id &&
    r.feedback_type === ritualType &&
    r.workflow_status === 'ASSINADO_COLABORADOR'
  );
  if (rec) {
    return {
      done: true,
      conclusionDate: new Date(rec.employee_validation_date || rec.updated_date || rec.feedback_date),
      isLegacy: false
    };
  }
  return { done: false, conclusionDate: null, isLegacy: false };
}

/**
 * Calcula o status de um ritual para um colaborador.
 * Retorna { status, dueDate, conclusionDate, daysUntilDue }
 * status: CONCLUIDO_NO_PRAZO | CONCLUIDO_COM_ATRASO | ISENTO_LEGACY | ATRASADO | PENDENTE | EM_RISCO | SEM_ANCHOR
 */
function calcStatus(colab, ritualType, records, today) {
  const isUnique = ritualType in UNIQUE_OFFSETS;

  if (isUnique) {
    const conc = getUniqueConclusion(colab, ritualType, records);
    if (conc.isLegacy) return { status: 'ISENTO_LEGACY', dueDate: null, conclusionDate: null, daysUntilDue: null };

    const anchor = getAnchor(colab, ritualType);
    if (!anchor) return { status: 'SEM_ANCHOR', dueDate: null, conclusionDate: null, daysUntilDue: null };

    const dueDate = toDateOnly(addDays(anchor, UNIQUE_OFFSETS[ritualType]));
    const daysUntilDue = Math.round((dueDate - today) / 86400000);

    if (conc.done && conc.conclusionDate) {
      const onTime = toDateOnly(conc.conclusionDate) <= dueDate;
      return { status: onTime ? 'CONCLUIDO_NO_PRAZO' : 'CONCLUIDO_COM_ATRASO', dueDate, conclusionDate: conc.conclusionDate, daysUntilDue };
    }

    if (daysUntilDue < 0) return { status: 'ATRASADO', dueDate, conclusionDate: null, daysUntilDue };
    if (daysUntilDue <= ALERT_DAYS) return { status: 'EM_RISCO', dueDate, conclusionDate: null, daysUntilDue };
    return { status: 'PENDENTE', dueDate, conclusionDate: null, daysUntilDue };
  }

  // Recorrente
  const interval = RECURRENT_INTERVALS[ritualType];
  const anchor = getAnchor(colab, ritualType);
  if (!anchor) return { status: 'SEM_ANCHOR', dueDate: null, conclusionDate: null, daysUntilDue: null };

  const done = records
    .filter(r => r.employee_id === colab.id && r.feedback_type === ritualType && r.workflow_status === 'ASSINADO_COLABORADOR')
    .map(r => ({ ...r, _d: new Date(r.employee_validation_date || r.updated_date || r.feedback_date) }))
    .sort((a, b) => a._d - b._d);

  let cycleStart = toDateOnly(anchor);
  if (done.length > 0) {
    // Avança ciclos até o vigente
    let ns = addDays(done[done.length - 1]._d, interval);
    while (ns <= today) { cycleStart = toDateOnly(ns); ns = addDays(ns, interval); }
  }

  const dueDate = addDays(cycleStart, interval);
  const daysUntilDue = Math.round((dueDate - today) / 86400000);

  const conclusionInCycle = done.find(r => r._d >= cycleStart && r._d <= dueDate);
  if (conclusionInCycle) {
    const onTime = toDateOnly(conclusionInCycle._d) <= dueDate;
    return { status: onTime ? 'CONCLUIDO_NO_PRAZO' : 'CONCLUIDO_COM_ATRASO', dueDate, conclusionDate: conclusionInCycle._d, daysUntilDue };
  }

  if (daysUntilDue < 0) return { status: 'ATRASADO', dueDate, conclusionDate: null, daysUntilDue };
  if (daysUntilDue <= ALERT_DAYS) return { status: 'EM_RISCO', dueDate, conclusionDate: null, daysUntilDue };
  return { status: 'PENDENTE', dueDate, conclusionDate: null, daysUntilDue };
}

// ---------- route handlers ----------

function handleMetrics(colabs, records, today) {
  const feedbacksRecebidos = records.length;
  const assinados = records.filter(r => r.workflow_status === 'ASSINADO_COLABORADOR').length;

  let noPrazo = 0, concluidosComAtraso = 0, atrasadosNaoConcluidos = 0, totalDevido = 0;

  colabs.filter(c => c.status === 'active').forEach(colab => {
    ALL_RITUAL_TYPES.forEach(ritualType => {
      const r = calcStatus(colab, ritualType, records, today);
      if (r.status === 'ISENTO_LEGACY' || r.status === 'SEM_ANCHOR' || r.status === 'PENDENTE') return;
      // Tudo que já deveria ter sido feito (vencido ou concluído)
      if (['CONCLUIDO_NO_PRAZO', 'CONCLUIDO_COM_ATRASO', 'ATRASADO', 'EM_RISCO'].includes(r.status)) {
        // EM_RISCO conta como total devido pois está no ciclo atual
        totalDevido++;
        if (r.status === 'CONCLUIDO_NO_PRAZO') noPrazo++;
        else if (r.status === 'CONCLUIDO_COM_ATRASO') concluidosComAtraso++;
        else if (r.status === 'ATRASADO') atrasadosNaoConcluidos++;
      }
    });
  });

  const atrasados = atrasadosNaoConcluidos;
  const taxaPercentual = totalDevido > 0
    ? Math.round(((noPrazo + concluidosComAtraso) / totalDevido) * 100)
    : 0;

  return {
    feedbacksRecebidos,
    noPrazo,
    atrasados,
    assinados,
    taxaConclusao: {
      percentual: taxaPercentual,
      concluidosNoPrazo: noPrazo,
      concluidosComAtraso,
      atrasadosNaoConcluidos,
      totalDevido
    }
  };
}

function handleProximosVencimentos(colabs, records, gestores, today) {
  const limit = addDays(today, ALERT_DAYS);
  const gestorMap = Object.fromEntries(gestores.map(g => [g.id, g]));
  const result = [];

  const RITUAL_LABELS = {
    experience_45d: 'Avaliação Inicial 45 Dias',
    experience_90d: 'Avaliação 90 Dias',
    evaluation: 'Trimestral',
    one_on_one: '1:1'
  };
  const RITUAL_COLORS = {
    experience_45d: '#3B82F6',
    experience_90d: '#EC4899',
    evaluation: '#10B981',
    one_on_one: '#6366F1'
  };

  colabs.filter(c => c.status === 'active').forEach(colab => {
    ALL_RITUAL_TYPES.forEach(ritualType => {
      const r = calcStatus(colab, ritualType, records, today);
      if (!['EM_RISCO', 'PENDENTE'].includes(r.status)) return;
      if (!r.dueDate) return;
      if (r.daysUntilDue < 0 || r.daysUntilDue > ALERT_DAYS) return;

      const gestor = gestorMap[colab.manager_id];
      result.push({
        colaboradorId: colab.id,
        colaboradorNome: colab.full_name,
        colaboradorEmail: colab.email,
        ritualType,
        ritualLabel: RITUAL_LABELS[ritualType],
        ritualColor: RITUAL_COLORS[ritualType],
        gestorNome: gestor?.full_name || '—',
        dueDate: r.dueDate.toISOString().split('T')[0],
        daysUntilDue: r.daysUntilDue
      });
    });
  });

  return result
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 8);
}

function handleGestoresAtraso(colabs, records, gestores, today) {
  const ALERT_THRESHOLD = 10;
  const activeGestores = gestores.filter(g => g.status === 'active');

  const result = activeGestores.map(gestor => {
    const team = colabs.filter(c => c.manager_id === gestor.id && c.status === 'active');
    if (team.length === 0) return null;

    let totalExpected = 0, totalOnTime = 0, totalDelayed = 0, totalAtRisk = 0;

    team.forEach(colab => {
      ALL_RITUAL_TYPES.forEach(ritualType => {
        const r = calcStatus(colab, ritualType, records, today);
        if (['ISENTO_LEGACY', 'SEM_ANCHOR', 'PENDENTE'].includes(r.status)) return;
        totalExpected++;
        if (r.status === 'CONCLUIDO_NO_PRAZO') totalOnTime++;
        else if (r.status === 'ATRASADO') totalDelayed++;
        else if (r.status === 'EM_RISCO') totalAtRisk++;
      });
    });

    if (totalDelayed === 0) return null; // só mostra gestores com atraso

    const adherence = totalExpected > 0 ? Math.round((totalOnTime / totalExpected) * 100) : 0;

    return {
      gestorId: gestor.id,
      gestorNome: gestor.full_name,
      atrasados: totalDelayed,
      emRisco: totalAtRisk,
      adherence,
      teamSize: team.length
    };
  }).filter(Boolean);

  return result.sort((a, b) => b.atrasados - a.atrasados).slice(0, 5);
}

function handlePrestadoresSemAvaliacao(colabs, records, gestores) {
  const gestorMap = Object.fromEntries(gestores.map(g => [g.id, g]));
  const colabsWithFeedback = new Set(records.map(r => r.employee_id));

  return colabs
    .filter(c => c.status === 'active' && !colabsWithFeedback.has(c.id))
    .slice(0, 8)
    .map(c => ({
      id: c.id,
      nome: c.full_name,
      email: c.email,
      admissionDate: c.admission_date,
      gestorNome: gestorMap[c.manager_id]?.full_name || '—'
    }));
}

function handleAtividadeRecente(colabs, records, gestores) {
  const colabMap = Object.fromEntries(colabs.map(c => [c.id, c]));
  const gestorMap = Object.fromEntries(gestores.map(g => [g.id, g]));

  const RITUAL_LABELS = {
    experience_45d: 'Avaliação Inicial 45 Dias',
    experience_90d: 'Avaliação 90 Dias',
    evaluation: 'Trimestral',
    one_on_one: '1:1',
    feedback: 'Feedback'
  };
  const RITUAL_COLORS = {
    experience_45d: '#3B82F6',
    experience_90d: '#EC4899',
    evaluation: '#10B981',
    one_on_one: '#6366F1',
    feedback: '#F8B137'
  };

  const today = new Date();

  const signed = records
    .filter(r => r.workflow_status === 'ASSINADO_COLABORADOR')
    .sort((a, b) => {
      const da = new Date(a.employee_validation_date || a.updated_date || a.feedback_date);
      const db = new Date(b.employee_validation_date || b.updated_date || b.feedback_date);
      return db - da;
    })
    .slice(0, 8);

  return signed.map(r => {
    const conclusionDate = new Date(r.employee_validation_date || r.updated_date || r.feedback_date);
    const colab = colabMap[r.employee_id];
    let isOnTime = true;

    if (colab) {
      const status = calcStatus(colab, r.feedback_type, records, today);
      isOnTime = status.status === 'CONCLUIDO_NO_PRAZO';
    }

    return {
      id: r.id,
      employeeName: r.employee_name,
      employeeEmail: r.employee_email,
      managerName: r.manager_name || gestorMap[r.manager_id]?.full_name || '—',
      ritualType: r.feedback_type,
      ritualLabel: RITUAL_LABELS[r.feedback_type] || r.feedback_type,
      ritualColor: RITUAL_COLORS[r.feedback_type] || '#94A3B8',
      conclusionDate: conclusionDate.toISOString(),
      isOnTime
    };
  });
}

// ---------- main handler ----------

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const { route } = payload;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [colabs, records, gestores] = await Promise.all([
      base44.asServiceRole.entities.Colaborador.list(),
      base44.asServiceRole.entities.FeedbackRecord.list(),
      base44.asServiceRole.entities.Gestor.list()
    ]);

    let data;
    switch (route) {
      case 'metrics':
        data = handleMetrics(colabs, records, today);
        break;
      case 'proximos-vencimentos':
        data = handleProximosVencimentos(colabs, records, gestores, today);
        break;
      case 'gestores-atraso':
        data = handleGestoresAtraso(colabs, records, gestores, today);
        break;
      case 'prestadores-sem-avaliacao':
        data = handlePrestadoresSemAvaliacao(colabs, records, gestores);
        break;
      case 'atividade-recente':
        data = handleAtividadeRecente(colabs, records, gestores);
        break;
      default:
        // Retorna tudo de uma vez para o dashboard inicial
        data = {
          metrics: handleMetrics(colabs, records, today),
          proximosVencimentos: handleProximosVencimentos(colabs, records, gestores, today),
          gestoresAtraso: handleGestoresAtraso(colabs, records, gestores, today),
          prestadoresSemAvaliacao: handlePrestadoresSemAvaliacao(colabs, records, gestores),
          atividadeRecente: handleAtividadeRecente(colabs, records, gestores)
        };
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('adminDashboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});