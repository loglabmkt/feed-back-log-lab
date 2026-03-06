import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@3.5.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Verificar se o gestor existe, está ativo e ainda não possui senha
    const gestores = await base44.asServiceRole.entities.Gestor.filter({
      email: email.toLowerCase()
    });

    if (gestores.length === 0) {
      return Response.json({ error: 'Email não encontrado no sistema. Entre em contato com o administrador.' }, { status: 404 });
    }

    const gestor = gestores[0];

    if (gestor.has_password) {
      return Response.json({ error: 'Este email já possui cadastro. Use a tela de login.' }, { status: 400 });
    }

    if (gestor.status === 'inactive') {
      return Response.json({ error: 'Gestor inativo. Entre em contato com o administrador.' }, { status: 403 });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

    // Salvar código no registro do gestor temporariamente
    await base44.asServiceRole.entities.Gestor.update(gestor.id, {
      verification_code: code,
      verification_code_expires: expiresAt
    });

    // Enviar email com o código
    await resend.emails.send({
      from: 'LogLab <noreply@loglabdigital.com.br>',
      to: gestor.email,
      subject: 'Código de verificação – LogLab',
      html: `
        <div style="font-family: 'Titillium Web', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: #14141E; padding: 32px; text-align: center;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6980e7673597ded54b61feca/68c8706a7_LOG-LAB-TECNOLOGIA-QUE-TRANSFORMA-NOVA-BRANCO-LARANJA.png" alt="LogLab" style="height: 48px; width: auto;" />
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #14141E; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Olá, ${gestor.full_name}!</h2>
            <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
              Recebemos uma solicitação para criar seu acesso como gestor na plataforma LogLab. Use o código abaixo para continuar:
            </p>
            <div style="background: #f8f9fa; border: 2px dashed #F8B137; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Seu código de verificação</p>
              <span style="color: #14141E; font-size: 40px; font-weight: 900; letter-spacing: 8px;">${code}</span>
              <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0;">Este código expira em <strong>10 minutos</strong></p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              Se você não solicitou este acesso, ignore este email. Nenhuma ação é necessária.
            </p>
          </div>
          <div style="background: #f8f9fa; padding: 20px 32px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 LogLab – Tecnologia que Transforma</p>
          </div>
        </div>
      `
    });

    return Response.json({
      success: true,
      gestor: {
        id: gestor.id,
        full_name: gestor.full_name,
        email: gestor.email
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});