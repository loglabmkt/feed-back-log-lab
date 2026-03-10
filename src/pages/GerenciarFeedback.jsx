import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  Send,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import GestorLayout from "@/components/GestorLayout";
import FeedbackContentSummary from "@/components/feedback/FeedbackContentSummary";

export default function GerenciarFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [gestor, setGestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [showFullContent, setShowFullContent] = useState(false);
  const [showConversationNotes, setShowConversationNotes] = useState(false);
  const [conversationNotes, setConversationNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem('gestor_session');
    if (!session) {
      window.location.href = '/gestorlogin';
      return;
    }
    setGestor(JSON.parse(session));
  };

  const loadData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const feedbackId = params.get('id');
      
      if (!feedbackId) {
        navigate(createPageUrl("GestorFeedbacks"));
        return;
      }

      const feedbackData = await base44.entities.FeedbackRecord.filter({ id: feedbackId });
      
      if (!feedbackData || feedbackData.length === 0) {
        navigate(createPageUrl("GestorFeedbacks"));
        return;
      }

      const fb = feedbackData[0];
      setFeedback(fb);
      
      if (fb.conversation_scheduled_date) {
        setScheduledDate(new Date(fb.conversation_scheduled_date).toISOString().split('T')[0]);
      }
      if (fb.manager_conversation_notes) {
        setConversationNotes(fb.manager_conversation_notes);
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      setError("Por favor, selecione uma data para a conversa");
      return;
    }

    setError("");
    setProcessing(true);

    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        workflow_status: "CONVERSA_AGENDADA",
        conversation_scheduled_date: new Date(scheduledDate).toISOString()
      });

      // Enviar email para o colaborador
      try {
        await base44.functions.invoke('notifyEmployeeScheduledConversation', {
          feedbackId: feedback.id,
          scheduledDate: scheduledDate
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Não bloqueia o fluxo se o email falhar
      }

      await loadData();
    } catch (e) {
      setError(e.message || "Erro ao agendar conversa");
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    setError("");
    setProcessing(true);

    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        workflow_status: "CONVERSA_REALIZADA",
        conversation_completed_date: new Date().toISOString()
      });

      await loadData();
    } catch (e) {
      setError(e.message || "Erro ao marcar conversa como realizada");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveConversationNotes = async () => {
    if (!conversationNotes.trim()) return;
    setSavingNotes(true);
    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        manager_conversation_notes: conversationNotes.trim()
      });
      setFeedback(prev => ({ ...prev, manager_conversation_notes: conversationNotes.trim() }));
      setShowConversationNotes(false);
    } catch (e) {
      setError(e.message || "Erro ao salvar comentário");
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePublish = async () => {
    setError("");
    setProcessing(true);

    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        workflow_status: "PUBLICADO",
        published_date: new Date().toISOString()
      });

      // Enviar email com link de validação para o colaborador/prestador
      try {
        await base44.functions.invoke('sendFeedbackToPrestador', {
          feedbackId: feedback.id,
          baseUrl: window.location.origin
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }

      await loadData();
    } catch (e) {
      setError(e.message || "Erro ao enviar feedback");
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <GestorLayout currentPage="feedbacks" gestor={gestor}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
        </div>
      </GestorLayout>
    );
  }

  if (!feedback) {
    return (
      <GestorLayout currentPage="feedbacks" gestor={gestor}>
        <div className="text-center py-12">
          <p className="text-slate-500">Feedback não encontrado</p>
        </div>
      </GestorLayout>
    );
  }

  return (
    <GestorLayout currentPage="feedbacks" gestor={gestor}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl("GestorFeedbacks"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gerenciar Feedback</h1>
              <p className="text-slate-500">Controle o fluxo de governança do feedback</p>
            </div>
            <Badge 
              className={
                feedback.workflow_status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                feedback.workflow_status === 'CONVERSA_AGENDADA' ? 'bg-purple-100 text-purple-700' :
                'bg-indigo-100 text-indigo-700'
              }
            >
              {feedback.workflow_status === 'APROVADO' ? 'Aprovado' :
               feedback.workflow_status === 'CONVERSA_AGENDADA' ? 'Conversa Agendada' :
               'Conversa Realizada'}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Informações do Colaborador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-white text-lg font-semibold" style={{background: '#F8B137'}}>
                  {getInitials(feedback.employee_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-slate-900">{feedback.employee_name}</p>
                <p className="text-sm text-slate-500">{feedback.employee_email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Template: {feedback.template_title} • Data: {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Resumo da Avaliação</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-xs gap-1"
              >
                {showFullContent ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showFullContent ? "Ocultar Avaliação" : "Ver Avaliação Completa"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FeedbackContentSummary feedback={feedback} expanded={showFullContent} />
          </CardContent>
        </Card>

        {/* Calibragem do Administrador — exibida ao gestor após aprovação */}
        {feedback.admin_director_notes && (
          <Card className="border-0 shadow-sm" style={{borderLeft: '4px solid #8B5CF6', background: '#faf5ff'}}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2" style={{color: '#7C3AED'}}>
                <SlidersHorizontal className="w-4 h-4" />
                Calibragem do Administrador
              </CardTitle>
              <p className="text-xs text-purple-400">Comentário do administrador sobre este feedback</p>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white rounded-xl border border-purple-100 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                {feedback.admin_director_notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stepper de Ações */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Etapas de Governança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Etapa 1: Agendar Conversa */}
            <div className={`p-6 rounded-xl border-2 transition-all ${
              feedback.workflow_status === 'APROVADO' 
                ? 'border-[#F8B137] bg-amber-50' 
                : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  feedback.workflow_status === 'APROVADO'
                    ? 'bg-[#F8B137] text-white'
                    : feedback.workflow_status === 'CONVERSA_AGENDADA' || feedback.workflow_status === 'CONVERSA_REALIZADA'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">1. Agendar Conversa</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Defina uma data para conversar com o colaborador antes de publicar o feedback.
                  </p>
                  {feedback.workflow_status === 'APROVADO' && (
                    <div className="space-y-3">
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="max-w-xs"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Button
                        onClick={handleSchedule}
                        disabled={processing || !scheduledDate}
                        style={{background: '#F8B137', color: '#14141E'}}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {processing ? "Agendando..." : "Agendar Conversa"}
                      </Button>
                    </div>
                  )}
                  {(feedback.workflow_status === 'CONVERSA_AGENDADA' || feedback.workflow_status === 'CONVERSA_REALIZADA') && (
                    <Badge className="bg-purple-100 text-purple-700">
                      ✓ Agendado para {feedback.conversation_scheduled_date && format(new Date(feedback.conversation_scheduled_date), "dd/MM/yyyy")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Etapa 2: Marcar Conversa como Realizada */}
            <div className={`p-6 rounded-xl border-2 transition-all ${
              feedback.workflow_status === 'CONVERSA_AGENDADA' 
                ? 'border-[#F8B137] bg-amber-50' 
                : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  feedback.workflow_status === 'CONVERSA_AGENDADA'
                    ? 'bg-[#F8B137] text-white'
                    : feedback.workflow_status === 'CONVERSA_REALIZADA'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">2. Conversa Realizada</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Após realizar a conversa com o colaborador, confirme aqui para liberar a publicação.
                  </p>
                  {feedback.workflow_status === 'CONVERSA_AGENDADA' && (
                    <Button
                      onClick={handleMarkAsCompleted}
                      disabled={processing}
                      style={{background: '#F8B137', color: '#14141E'}}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {processing ? "Processando..." : "Marcar como Realizada"}
                    </Button>
                  )}
                  {feedback.workflow_status === 'CONVERSA_REALIZADA' && (
                    <div className="space-y-3">
                      <Badge className="bg-indigo-100 text-indigo-700">
                        ✓ Realizada em {feedback.conversation_completed_date && format(new Date(feedback.conversation_completed_date), "dd/MM/yyyy")}
                      </Badge>

                      {/* Comentário salvo */}
                      {feedback.manager_conversation_notes && !showConversationNotes && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Comentário da conversa:</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{feedback.manager_conversation_notes}</p>
                          <button
                            onClick={() => { setConversationNotes(feedback.manager_conversation_notes); setShowConversationNotes(true); }}
                            className="mt-1 text-xs text-blue-500 hover:text-blue-700 underline"
                          >
                            Editar comentário
                          </button>
                        </div>
                      )}

                      {/* Botão adicionar comentário */}
                      {!showConversationNotes && !feedback.manager_conversation_notes && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowConversationNotes(true)}
                          className="gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Adicionar Comentários
                        </Button>
                      )}

                      {/* Caixa de comentário */}
                      {showConversationNotes && (
                        <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <Label className="text-sm font-semibold text-slate-700">Comentário sobre a conversa realizada</Label>
                          <p className="text-xs text-slate-500">Este comentário ficará visível para o administrador na avaliação do colaborador.</p>
                          <Textarea
                            value={conversationNotes}
                            onChange={(e) => setConversationNotes(e.target.value)}
                            placeholder="Descreva como foi a conversa, pontos discutidos, reações do colaborador..."
                            className="min-h-[100px] resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowConversationNotes(false)}>Cancelar</Button>
                            <Button
                              size="sm"
                              onClick={handleSaveConversationNotes}
                              disabled={savingNotes || !conversationNotes.trim()}
                              style={{background: '#14141E', color: 'white'}}
                            >
                              {savingNotes ? "Salvando..." : "Salvar Comentário"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Etapa 3: Publicar Feedback */}
            <div className={`p-6 rounded-xl border-2 transition-all ${
              feedback.workflow_status === 'CONVERSA_REALIZADA' 
                ? 'border-[#F8B137] bg-amber-50' 
                : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  feedback.workflow_status === 'CONVERSA_REALIZADA'
                    ? 'bg-[#F8B137] text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  <Send className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">3. Enviar Feedback</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Envie o feedback para o prestador validar que concluiu todas as etapas da avaliação.
                  </p>
                  {feedback.workflow_status === 'CONVERSA_REALIZADA' && (
                    <Button
                      onClick={handlePublish}
                      disabled={processing}
                      style={{background: '#22C55E', color: 'white'}}
                      className="font-semibold"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {processing ? "Enviando..." : "Enviar Agora"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapa 4: Validação Confirmada */}
        {(feedback.workflow_status === 'PUBLICADO' || feedback.workflow_status === 'ASSINADO_COLABORADOR') && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className={`p-6 rounded-xl border-2 transition-all ${
                feedback.workflow_status === 'ASSINADO_COLABORADOR'
                  ? 'border-green-400 bg-green-50'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    feedback.workflow_status === 'ASSINADO_COLABORADOR'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">4. Validação Confirmada</h3>
                    {feedback.workflow_status === 'PUBLICADO' && (
                      <div className="space-y-2">
                        <Badge className="bg-yellow-100 text-yellow-700">⏳ Aguardando confirmação do prestador</Badge>
                        <p className="text-sm text-slate-500">O email com o link de validação foi enviado para <strong>{feedback.employee_email}</strong>.</p>
                      </div>
                    )}
                    {feedback.workflow_status === 'ASSINADO_COLABORADOR' && (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-700">✓ Prestador confirmou o recebimento</Badge>
                        {feedback.employee_validation_date && (
                          <p className="text-sm text-slate-500">
                            Confirmado em {format(new Date(feedback.employee_validation_date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        )}
                        {feedback.employee_comments && (
                          <div className="p-3 bg-white rounded-lg border border-green-200">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Comentário do prestador:</p>
                            <p className="text-sm text-slate-700">{feedback.employee_comments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {feedback.workflow_status !== 'PUBLICADO' && feedback.workflow_status !== 'ASSINADO_COLABORADOR' && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              <strong>Importante:</strong> Siga todas as etapas em ordem. O colaborador receberá o link de validação por email após o envio.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </GestorLayout>
  );
}