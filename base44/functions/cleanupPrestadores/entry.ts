import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * ADMIN ONLY - Limpeza de prestadores não preservados
 * Remove todos os prestadores cujos e-mails NÃO estão na lista de preservação
 * Hard Delete em cascata controlado
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Validação: apenas admins podem executar
    if (user?.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const body = await req.json();
    const keepEmails = body.keepEmails || [
      "amanda.porcionato@loglabdigital.com.br",
      "cleiton.fernandes@loglabdigital.com.br",
      "gabryelle.aguirre@loglabdigital.com.br",
      "helena.barbosa@loglabdigital.com.br",
      "juliana.lisboa@loglabdigital.com.br",
      "mirela.silva@loglabdigital.com.br",
      "rodolpho.bispo@loglabdigital.com.br",
      "alveny.andrade@loglabdigital.com.br",
      "brenda.strobel@loglabdigital.com.br",
      "bruna.lasmar@loglabdigital.com.br",
      "dalva.eloy@loglabdigital.com.br",
      "elenilson.almeida@loglabdigital.com.br",
      "pedro.falcao@loglabdigital.com.br",
      "thalita.assis@loglabdigital.com.br",
      "ana.heilmann@loglabdigital.com.br",
      "bruna.silva@loglabdigital.com.br",
      "bryan.dellaquila@loglabdigital.com.br",
      "klayre.ferreira@loglabdigital.com.br",
      "rany.santos@loglabdigital.com.br",
      "samantha.diniz@loglabdigital.com.br",
      "arthur.fernandes@loglabdigital.com.br",
      "bruno.santos@loglabdigital.com.br",
      "debora.resende@loglabdigital.com.br",
      "joao.soares@loglabdigital.com.br",
      "jose.junior@loglabdigital.com.br",
      "leandro.barata@loglabdigital.com.br",
      "marcus.francisco@loglabdigital.com.br",
      "monica.jabur@loglabdigital.com.br",
      "ricardo.germano@loglabdigital.com.br",
      "anderson.nascimento@loglabdigital.com.br",
      "carlos.butrago@loglabdigital.com.br",
      "deuclerio.salles@loglabdigital.com.br",
      "eduarda.silva@loglabdigital.com.br",
      "hudson.rodrigues@loglabdigital.com.br",
      "iraci@loglabdigital.com.br",
      "izaide.tenutes@loglabdigital.com.br",
      "jhonatan.pinto@loglabdigital.com.br",
      "jonathan.amorim@loglabdigital.com.br",
      "juliano.reis@loglabdigital.com.br",
      "luciano.silva@loglabdigital.com.br",
      "manuela.pereira@loglabdigital.com.br",
      "mauricio.alberti@loglabdigital.com.br",
      "rafaela.rodrigues@loglabdigital.com.br",
      "tassio.almeida@loglabdigital.com.br",
      "alexandre.araujo@loglabdigital.com.br",
      "alexandre.muniz@loglabdigital.com.br",
      "antonio.onorio@loglabdigital.com.br",
      "arthur.eckart@loglabdigital.com.br",
      "cristiana.dias@loglabdigital.com.br",
      "danyllo.silva@loglabdigital.com.br",
      "diego.carvalho@loglabdigital.com.br",
      "elisson.lopes@loglabdigital.com.br",
      "erica.pereira@loglabdigital.com.br",
      "guilherme.souza@loglabdigital.com.br",
      "igor.marques@loglabdigital.com.br",
      "itamara.valensuela@loglabdigital.com.br",
      "julia.alves@loglabdigital.com.br",
      "kellen.moya@loglabdigital.com.br",
      "kerollaine.ribeiro@loglabdigital.com.br",
      "luana.mendes@loglabdigital.com.br",
      "lucas.bezerra@loglabdigital.com.br",
      "maico.mendonca@loglabdigital.com.br",
      "marcela.luz@loglabdigital.com.br",
      "marcos.juliao@loglabdigital.com.br",
      "mariana.vargas@loglabdigital.com.br",
      "patricia.sebalhos@loglabdigital.com.br",
      "pedro.dalfior@loglabdigital.com.br",
      "raquel.zampronio@loglabdigital.com.br",
      "richard.samagaia@loglabdigital.com.br",
      "roberto.castro@loglabdigital.com.br",
      "roseara.santos@loglabdigital.com.br",
      "thiago.moraes@loglabdigital.com.br",
      "victor.mattos@loglabdigital.com.br"
    ];

    // Normalizar emails para lowercase
    const normalizedKeepEmails = keepEmails.map(e => e.toLowerCase().trim());

    // Buscar todos os prestadores
    const allPrestadores = await base44.asServiceRole.entities.Colaborador.list();
    
    // Identificar quais preservar e quais deletar
    const toKeep = [];
    const toDelete = [];
    const warnings = [];

    for (const prestador of allPrestadores) {
      const emailNormalized = (prestador.email || "").toLowerCase().trim();
      if (normalizedKeepEmails.includes(emailNormalized)) {
        toKeep.push(prestador);
      } else {
        toDelete.push(prestador);
      }
    }

    // Verificar se todos os emails da lista de preservação existem
    const existingEmails = allPrestadores.map(p => (p.email || "").toLowerCase().trim());
    for (const keepEmail of normalizedKeepEmails) {
      if (!existingEmails.includes(keepEmail)) {
        warnings.push(`Email não encontrado no banco: ${keepEmail}`);
      }
    }

    // Se modo dry-run
    if (body.dryRun) {
      return Response.json({
        mode: "dry-run",
        total_prestadores: allPrestadores.length,
        a_preservar: toKeep.length,
        a_deletar: toDelete.length,
        prestadores_a_deletar: toDelete.map(p => ({
          id: p.id,
          name: p.full_name,
          email: p.email
        })),
        warnings
      });
    }

    // Executar deleção em cascata controlado
    let deletedCount = 0;
    let feedbacksDeleted = 0;
    const errors = [];

    for (const prestador of toDelete) {
      try {
        // 1. Buscar e deletar FeedbackRecords vinculados
        const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({
          employee_id: prestador.id
        });
        
        for (const feedback of feedbacks) {
          await base44.asServiceRole.entities.FeedbackRecord.delete(feedback.id);
          feedbacksDeleted++;
        }

        // 2. Deletar o prestador
        await base44.asServiceRole.entities.Colaborador.delete(prestador.id);
        deletedCount++;

      } catch (error) {
        errors.push({
          prestador_id: prestador.id,
          prestador_email: prestador.email,
          error: error.message
        });
      }
    }

    // Validação final
    const remainingPrestadores = await base44.asServiceRole.entities.Colaborador.list();

    // Log de auditoria
    const auditLog = {
      action: "CLEANUP_PRESTADORES",
      executed_by: user.id,
      executed_by_email: user.email,
      timestamp: new Date().toISOString(),
      prestadores_deletados: deletedCount,
      feedbacks_deletados: feedbacksDeleted,
      prestadores_preservados: toKeep.length,
      total_final: remainingPrestadores.length,
      warnings,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log("AUDIT LOG:", JSON.stringify(auditLog, null, 2));

    return Response.json({
      success: true,
      deleted: deletedCount,
      remaining: remainingPrestadores.length,
      expected_remaining: 73,
      match: remainingPrestadores.length === 73,
      details: {
        feedbacks_deleted: feedbacksDeleted,
        prestadores_preserved: toKeep.length,
        warnings,
        errors: errors.length > 0 ? errors : undefined
      },
      audit_log: auditLog
    });

  } catch (error) {
    console.error("Erro na limpeza:", error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});