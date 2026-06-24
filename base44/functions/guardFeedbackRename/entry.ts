/**
 * guardFeedbackRename
 * Acionado pela automação de entity (update em FeedbackRecord).
 * Se employee_name ou manager_name mudaram, registra NOME_ALTERADO_FEEDBACK.
 * Se o mesmo usuário alterar >3 desses campos em <60s, registra BLOQUEIO_BULK_RENAME_FEEDBACK.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const { event, data, old_data } = payload;

    // Só processa eventos de update em FeedbackRecord
    if (event?.type !== 'update' || event?.entity_name !== 'FeedbackRecord') {
      return Response.json({ skipped: true });
    }

    const changedNameFields = [];

    if (data?.employee_name && data.employee_name !== old_data?.employee_name) {
      changedNameFields.push({ field: 'employee_name', old: old_data?.employee_name || '', new: data.employee_name });
    }
    if (data?.manager_name && data.manager_name !== old_data?.manager_name) {
      changedNameFields.push({ field: 'manager_name', old: old_data?.manager_name || '', new: data.manager_name });
    }

    if (changedNameFields.length === 0) {
      return Response.json({ skipped: true, reason: 'Nenhum campo de nome alterado' });
    }

    const recordId = event.entity_id;
    const timestamp = new Date().toISOString();

    let performedBy = null;
    try {
      const user = await base44.auth.me();
      performedBy = user?.id || null;
    } catch (_) { /* sem sessão — automação */ }

    // 1. Registrar log de cada campo alterado
    for (const change of changedNameFields) {
      await base44.asServiceRole.entities.SecurityLog.create({
        event_type: 'NOME_ALTERADO_FEEDBACK',
        entity_id: recordId,
        old_value: change.old,
        new_value: change.new,
        performed_by: performedBy,
        timestamp,
        page: 'system/automation',
        ip_address: change.field
      });
    }

    // 2. Verificar bulk rename: buscar logs recentes do mesmo usuário nos últimos 60s
    if (performedBy) {
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      const recentLogs = await base44.asServiceRole.entities.SecurityLog.filter({
        event_type: 'NOME_ALTERADO_FEEDBACK',
        performed_by: performedBy
      });

      const recentIds = recentLogs
        .filter(l => l.timestamp >= since)
        .map(l => l.entity_id)
        .filter(Boolean);

      const allIds = [...new Set([...recentIds, recordId])];

      if (allIds.length > 3) {
        await base44.asServiceRole.entities.SecurityLog.create({
          event_type: 'BLOQUEIO_BULK_RENAME_FEEDBACK',
          performed_by: performedBy,
          affected_ids: allIds,
          timestamp: new Date().toISOString(),
          page: 'system/automation'
        });

        return Response.json({
          success: false,
          blocked: true,
          reason: 'BLOQUEIO_BULK_RENAME_FEEDBACK: mais de 3 registros FeedbackRecord com nome alterado em 60s',
          affected_count: allIds.length
        }, { status: 403 });
      }
    }

    return Response.json({ success: true, logged: 'NOME_ALTERADO_FEEDBACK', entity_id: recordId, changed: changedNameFields.map(c => c.field) });
  } catch (error) {
    console.error('guardFeedbackRename error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});