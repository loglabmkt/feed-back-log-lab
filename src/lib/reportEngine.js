/**
 * MOTOR DE CÁLCULO DE RELATÓRIOS — Log Lab Digital
 * 
 * Regras de negócio:
 * - Rituais únicos (45d, 90d): 1 realização esperada por prestador (lifetime)
 * - Rituais recorrentes (trimestral=90d, 1:1=60d): 1 por ciclo por prestador
 * - Aderência = CONCLUIDO_NO_PRAZO / Total esperado (excluindo ISENTO_LEGACY)
 * - CONCLUIDO_COM_ATRASO não conta como aderente
 * - ATRASADO penaliza o denominador
 */

const ALERT_THRESHOLD_DAYS = 10;

// Tipos únicos (1 realização esperada por prestador lifetime)
const UNIQUE_RITUALS = ['experience_45d', 'experience_90d'];

// Intervalos dos rituais recorrentes em dias
const RECURRENT_INTERVALS = {
  evaluation: 90,  // Trimestral
  one_on_one: 60,  // 1:1 Bimestral
  feedback: 90,    // Feedback geral (tratado como recorrente)
};

// Offset dos rituais únicos a partir da data âncora
const UNIQUE_OFFSETS = {
  experience_45d: 45,
  experience_90d: 90,
};

/**
 * Retorna a data âncora do prestador para um ritual específico.
 * Leva em conta custom_start_date ou admission_date conforme configuração.
 */
function getAnchorDate(colaborador, ritualType) {
  if (ritualType === 'experience_45d') {
    if (colaborador.ritual_45d_use_admission === false && colaborador.ritual_45d_custom_start) {
      return new Date(colaborador.ritual_45d_custom_start);
    }
    return colaborador.admission_date ? new Date(colaborador.admission_date) : null;
  }
  if (ritualType === 'experience_90d') {
    if (colaborador.ritual_90d_use_admission === false && colaborador.ritual_90d_custom_start) {
      return new Date(colaborador.ritual_90d_custom_start);
    }
    return colaborador.admission_date ? new Date(colaborador.admission_date) : null;
  }
  if (ritualType === 'evaluation') {
    if (colaborador.ritual_trimestral_use_admission === false && colaborador.ritual_trimestral_custom_start) {
      return new Date(colaborador.ritual_trimestral_custom_start);
    }
    return colaborador.admission_date ? new Date(colaborador.admission_date) : null;
  }
  if (ritualType === 'one_on_one') {
    if (colaborador.ritual_1on1_use_admission === false && colaborador.ritual_1on1_custom_start) {
      return new Date(colaborador.ritual_1on1_custom_start);
    }
    return colaborador.admission_date ? new Date(colaborador.admission_date) : null;
  }
  // feedback genérico: usar admission_date
  return colaborador.admission_date ? new Date(colaborador.admission_date) : null;
}

/**
 * Calcula o status de um ritual ÚNICO (45d ou 90d) para um prestador.
 * 
 * Retorna: 'CONCLUIDO_NO_PRAZO' | 'CONCLUIDO_COM_ATRASO' | 'ISENTO_LEGACY' | 'PENDENTE' | 'ATRASADO' | 'SEM_ANCHOR'
 */
export function calcUniqueRitualStatus(colaborador, ritualType, conclusoes, referenceDate = new Date()) {
  const today = referenceDate;

  // Verificar isenção legacy (retroativo manual)
  if (ritualType === 'experience_45d' && colaborador.ritual_45d_completed_manual) {
    return { status: 'ISENTO_LEGACY', dueDate: null, conclusionDate: colaborador.ritual_45d_completion_date || null };
  }
  if (ritualType === 'experience_90d' && colaborador.ritual_90d_completed_manual) {
    return { status: 'ISENTO_LEGACY', dueDate: null, conclusionDate: colaborador.ritual_90d_completion_date || null };
  }

  const anchor = getAnchorDate(colaborador, ritualType);
  if (!anchor || isNaN(anchor.getTime())) {
    return { status: 'SEM_ANCHOR', dueDate: null, conclusionDate: null };
  }

  const offset = UNIQUE_OFFSETS[ritualType];
  const dueDate = new Date(anchor.getTime() + offset * 86400000);

  // Buscar conclusão (ASSINADO_COLABORADOR) deste ritual para este colaborador
  const done = conclusoes.find(
    r => r.employee_id === colaborador.id &&
         r.feedback_type === ritualType &&
         r.workflow_status === 'ASSINADO_COLABORADOR'
  );

  if (done) {
    const conclusionDate = new Date(done.employee_validation_date || done.updated_date || done.feedback_date);
    const onTime = conclusionDate <= dueDate;
    return {
      status: onTime ? 'CONCLUIDO_NO_PRAZO' : 'CONCLUIDO_COM_ATRASO',
      dueDate,
      conclusionDate
    };
  }

  // Não concluído — verificar se venceu
  const daysRemaining = Math.round((dueDate - today) / 86400000);
  if (daysRemaining < 0) {
    return { status: 'ATRASADO', dueDate, conclusionDate: null, daysRemaining };
  }
  return { status: 'PENDENTE', dueDate, conclusionDate: null, daysRemaining };
}

