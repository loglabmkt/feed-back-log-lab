import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        // Suporte para chamada manual (frontend) e automação de entidade
        let templateId;
        let template;

        // Se veio de automação de entidade
        if (payload.event && payload.data && payload.old_data) {
            const { event, data, old_data } = payload;
            
            // Verificar se is_active mudou de false para true
            const wasActivated = old_data?.is_active === false && data?.is_active === true;
            
            if (!wasActivated) {
                return Response.json({ 
                    success: true,
                    message: 'Feedback não foi ativado nesta atualização (is_active não mudou de false para true)' 
                });
            }
            
            templateId = event.entity_id;
            template = data;
        } 
        // Se veio de chamada manual do frontend
        else if (payload.templateId) {
            templateId = payload.templateId;
            
            // Buscar o template
            const templates = await base44.asServiceRole.entities.FeedbackTemplate.filter({ id: templateId });
            
            if (!templates || templates.length === 0) {
                return Response.json({ error: 'Template não encontrado' }, { status: 404 });
            }
            
            template = templates[0];
        }
        else {
            return Response.json({ 
                error: 'Payload inválido. Esperado: {templateId} ou payload de entity automation' 
            }, { status: 400 });
        }

        // Buscar APENAS gestores ativos da tabela Gestor
        const gestores = await base44.asServiceRole.entities.Gestor.filter({ status: 'active' });

        if (!gestores || gestores.length === 0) {
            return Response.json({ 
                message: 'Nenhum gestor ativo encontrado',
                success: true
            });
        }

        // Preparar tipo do feedback para exibição
        const tipoMap = {
            'feedback': 'Feedback Trimestral',
            'one_on_one': 'One-on-One',
            'evaluation': 'Avaliação de Experiência'
        };
        const tipoFeedback = tipoMap[template.feedback_type] || template.feedback_type;

        // Enviar email via Resend para cada gestor usando template
        const emailPromises = gestores.map(async (gestor) => {
            try {
                await resend.emails.send({
                    from: 'Compliance RH <marketing@loglabdigital.com.br>',
                    to: gestor.email,
                    subject: `✅ Novo Template de Feedback Disponível: ${template.title}`,
                    react: 'feedback_ativo',
                    react_props: {
                        nome_gestor: gestor.full_name,
                        titulo_template: template.title,
                        tipo_feedback: tipoFeedback,
                        num_perguntas: template.checklist_questions?.length || 0,
                        url_plataforma: `${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/gestorlogin`
                    }
                });
                return { success: true, email: gestor.email };
            } catch (emailError) {
                console.error(`Erro ao enviar email para ${gestor.email}:`, emailError);
                return { success: false, email: gestor.email, error: emailError.message };
            }
        });

        const results = await Promise.all(emailPromises);
        const successCount = results.filter(r => r.success).length;
        const failedEmails = results.filter(r => !r.success);

        return Response.json({ 
            success: true, 
            message: `Notificação enviada para ${successCount} de ${gestores.length} gestor(es)`,
            total_gestores: gestores.length,
            emails_enviados: successCount,
            falhas: failedEmails.length > 0 ? failedEmails : undefined
        });

    } catch (error) {
        console.error('Erro ao notificar gestores:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});