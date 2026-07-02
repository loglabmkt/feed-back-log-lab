/**
 * autoRegisterNomeProtegido
 * Chamada pelas automações on-create de Colaborador e FeedbackRecord.
 * Registra automaticamente o novo registro na entidade NomeProtegido para
 * que o cron de restauração passe a protegê-lo imediatamente.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;
    if (!event || !data) {
      return Response.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const entidade = event.entity_name; // "Colaborador" ou "FeedbackRecord"
    const registro_id = event.entity_id;

    if (!["Colaborador", "FeedbackRecord"].includes(entidade)) {
      return Response.json({ skipped: true, reason: 'Entidade não monitorada' });
    }

    // Verificar se já existe para evitar duplicata
    const existentes = await base44.asServiceRole.entities.NomeProtegido.filter({
      entidade,
      registro_id,
    });
    if (existentes.length > 0) {
      return Response.json({ skipped: true, reason: 'Já registrado' });
    }

    let payload;
    if (entidade === "Colaborador") {
      payload = {
        entidade: "Colaborador",
        registro_id,
        nome_correto: data.full_name ?? "",
        cargo_correto: data.position ?? "",
        ativo: true,
      };
    } else {
      payload = {
        entidade: "FeedbackRecord",
        registro_id,
        nome_correto: data.employee_name ?? "",
        nome_gestor_correto: data.manager_name ?? "",
        ativo: true,
      };
    }

    const criado = await base44.asServiceRole.entities.NomeProtegido.create(payload);
    return Response.json({ success: true, id: criado.id, entidade, registro_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});