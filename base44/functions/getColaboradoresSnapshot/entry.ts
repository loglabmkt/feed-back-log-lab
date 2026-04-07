import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const records = await base44.asServiceRole.entities.Colaborador.filter({ status: 'active' }, 'full_name', 10000);

  const snapshot = {
    snapshot_metadata: {
      created_at: new Date().toISOString(),
      created_by: `${user.full_name} (${user.email}) — operação bulk ritual config`,
      total_records: records.length,
      reason: "Ponto de restauração pós-configuração padrão Trimestral/1:1 em 2026-04-09",
      rollback_instructions: {
        trimestral: "Para reverter: update_entities(Colaborador, {id: '<id>'}, {ritual_trimestral_use_admission: <valor_original>, ritual_trimestral_custom_start: <data_original>})",
        one_on_one: "Para reverter: update_entities(Colaborador, {id: '<id>'}, {ritual_1on1_use_admission: <valor_original>, ritual_1on1_custom_start: <data_original>})"
      }
    },
    records: records.map(r => ({
      id: r.id,
      created_date: r.created_date,
      updated_date: r.updated_date,
      full_name: r.full_name,
      email: r.email,
      status: r.status,
      admission_date: r.admission_date ?? null,
      manager_id: r.manager_id ?? null,
      company_id: r.company_id ?? null,
      department: r.department ?? null,
      position: r.position ?? null,
      ritual_45d_use_admission: r.ritual_45d_use_admission ?? true,
      ritual_45d_custom_start: r.ritual_45d_custom_start ?? null,
      ritual_45d_completed_manual: r.ritual_45d_completed_manual ?? false,
      ritual_45d_completion_date: r.ritual_45d_completion_date ?? null,
      ritual_90d_use_admission: r.ritual_90d_use_admission ?? true,
      ritual_90d_custom_start: r.ritual_90d_custom_start ?? null,
      ritual_90d_completed_manual: r.ritual_90d_completed_manual ?? false,
      ritual_90d_completion_date: r.ritual_90d_completion_date ?? null,
      ritual_trimestral_use_admission: r.ritual_trimestral_use_admission ?? true,
      ritual_trimestral_custom_start: r.ritual_trimestral_custom_start ?? null,
      ritual_1on1_use_admission: r.ritual_1on1_use_admission ?? true,
      ritual_1on1_custom_start: r.ritual_1on1_custom_start ?? null,
      last_feedback_date: r.last_feedback_date ?? null
    }))
  };

  return Response.json(snapshot);
});