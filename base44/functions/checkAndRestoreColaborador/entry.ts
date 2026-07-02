/**
 * checkAndRestoreColaborador
 * Cron: a cada 5 minutos, compara os Colaboradores contra a entidade NomeProtegido.
 * Restaura full_name e position quando divergem. NÃO força o status.
 *
 * REGRA OPERACIONAL: Para uma alteração legítima de nome ou cargo, atualize também
 * o NomeProtegido correspondente (nome_correto / cargo_correto). Caso contrário o
 * cron reverterá a mudança em até 5 minutos, por design.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Carregar todos os registros de proteção ativos para Colaborador
    const protegidos = await base44.asServiceRole.entities.NomeProtegido.filter(
      { entidade: "Colaborador", ativo: true },
      '-created_date',
      500
    );

    const restored = [];
    const errors = [];

    for (const prot of protegidos) {
      try {
        const record = await base44.asServiceRole.entities.Colaborador.get(prot.registro_id);
        if (!record) continue;

        const cargoEsperado = prot.cargo_correto ?? "";
        const cargoAtual = record.position ?? "";

        if (record.full_name === prot.nome_correto && cargoAtual === cargoEsperado) {
          continue;
        }

        await base44.asServiceRole.entities.Colaborador.update(prot.registro_id, {
          full_name: prot.nome_correto,
          position: prot.cargo_correto ?? "",
        });
        restored.push(prot.registro_id);
      } catch (e) {
        errors.push({ id: prot.registro_id, error: e.message });
      }
    }

    // Sem corrupção: encerrar silenciosamente
    if (restored.length === 0) {
      return Response.json({ success: true, updated: 0, message: "No corruption detected" });
    }

    // Logar apenas quando há restaurações
    await base44.asServiceRole.entities.SecurityLog.create({
      event_type: "AUTO_RESTORE_COLABORADOR",
      page: "system/cron",
      timestamp: new Date().toISOString(),
      performed_by: "system_cron",
      affected_ids: restored,
      new_value: JSON.stringify({ restored_count: restored.length, ids_restored: restored }),
    });

    return Response.json({ success: true, updated: restored.length, ids_restored: restored, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});