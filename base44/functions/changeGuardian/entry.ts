/**
 * changeGuardian
 * Detecta alterações suspeitas em massa nas entidades críticas
 * e registra alertas no SecurityLog.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PROTECTED_FIELDS = {
  Colaborador:    ['full_name', 'email', 'admission_date', 'manager_id', 'company_id'],
  FeedbackRecord: ['employee_name', 'employee_email', 'workflow_status'],
  Gestor:         ['full_name', 'email']
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validar autenticação admin
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { entity, windowMinutes = 5 } = body;

    if (!entity || !PROTECTED_FIELDS[entity]) {
      return Response.json(
        { error: `Entidade inválida. Use: ${Object.keys(PROTECTED_FIELDS).join(', ')}` },
        { status: 400 }
      );
    }

    const fields = PROTECTED_FIELDS[entity];
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Buscar todos os registros da entidade
    const records = await base44.asServiceRole.entities[entity].list('-updated_date', 1000);

    // Filtrar apenas os atualizados dentro da janela
    const recentRecords = records.filter(r => r.updated_date && r.updated_date >= since);

    const alertas = [];

    for (const field of fields) {
      // Agrupar por segundo de updated_date
      const groups = {};
      for (const record of recentRecords) {
        if (!record.updated_date) continue;
        // Truncar ao segundo (remover milissegundos)
        const secondKey = record.updated_date.substring(0, 19) + 'Z';
        if (!groups[secondKey]) groups[secondKey] = [];
        groups[secondKey].push(record);
      }

      for (const [secondKey, group] of Object.entries(groups)) {
        if (group.length > 3) {
          const totalRegistros = group.length;
          const severity = totalRegistros > 10 ? 'CRITICO' : 'ALTO';
          const sampleIds = group.slice(0, 5).map(r => r.id);

          const alerta = {
            event_type:        'ALERTA_BULK_UPDATE',
            entity_name:       entity,
            campo_alterado:    field,
            total_registros:   totalRegistros,
            timestamp_update:  secondKey,
            sample_ids:        sampleIds,
            detected_at:       new Date().toISOString(),
            severity
          };

          // Gravar no SecurityLog
          await base44.asServiceRole.entities.SecurityLog.create({
            ...alerta,
            timestamp: alerta.detected_at,
            page: 'system/changeGuardian',
            performed_by: user.id
          });

          alertas.push(alerta);
        }
      }
    }

    return Response.json({
      alertas,
      total_alertas: alertas.length,
      status: alertas.length > 0 ? 'ALERTAS_ENCONTRADOS' : 'LIMPO'
    });

  } catch (error) {
    console.error('changeGuardian error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});