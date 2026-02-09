import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verificar se é admin
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores podem resetar senhas.' }, { status: 403 });
    }

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return Response.json({ error: 'Email e nova senha são obrigatórios' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    // Buscar o gestor
    const gestores = await base44.asServiceRole.entities.Gestor.filter({ 
      email: email.toLowerCase() 
    });

    if (gestores.length === 0) {
      return Response.json({ error: 'Gestor não encontrado' }, { status: 404 });
    }

    const gestor = gestores[0];

    // Hash da nova senha
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Atualizar senha
    await base44.asServiceRole.entities.Gestor.update(gestor.id, {
      password_hash,
      has_password: true
    });

    return Response.json({ 
      success: true,
      message: `Senha do gestor ${email} alterada com sucesso.`
    }, { status: 200 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});