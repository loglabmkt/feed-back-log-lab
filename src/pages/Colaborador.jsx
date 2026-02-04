import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Mail, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Colaborador() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [colaborador, setColaborador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showContestDialog, setShowContestDialog] = useState(false);
  const [contestReason, setContestReason] = useState("");
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = localStorage.getItem('colaborador_session');
    if (!session) {
      window.location.href = '/colaboradorlogin';
      return;
    }
    
    try {
      const sessionData = JSON.parse(session);
      setColaborador(sessionData);
      
      // Buscar feedbacks PUBLICADOS do colaborador
      const userFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: sessionData.email.toLowerCase(),
        workflow_status: 'PUBLICADO'
      }, '-created_date');

      setFeedbacks(userFeedbacks);
    } catch (e) {
      console.error(e);
      window.location.href = '/colaboradorlogin';
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedFeedback) return;
    
    setProcessing(true);
    try {
      await base44.entities.FeedbackRecord.update(selectedFeedback.id, {
        workflow_status: "ASSINADO_COLABORADOR",
        employee_validation_date: new Date().toISOString()
      });
      
      const updatedFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: colaborador.email.toLowerCase(),
        workflow_status: 'PUBLICADO'
      }, '-created_date');
      setFeedbacks(updatedFeedbacks);
      
      setShowDialog(false);
      setSelectedFeedback(null);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleContest = async () => {
    if (!selectedFeedback || !contestReason.trim() || contestReason.trim().length < 50) {
      return;
    }
    
    setProcessing(true);
    try {
      await base44.entities.FeedbackRecord.update(selectedFeedback.id, {
        employee_comments: contestReason,
        workflow_status: "EM_REVISAO_ADMIN"
      });
      
      const updatedFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: colaborador.email.toLowerCase(),
        workflow_status: 'PUBLICADO'
      }, '-created_date');
      setFeedbacks(updatedFeedbacks);
      
      setShowContestDialog(false);
      setShowDialog(false);
      setSelectedFeedback(null);
      setContestReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      DISPONIVEL_PARA_GESTOR: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Clock, label: "Disponível" },
      EM_REVISAO_ADMIN: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock, label: "Em Revisão" },
      CONCLUIDO_PARA_ENVIO: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: CheckCircle, label: "Aguardando Validação" },
      AGUARDANDO_VALIDACAO_COLABORADOR: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: AlertTriangle, label: "Pendente" },
      ASSINADO_COLABORADOR: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle, label: "Assinado" }
    };
    
    const style = styles[status] || styles.DISPONIVEL_PARA_GESTOR;
    const Icon = style.icon;
    
    return (
      <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {style.label}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const styles = {
      feedback: "bg-blue-50 text-blue-700 border-blue-200",
      one_on_one: "bg-purple-50 text-purple-700 border-purple-200",
      evaluation: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
    const labels = {
      feedback: "Feedback Trimestral",
      one_on_one: "1:1",
      evaluation: "Avaliação de Experiência"
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const pendingFeedbacks = feedbacks.filter(f => 
    f.workflow_status === 'PUBLICADO'
  );
  const processedFeedbacks = feedbacks.filter(f => 
    f.workflow_status === 'ASSINADO_COLABORADOR' || 
    f.workflow_status === 'EM_REVISAO_ADMIN'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-sm" style={{background: '#F8B137'}}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#14141E'}}>
                  Olá, {colaborador?.full_name?.split(' ')[0]}! 👋
                </h1>
                <p style={{color: '#14141E', opacity: 0.9}}>
                  Acessando como: {colaborador?.email}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('colaborador_session');
                  window.location.href = '/colaboradorlogin';
                }}
                className="bg-white"
                style={{borderColor: '#14141E', color: '#14141E'}}
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{pendingFeedbacks.length}</p>
                <p className="text-sm text-slate-500">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {feedbacks.filter(f => f.workflow_status === 'ASSINADO_COLABORADOR').length}
                </p>
                <p className="text-sm text-slate-500">Assinados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{feedbacks.length}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Feedbacks */}
        {pendingFeedbacks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Feedbacks Pendentes de Validação</h2>
            {pendingFeedbacks.map((feedback) => (
              <Card 
                key={feedback.id} 
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4"
                style={{borderLeftColor: '#F8B137'}}
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-white font-semibold" style={{background: '#F8B137'}}>
                          {getInitials(feedback.manager_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">Feedback de {feedback.manager_name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      {getTypeBadge(feedback.feedback_type)}
                      {getStatusBadge(feedback.workflow_status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Processed Feedbacks */}
        {processedFeedbacks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Histórico de Feedbacks</h2>
            {processedFeedbacks.map((feedback) => (
              <Card 
                key={feedback.id} 
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-slate-600 text-white font-semibold">
                          {getInitials(feedback.manager_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">Feedback de {feedback.manager_name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(feedback.feedback_type)}
                      {getStatusBadge(feedback.workflow_status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {feedbacks.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-lg text-slate-500">Nenhum feedback registrado ainda</p>
            </CardContent>
          </Card>
        )}

        {/* View/Validate Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Feedback</DialogTitle>
            </DialogHeader>
            
            {selectedFeedback && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-white text-lg font-semibold" style={{background: '#F8B137'}}>
                      {getInitials(selectedFeedback.manager_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Feedback de {selectedFeedback.manager_name}</p>
                    <p className="text-sm text-slate-500">
                      {selectedFeedback.feedback_date && format(new Date(selectedFeedback.feedback_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Tipo</p>
                    {getTypeBadge(selectedFeedback.feedback_type)}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Status</p>
                    {getStatusBadge(selectedFeedback.workflow_status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Pontos Fortes</p>
                    <p className="text-slate-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      {selectedFeedback.strengths}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Pontos de Melhoria</p>
                    <p className="text-slate-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                      {selectedFeedback.improvements}
                    </p>
                  </div>

                  {selectedFeedback.action_plan && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Plano de Ação (PDI)</p>
                      <p className="text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        {selectedFeedback.action_plan}
                      </p>
                    </div>
                  )}

                  {selectedFeedback.additional_notes && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Observações</p>
                      <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {selectedFeedback.additional_notes}
                      </p>
                    </div>
                  )}

                  {selectedFeedback.employee_comments && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Seus Comentários</p>
                      <p className="text-slate-600 bg-purple-50 p-4 rounded-xl border border-purple-100">
                        {selectedFeedback.employee_comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedFeedback?.workflow_status === 'PUBLICADO' ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowContestDialog(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Contestar
                  </Button>
                  <Button 
                    onClick={handleAccept}
                    className="font-semibold shadow-md"
                    style={{background: '#F8B137', color: '#14141E'}}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processing ? "Processando..." : "Confirmar e Assinar"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contest Dialog */}
        <Dialog open={showContestDialog} onOpenChange={setShowContestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contestar Feedback</DialogTitle>
              <DialogDescription>
                Explique o motivo da contestação. Mínimo de 50 caracteres. Este texto será enviado ao RH para análise.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-2">
              <Textarea
                value={contestReason}
                onChange={(e) => setContestReason(e.target.value)}
                placeholder="Descreva detalhadamente o motivo da contestação..."
                className="min-h-32"
              />
              <p className="text-xs text-slate-500">
                {contestReason.length}/50 caracteres mínimos
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowContestDialog(false);
                setContestReason("");
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleContest}
                className="bg-red-600 hover:bg-red-700"
                disabled={processing || contestReason.trim().length < 50}
              >
                {processing ? "Enviando..." : "Enviar Contestação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}