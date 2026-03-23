import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.1';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

function buildInviteEmailHtml(nomeGestor) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; background: #f9fafb; padding: 30px 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: #14141E; padding: 24px 30px; text-align: center;">
            <h1 style="color: #F8B137; margin: 0; font-size: 22px; letter-spacing: 0.5px;">Log Lab Digital</h1>
            <p style="color: #aaa; margin: 6px 0 0 0; font-size: 13px;">Log Lab</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">Olá, <strong>${nomeGestor}</strong>,</p>
            <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
              Informamos que você foi adicionado como gestor para gerenciar e responder as avaliações do seu time.
              Acesse o sistema através do link abaixo e crie sua conta.
            </p>
            <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
              Esta análise é fundamental para o controle de qualidade das entregas previstas em contrato.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://feedback.loglabdigital.com.br/gestorcadastro"
                 style="display: inline-block; background: #F8B137; color: #14141E; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; letter-spacing: 0.3px;">
                Acessar e Criar sua Conta
              </a>
            </div>
            <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
              Se você não esperava este e-mail, pode ignorá-lo com segurança.
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 16px 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              LogLab Digital · Este é um email automático, não responda.
            </p>
          </div>
        </div>
      </div>
    `;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { gestorId } = await req.json();

        if (!gestorId) {
            return Response.json({ error: 'gestorId é obrigatório' }, { status: 400 });
        }

        const gestores = await base44.asServiceRole.entities.Gestor.filter({ id: gestorId });
        if (!gestores || gestores.length === 0) {
            return Response.json({ error: 'Gestor não encontrado' }, { status: 404 });
        }
        const gestor = gestores[0];

        await resend.emails.send({
            from: 'noreply@loglabdigital.com.br',
            to: gestor.email,
            subject: 'Você foi adicionado no painel de gestor, crie sua conta!',
            html: buildInviteEmailHtml(gestor.full_name || 'Gestor')
        });

        const enviadoEm = new Date().toISOString();
        await base44.asServiceRole.entities.Gestor.update(gestorId, {
            ultimo_convite_enviado_em: enviadoEm
        });

        return Response.json({
            success: true,
            gestorId: gestor.id,
            gestorNome: gestor.full_name,
            emailEnviado: gestor.email,
            enviadoEm
        });

    } catch (error) {
        console.error('Erro ao enviar convite:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});