/**
 * Calcula o status do ciclo ATUAL de um ritual RECORRENTE para um prestador.
 * 
 * Ciclo atual começa na última conclusão + intervalo (ou âncora se nunca concluído).
 * Retorna: 'CONCLUIDO_NO_PRAZO' | 'CONCLUIDO_COM_ATRASO' | 'PENDENTE' | 'EM_RISCO' | 'ATRASADO' | 'SEM_ANCHOR'
 */
export function calcRecurrentRitualStatus(colaborador, ritualType, conclusoes, referenceDate = new Date()) {
  const today = referenceDate;
  const interval = RECURRENT_INTERVALS[ritualType] || 90;

  const anchor = getAnchorDate(colaborador, ritualType);
  if (!anchor || isNaN(anchor.getTime())) {
    return { status: 'SEM_ANCHOR', dueDate: null, conclusionDate: null };
  }

  // Todas as conclusões deste ritual para este prestador, ordenadas por data
  const done = conclusoes
    .filter(r =>
      r.employee_id === colaborador.id &&
      r.feedback_type === ritualType &&
      r.workflow_status === 'ASSINADO_COLABORADOR'
    )
    .map(r => ({
      ...r,
      _conclusionDate: new Date(r.employee_validation_date || r.updated_date || r.feedback_date)
    }))
    .sort((a, b) => a._conclusionDate - b._conclusionDate);

  // Calcular o início do ciclo atual:
  // Se houver conclusões, o ciclo atual começa após a última conclusão
  let cycleStart = anchor;
  let lastConclusion = null;

  if (done.length > 0) {
    lastConclusion = done[done.length - 1];
    // Avançar ciclos até o ciclo que ainda não terminou ou está vigente
    let nextCycleStart = new Date(lastConclusion._conclusionDate.getTime() + interval * 86400000);
    // Garantir que o ciclo atual seja o vigente (não no futuro)
    while (nextCycleStart <= today) {
      cycleStart = nextCycleStart;
      nextCycleStart = new Date(cycleStart.getTime() + interval * 86400000);
    }
    // cycleStart é o início do ciclo atual, dueDate é o fim
    const dueDate = new Date(cycleStart.getTime() + interval * 86400000);

    // Verificar se houve conclusão dentro do ciclo atual (entre cycleStart e dueDate)
    const conclusionInCycle = done.find(
      r => r._conclusionDate >= cycleStart && r._conclusionDate <= dueDate
    );

    if (conclusionInCycle) {
      const onTime = conclusionInCycle._conclusionDate <= dueDate;
      return {
        status: onTime ? 'CONCLUIDO_NO_PRAZO' : 'CONCLUIDO_COM_ATRASO',
        dueDate,
        conclusionDate: conclusionInCycle._conclusionDate
      };
    }

    const daysRemaining = Math.round((dueDate - today) / 86400000);
    if (daysRemaining < 0) return { status: 'ATRASADO', dueDate, conclusionDate: null, daysRemaining };
    if (daysRemaining <= ALERT_THRESHOLD_DAYS) return { status: 'EM_RISCO', dueDate, conclusionDate: null, daysRemaining };
    return { status: 'PENDENTE', dueDate, conclusionDate: null, daysRemaining };
  }

  // Nunca foi concluído — usar âncora como início do primeiro ciclo
  const firstDue = new Date(anchor.getTime() + interval * 86400000);

  // Se a data prevista ainda está no futuro do primeiro ciclo
  if (firstDue > today) {
    const daysRemaining = Math.round((firstDue - today) / 86400000);
    if (daysRemaining <= ALERT_THRESHOLD_DAYS) return { status: 'EM_RISCO', dueDate: firstDue, conclusionDate: null, daysRemaining };
    return { status: 'PENDENTE', dueDate: firstDue, conclusionDate: null, daysRemaining };
  }

  // Primeiro ciclo já venceu e nunca foi feito — ATRASADO
  return { status: 'ATRASADO', dueDate: firstDue, conclusionDate: null, daysRemaining: Math.round((firstDue - today) / 86400000) };
}

