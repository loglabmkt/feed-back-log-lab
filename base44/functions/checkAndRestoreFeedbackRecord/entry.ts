/**
 * checkAndRestoreFeedbackRecord
 * Cron: a cada 5 minutos, compara os FeedbackRecords contra a entidade NomeProtegido.
 * Restaura employee_name e manager_name quando divergem.
 *
 * REGRA OPERACIONAL: Para uma alteração legítima de nome, atualize também
 * o NomeProtegido correspondente (nome_correto / nome_gestor_correto). Caso contrário
 * o cron reverterá a mudança em até 5 minutos, por design.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Carregar todos os registros de proteção ativos para FeedbackRecord
    const protegidos = await base44.asServiceRole.entities.NomeProtegido.filter(
      { entidade: "FeedbackRecord", ativo: true },
      '-created_date',
      500
    );

    const restored = [];
    const errors = [];

    for (const prot of protegidos) {
      try {
        const record = await base44.asServiceRole.entities.FeedbackRecord.get(prot.registro_id);
        if (!record) continue;

        if (
          record.employee_name === prot.nome_correto &&
          record.manager_name === prot.nome_gestor_correto
        ) {
          continue;
        }

        await base44.asServiceRole.entities.FeedbackRecord.update(prot.registro_id, {
          employee_name: prot.nome_correto,
          manager_name: prot.nome_gestor_correto,
        });
        restored.push(prot.registro_id);
      } catch (e) {
        errors.push({ id: prot.registro_id, error: e.message });
      }
    }

    // Sem divergências: encerrar silenciosamente
    if (restored.length === 0) {
      return Response.json({ clean: true, message: 'No corruption detected' });
    }

    // Logar apenas quando há restaurações
    await base44.asServiceRole.entities.SecurityLog.create({
      event_type: 'AUTO_RESTORE_CRON',
      timestamp: new Date().toISOString(),
      page: 'system/cron',
      performed_by: 'system_cron',
      affected_ids: restored,
      new_value: JSON.stringify({ restored_count: restored.length, ids_restored: restored })
    });

    return Response.json({ restored: restored.length, ids_restored: restored, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});