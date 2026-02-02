import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * RN.03 - Prazo de Validação
 * Esta função verifica feedbacks com status 'pending' cujo prazo de validação expirou
 * (10 dias após a inserção) e atualiza o status para 'expired'.
 * 
 * Deve ser executada periodicamente via automation (scheduled task) - recomendado: diariamente
 * 
 * ADMIN-ONLY: Esta função deve ser invocada apenas por administradores
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticação e autorização
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Buscar todos os feedbacks pendentes
        const pendingFeedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({
            validation_status: 'pending'
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let expiredCount = 0;
        const expiredIds = [];

        for (const feedback of pendingFeedbacks) {
            if (feedback.validation_deadline) {
                const deadline = new Date(feedback.validation_deadline);
                deadline.setHours(0, 0, 0, 0);
                
                // Se a data atual é posterior ao prazo, marca como expirado
                if (today > deadline) {
                    await base44.asServiceRole.entities.FeedbackRecord.update(feedback.id, {
                        validation_status: 'expired',
                        validation_date: new Date().toISOString()
                    });
                    expiredCount++;
                    expiredIds.push(feedback.id);
                }
            }
        }

        return Response.json({
            success: true,
            message: `Verificação concluída. ${expiredCount} feedbacks marcados como expirados.`,
            expired_count: expiredCount,
            expired_ids: expiredIds,
            checked_count: pendingFeedbacks.length
        });

    } catch (error) {
        console.error('Error checking expired validations:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});