import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      }, { status: 400 });
    }

    const gestores = await base44.asServiceRole.entities.Gestor.filter({ 
      email: email.toLowerCase() 
    });

    if (gestores.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Email não encontrado' 
      }, { status: 200 });
    }

    const gestor = gestores[0];

    if (!gestor.has_password) {
      return Response.json({ 
        success: false, 
        message: 'Por favor, complete seu cadastro primeiro' 
      }, { status: 200 });
    }

    // Hash the provided password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (password_hash !== gestor.password_hash) {
      return Response.json({ 
        success: false, 
        message: 'Senha incorreta' 
      }, { status: 200 });
    }

    return Response.json({ 
      success: true,
      gestor: {
        id: gestor.id,
        email: gestor.email,
        full_name: gestor.full_name,
        company_id: gestor.company_id,
        department: gestor.department
      }
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
});