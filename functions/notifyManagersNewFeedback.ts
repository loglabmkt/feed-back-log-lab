import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        // Verificar se o feedback foi ativado (is_active mudou para true)
        const { event, data, old_data } = payload;
        
        if (event.type !== 'update') {
            return Response.json({ message: 'Evento não é update' });
        }

        // Verificar se is_active mudou para true
        const wasActivated = old_data?.is_active === false && data?.is_active === true;
        
        if (!wasActivated) {
            return Response.json({ message: 'Feedback não foi ativado nesta atualização' });
        }

        // Buscar apenas usuários Base44 com role admin (que são os gestores com acesso ao sistema)
        const users = await base44.asServiceRole.entities.User.list();
        const adminUsers = users.filter(u => u.role === 'admin');

        if (!adminUsers || adminUsers.length === 0) {
            return Response.json({ 
                message: 'Nenhum administrador encontrado para notificar',
                info: 'Apenas administradores Base44 receberão notificações por email'
            });
        }

        // Enviar email para cada administrador
        const emailPromises = adminUsers.map(admin => 
            base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Compliance RH',
                to: admin.email,
                subject: `✅ Novo Template de Feedback Disponível: ${data.title}`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #F8B137;">Novo Template de Feedback Ativo</h2>
                        
                        <p>Olá, <strong>${admin.full_name}</strong>!</p>
                        
                        <p>Um novo template de feedback foi ativado e está disponível para uso pelos gestores:</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F8B137;">
                            <h3 style="margin-top: 0; color: #14141E;">${data.title}</h3>
                            <p style="margin: 10px 0;"><strong>Tipo:</strong> ${data.feedback_type === 'feedback' ? 'Feedback' : data.feedback_type === 'one_on_one' ? 'One-on-One' : 'Avaliação'}</p>
                            ${data.checklist_questions?.length > 0 ? `<p style="margin: 10px 0;"><strong>Checklist:</strong> ${data.checklist_questions.length} perguntas</p>` : ''}
                        </div>
                        
                        <p>Os gestores agora podem utilizar este template para realizar feedbacks com suas equipes.</p>
                        
                        <p style="margin-top: 30px;">
                            <a href="${Deno.env.get('BASE44_APP_URL') || 'https://seu-app.base44.com'}/painel" 
                               style="background: #F8B137; color: #14141E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Acessar Painel Administrativo
                            </a>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="color: #6b7280; font-size: 12px;">
                            Esta é uma notificação automática do sistema Compliance RH.<br>
                            Você está recebendo este email porque é administrador do sistema.
                        </p>
                    </div>
                `
            })
        );

        await Promise.all(emailPromises);

        return Response.json({ 
            success: true, 
            message: `Email de notificação enviado para ${adminUsers.length} administrador(es)`,
            emails_enviados: adminUsers.map(u => u.email)
        });

    } catch (error) {
        console.error('Erro ao notificar gestores:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});