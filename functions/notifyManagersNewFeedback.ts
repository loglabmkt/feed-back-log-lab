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
                    from: 'Compliance RH <noreply@loglabdigital.com.br>',
                    to: gestor.email,
                    subject: `✅ Novo Template de Feedback Disponível: ${template.title}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                          <h2 style="color: #14141E; margin-bottom: 20px;">Olá</h2>
                          
                          <p style="color: #333; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                            Existe um formulário de Feedback disponível para você responder aos seus colaboradores, você tem até <strong>01/01/2026</strong> para responder.
                          </p>
                          
                          <div style="margin: 30px 0; text-align: center;">
                            <a href="https://feedback.loglabdigital.com.br/PainelGestor" 
                               style="background: #F8B137; color: #14141E; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                              Acessar Sistema
                            </a>
                          </div>
                          
                          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                            <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                              <strong>Template:</strong> ${template.title}
                            </p>
                            <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                              <strong>Tipo:</strong> ${tipoFeedback}
                            </p>
                          </div>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                          LogLab Digital - Sistema de Compliance RH
                        </p>
                      </div>
                    `
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