/**
 * Calcula o status de um ritual para um colaborador.
 * Delega para calcUniqueRitualStatus ou calcRecurrentRitualStatus conforme o tipo.
 */
export function calcRitualStatus(colaborador, ritualType, allRecords, referenceDate = new Date()) {
  if (UNIQUE_RITUALS.includes(ritualType)) {
    return calcUniqueRitualStatus(colaborador, ritualType, allRecords, referenceDate);
  }
  return calcRecurrentRitualStatus(colaborador, ritualType, allRecords, referenceDate);
}

const ALL_RITUAL_TYPES = ['experience_45d', 'experience_90d', 'evaluation', 'one_on_one', 'feedback'];

/**
 * Calcula as métricas completas de aderência de um gestor.
 * 
 * Fórmula: aderência = CONCLUIDO_NO_PRAZO / (total esperado - ISENTO_LEGACY - SEM_ANCHOR)
 * - CONCLUIDO_COM_ATRASO: não conta como aderente mas entra no denominador
 * - ATRASADO: penaliza (entra no denominador, não no numerador)
 * - ISENTO_LEGACY e SEM_ANCHOR: excluídos do denominador
 * - PENDENTE e EM_RISCO: não penalizam ainda
 * 
 * Situação do gestor:
 * - "em_dia": aderência >= 80% e sem ATRASADOS
 * - "em_risco": tem EM_RISCO e nenhum ATRASADO
 * - "em_atraso": tem pelo menos 1 ATRASADO
 * - "sem_dados": nenhum ritual devido ainda
 */
export function calcManagerAdherence(gestor, team, allRecords, ritualTypes = ALL_RITUAL_TYPES, referenceDate = new Date()) {
  let totalExpected = 0;
  let totalOnTime = 0;
  let totalLate = 0;
  let totalDelayed = 0;
  let totalAtRisk = 0;

  team.forEach(colab => {
    ritualTypes.forEach(ritualType => {
      const result = calcRitualStatus(colab, ritualType, allRecords, referenceDate);

      if (result.status === 'ISENTO_LEGACY' || result.status === 'SEM_ANCHOR') return;
      // PENDENTE ainda não venceu — não penaliza nem conta no denominador de "esperado vencido"
      // Mas incluímos no total para dar contexto
      if (result.status === 'PENDENTE') return;

      totalExpected++;
      if (result.status === 'CONCLUIDO_NO_PRAZO') totalOnTime++;
      else if (result.status === 'CONCLUIDO_COM_ATRASO') totalLate++;
      else if (result.status === 'ATRASADO') totalDelayed++;
      else if (result.status === 'EM_RISCO') totalAtRisk++;
    });
  });

  const adherence = totalExpected > 0 ? Math.round((totalOnTime / totalExpected) * 100) : null;

  // Situação
  let situation;
  if (totalExpected === 0 && totalAtRisk === 0) {
    situation = 'sem_dados';
  } else if (totalDelayed > 0) {
    situation = 'em_atraso';
  } else if (totalAtRisk > 0) {
    situation = 'em_risco';
  } else if (adherence !== null && adherence >= 80) {
    situation = 'em_dia';
  } else {
    situation = 'em_dia'; // todos pendentes dentro do prazo
  }

  return {
    fullName: gestor.full_name,
    team: team.length,
    concluidos: totalOnTime,
    comAtraso: totalLate,
    emRisco: totalAtRisk,
    atrasados: totalDelayed,
    adherence: adherence ?? 0,
    situation,
  };
}

