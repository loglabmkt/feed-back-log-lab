/**
 * logColaboradorRename
 * Acionado pela automação de entity (update em Colaborador).
 * Registra NOME_ALTERADO em SecurityLog quando full_name muda.
 * Registra ALERTA_BULK_RENAME se o mesmo usuário alterar >5 nomes em <60s.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const { event, data, old_data } = payload;

    // Só processa eventos de update no Colaborador
    if (event?.type !== 'update' || event?.entity_name !== 'Colaborador') {
      return Response.json({ skipped: true });
    }

    const newName = data?.full_name;
    const oldName = old_data?.full_name;

    // Só age se full_name realmente mudou
    if (!newName || newName === oldName) {
      return Response.json({ skipped: true, reason: 'full_name não alterado' });
    }

    const colaboradorId = event.entity_id;
    const timestamp = new Date().toISOString();

    // Tenta identificar quem fez a alteração (pode não haver sessão em automações)
    let performedBy = null;
    try {
      const user = await base44.auth.me();
      performedBy = user?.id || null;
    } catch (_) { /* sem sessão — automação */ }

    // 1. Registrar o log de alteração de nome
    await base44.asServiceRole.entities.SecurityLog.create({
      event_type: 'NOME_ALTERADO',
      entity_id: colaboradorId,
      old_value: oldName || '',
      new_value: newName,
      performed_by: performedBy,
      timestamp,
      page: 'system/automation'
    });

    // 2. Verificar bulk rename: buscar logs NOME_ALTERADO do mesmo usuário nos últimos 60s
    if (performedBy) {
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      const recentLogs = await base44.asServiceRole.entities.SecurityLog.filter({
        event_type: 'NOME_ALTERADO',
        performed_by: performedBy
      });

      const recentIds = recentLogs
        .filter(l => l.timestamp >= since)
        .map(l => l.entity_id)
        .filter(Boolean);

      // Incluir o atual na contagem (acabou de ser criado)
      const allIds = [...new Set([...recentIds, colaboradorId])];

      if (allIds.length > 5) {
        await base44.asServiceRole.entities.SecurityLog.create({
          event_type: 'ALERTA_BULK_RENAME',
          performed_by: performedBy,
          affected_ids: allIds,
          timestamp: new Date().toISOString(),
          page: 'system/automation'
        });
      }
    }

    return Response.json({ success: true, logged: 'NOME_ALTERADO', entity_id: colaboradorId });
  } catch (error) {
    console.error('logColaboradorRename error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});