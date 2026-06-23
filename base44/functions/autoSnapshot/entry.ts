/**
 * autoSnapshot
 * Grava snapshots completos das entidades críticas em DataSnapshot.
 * Mantém no máximo 30 snapshots por entidade (apaga os mais antigos).
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ALLOWED_ENTITIES = ['Colaborador', 'Gestor', 'FeedbackRecord', 'Company'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validar autenticação admin
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    let { entities, note } = body;

    // Default: todas as quatro entidades
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      entities = ALLOWED_ENTITIES;
    }

    // Validar entidades solicitadas
    const invalid = entities.filter(e => !ALLOWED_ENTITIES.includes(e));
    if (invalid.length > 0) {
      return Response.json(
        { error: `Entidades inválidas: ${invalid.join(', ')}. Permitidas: ${ALLOWED_ENTITIES.join(', ')}` },
        { status: 400 }
      );
    }

    const triggered_by = user.email || user.id || 'admin';
    const snapshot_date = new Date().toISOString();
    const snapshots_criados = [];

    for (const entityName of entities) {
      // 1. Buscar todos os registros
      const records = await base44.asServiceRole.entities[entityName].list('-created_date', 2000);

      // 2. Gravar snapshot
      await base44.asServiceRole.entities.DataSnapshot.create({
        entity_name:   entityName,
        snapshot_date,
        total_records: records.length,
        triggered_by,
        snapshot_data: { records },
        note:          note || null
      });

      snapshots_criados.push({
        entity_name:   entityName,
        total_records: records.length,
        snapshot_date
      });

      // 3. Limpeza: manter apenas os 30 mais recentes por entidade
      const all = await base44.asServiceRole.entities.DataSnapshot.filter(
        { entity_name: entityName },
        '-snapshot_date',
        100
      );

      if (all.length > 30) {
        const toDelete = all.slice(30); // os mais antigos (após ordenação decrescente)
        for (const old of toDelete) {
          await base44.asServiceRole.entities.DataSnapshot.delete(old.id);
        }
      }
    }

    return Response.json({
      success:          true,
      snapshots_criados,
      total_entities:   snapshots_criados.length
    });

  } catch (error) {
    console.error('autoSnapshot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});