/**
 * Agrupa avaliações ASSINADAS por tipo de ritual.
 * Retorna contagem total, no prazo, com atraso e atrasados por tipo.
 */
export function getDistributionByRitual(colaboradores, allRecords, filters = {}) {
  const { dateFrom, dateTo, managerId } = filters;

  // Filtrar colaboradores pelo gestor se solicitado
  const targetColabs = managerId
    ? colaboradores.filter(c => c.manager_id === managerId && c.status === 'active')
    : colaboradores.filter(c => c.status === 'active');

  const colabIds = new Set(targetColabs.map(c => c.id));

  const today = new Date();

  const distribution = {};

  ALL_RITUAL_TYPES.forEach(ritualType => {
    let onTime = 0, late = 0, delayed = 0, pendingOrRisk = 0;

    targetColabs.forEach(colab => {
      const result = calcRitualStatus(colab, ritualType, allRecords, today);
      if (result.status === 'ISENTO_LEGACY' || result.status === 'SEM_ANCHOR') return;

      // Aplicar filtro de data à data prevista
      if (result.dueDate) {
        if (dateFrom && result.dueDate < new Date(dateFrom)) return;
        if (dateTo && result.dueDate > new Date(dateTo + 'T23:59:59')) return;
      }

      if (result.status === 'CONCLUIDO_NO_PRAZO') onTime++;
      else if (result.status === 'CONCLUIDO_COM_ATRASO') late++;
      else if (result.status === 'ATRASADO') delayed++;
      else pendingOrRisk++;
    });

    const total = onTime + late + delayed + pendingOrRisk;
    if (total > 0) {
      distribution[ritualType] = { ritualType, onTime, late, delayed, pendingOrRisk, total };
    }
  });

  return distribution;
}

/**
 * Agrupa avaliações ASSINADAS (ASSINADO_COLABORADOR) por mês.
 * Para cada mês: total no prazo, total com atraso, aderência %.
 * Período padrão: últimos 6 meses.
 */
export function getMonthlyEvolution(colaboradores, allRecords, filters = {}) {
  const { dateFrom, dateTo, managerId } = filters;
  const today = new Date();

  // Período padrão: últimos 6 meses
  const effectiveTo = dateTo ? new Date(dateTo + 'T23:59:59') : today;
  const effectiveFrom = dateFrom
    ? new Date(dateFrom)
    : new Date(today.getFullYear(), today.getMonth() - 5, 1);

  // Filtrar registros assinados no período
  let signed = allRecords.filter(r => r.workflow_status === 'ASSINADO_COLABORADOR');

  if (managerId) {
    signed = signed.filter(r => r.manager_id === managerId);
  }

  signed = signed.filter(r => {
    const d = new Date(r.employee_validation_date || r.updated_date || r.feedback_date);
    return !isNaN(d.getTime()) && d >= effectiveFrom && d <= effectiveTo;
  });

  // Para calcular se foi no prazo, precisamos da data prevista de cada registro
  // Fazemos um mapa colaborador para acesso rápido
  const colabMap = {};
  colaboradores.forEach(c => { colabMap[c.id] = c; });

  const monthMap = {};

  signed.forEach(r => {
    const conclusionDate = new Date(r.employee_validation_date || r.updated_date || r.feedback_date);
    const key = `${conclusionDate.getFullYear()}-${String(conclusionDate.getMonth() + 1).padStart(2, '0')}`;
    const label = conclusionDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

    if (!monthMap[key]) monthMap[key] = { month: label, key, onTime: 0, late: 0, total: 0 };

    // Calcular se foi no prazo
    const colab = colabMap[r.employee_id];
    if (colab) {
      const result = calcRitualStatus(colab, r.feedback_type, allRecords, today);
      if (result.status === 'CONCLUIDO_NO_PRAZO') monthMap[key].onTime++;
      else monthMap[key].late++;
    } else {
      // Sem dados do colaborador: contar como concluído sem saber prazo
      monthMap[key].onTime++;
    }
    monthMap[key].total++;
  });

  return Object.keys(monthMap)
    .sort()
    .map(k => ({
      ...monthMap[k],
      adherence: monthMap[k].total > 0
        ? Math.round((monthMap[k].onTime / monthMap[k].total) * 100)
        : 0
    }));
}