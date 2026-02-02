import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * RN.02 - Sinalizador de Risco
 * Esta função verifica todos os colaboradores ativos e atualiza a flag compliance_risk
 * para true se o colaborador estiver há mais de 90 dias sem receber feedback.
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

        // Buscar todos os usuários ativos
        const users = await base44.asServiceRole.entities.User.filter({
            status: 'active'
        });

        const today = new Date();
        const RISK_THRESHOLD_DAYS = 90;
        
        let atRiskCount = 0;
        let compliantCount = 0;
        const updatedUsers = [];

        for (const userData of users) {
            let isAtRisk = false;

            if (!userData.last_feedback_date) {
                // Nunca recebeu feedback - está em risco
                isAtRisk = true;
            } else {
                const lastFeedbackDate = new Date(userData.last_feedback_date);
                const daysDiff = Math.floor((today - lastFeedbackDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff > RISK_THRESHOLD_DAYS) {
                    isAtRisk = true;
                }
            }

            // Só atualiza se o status mudou
            if (userData.compliance_risk !== isAtRisk) {
                await base44.asServiceRole.entities.User.update(userData.id, {
                    compliance_risk: isAtRisk
                });
                updatedUsers.push({
                    id: userData.id,
                    name: userData.full_name,
                    compliance_risk: isAtRisk
                });
            }

            if (isAtRisk) {
                atRiskCount++;
            } else {
                compliantCount++;
            }
        }

        return Response.json({
            success: true,
            message: `Verificação de risco concluída.`,
            summary: {
                total_users: users.length,
                at_risk: atRiskCount,
                compliant: compliantCount,
                compliance_rate: users.length > 0 
                    ? Math.round((compliantCount / users.length) * 100) 
                    : 0
            },
            updated_users: updatedUsers
        });

    } catch (error) {
        console.error('Error updating compliance risk:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});