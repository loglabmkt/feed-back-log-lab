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

        // Buscar todos os gestores ativos
        const gestores = await base44.asServiceRole.entities.Gestor.filter({ status: 'active' });

        if (!gestores || gestores.length === 0) {
            return Response.json({ message: 'Nenhum gestor ativo encontrado' });
        }

        // Buscar todos os usuários Base44 para verificar quais emails são válidos
        const users = await base44.asServiceRole.entities.User.list();
        const validEmails = new Set(users.map(u => u.email.toLowerCase()));

        // Filtrar apenas gestores que também são usuários Base44
        const validGestores = gestores.filter(gestor => 
            validEmails.has(gestor.email.toLowerCase())
        );

        if (validGestores.length === 0) {
            return Response.json({ 
                message: 'Nenhum gestor com email registrado no sistema Base44 encontrado',
                total_gestores: gestores.length,
                gestores_sem_acesso: gestores.map(g => g.email)
            });
        }

        // Enviar email para cada gestor válido
        const emailPromises = validGestores.map(gestor => 
            base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Compliance RH',
                to: gestor.email,
                subject: `✅ Novo Template de Feedback Disponível: ${data.title}`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #F8B137;">Novo Template de Feedback Ativo</h2>
                        
                        <p>Olá, <strong>${gestor.full_name}</strong>!</p>
                        
                        <p>Um novo template de feedback foi ativado e está disponível para uso:</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F8B137;">
                            <h3 style="margin-top: 0; color: #14141E;">${data.title}</h3>
                            <p style="margin: 10px 0;"><strong>Tipo:</strong> ${data.feedback_type === 'feedback' ? 'Feedback' : data.feedback_type === 'one_on_one' ? 'One-on-One' : 'Avaliação'}</p>
                            ${data.checklist_questions?.length > 0 ? `<p style="margin: 10px 0;"><strong>Checklist:</strong> ${data.checklist_questions.length} perguntas</p>` : ''}
                        </div>
                        
                        <p>Você já pode utilizar este template para realizar feedbacks com sua equipe.</p>
                        
                        <p style="margin-top: 30px;">
                            <a href="${Deno.env.get('BASE44_APP_URL') || 'https://seu-app.base44.com'}/painelgestor" 
                               style="background: #F8B137; color: #14141E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Acessar Painel do Gestor
                            </a>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="color: #6b7280; font-size: 12px;">
                            Esta é uma notificação automática do sistema Compliance RH.<br>
                            Se você não deveria receber este email, entre em contato com o administrador.
                        </p>
                    </div>
                `
            })
        );

        await Promise.all(emailPromises);

        const gestoresIgnorados = gestores.filter(g => !validEmails.has(g.email.toLowerCase()));

        return Response.json({ 
            success: true, 
            message: `Email enviado para ${validGestores.length} gestor(es)`,
            emails_enviados: validGestores.map(g => g.email),
            gestores_sem_acesso_base44: gestoresIgnorados.length > 0 ? gestoresIgnorados.map(g => g.email) : undefined
        });

    } catch (error) {
        console.error('Erro ao notificar gestores:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});