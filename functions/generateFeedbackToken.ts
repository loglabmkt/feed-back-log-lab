import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedback_id } = await req.json();

    if (!feedback_id) {
      return Response.json({ error: 'feedback_id é obrigatório' }, { status: 400 });
    }

    const feedbacks = await base44.entities.FeedbackRecord.filter({ id: feedback_id });
    
    if (!feedbacks || feedbacks.length === 0) {
      return Response.json({ error: 'Feedback não encontrado' }, { status: 404 });
    }

    const feedback = feedbacks[0];

    if (feedback.workflow_status !== 'CONCLUIDO_PARA_ENVIO') {
      return Response.json({ 
        error: 'Feedback ainda não foi aprovado pelo Admin' 
      }, { status: 400 });
    }

    if (user.role !== 'admin' && user.id !== feedback.manager_id) {
      return Response.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const token = crypto.randomUUID();

    await base44.asServiceRole.entities.FeedbackRecord.update(feedback_id, {
      public_access_token: token,
      public_link_generated_date: new Date().toISOString(),
      workflow_status: 'AGUARDANDO_VALIDACAO_COLABORADOR'
    });

    return Response.json({ 
      token,
      success: true 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});