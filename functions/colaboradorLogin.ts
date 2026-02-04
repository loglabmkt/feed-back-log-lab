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

    const colaboradores = await base44.asServiceRole.entities.Colaborador.filter({ 
      email: email.toLowerCase() 
    });

    if (colaboradores.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Email não encontrado' 
      }, { status: 200 });
    }

    const colaborador = colaboradores[0];

    if (!colaborador.has_password) {
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

    if (password_hash !== colaborador.password_hash) {
      return Response.json({ 
        success: false, 
        message: 'Senha incorreta' 
      }, { status: 200 });
    }

    return Response.json({ 
      success: true,
      colaborador: {
        id: colaborador.id,
        email: colaborador.email,
        full_name: colaborador.full_name,
        company_id: colaborador.company_id,
        department: colaborador.department
      }
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
});