import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, answers, comments } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({ 
      public_access_token: token 
    });
    
    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Token inválido ou expirado' }, { status: 404 });
    }

    const feedback = feedbacks[0];

    if (feedback.workflow_status === 'ASSINADO_COLABORADOR') {
      return Response.json({ 
        error: 'Este feedback já foi validado anteriormente' 
      }, { status: 400 });
    }

    await base44.asServiceRole.entities.FeedbackRecord.update(feedback.id, {
      employee_validation_answers: answers,
      employee_comments: comments,
      employee_validation_date: new Date().toISOString(),
      workflow_status: 'ASSINADO_COLABORADOR'
    });

    return Response.json({ 
      success: true,
      message: 'Validação registrada com sucesso'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});