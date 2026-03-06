import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import QS45Content from "@/components/avaliacao/QS45Content";
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

export default function AcessoPublicoFeedback() {
  const [email, setEmail] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showContestDialog, setShowContestDialog] = useState(false);
  const [contestReason, setContestReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  const handleAccessRequest = async () => {
    if (!email.trim()) {
      setError("Por favor, insira seu e-mail.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const users = await base44.entities.User.filter({ email: email.toLowerCase().trim() });
      
      if (users.length === 0) {
        setError("E-mail não encontrado no sistema. Verifique e tente novamente.");
        setLoading(false);
        return;
      }

      const foundUser = users[0];
      
      if (foundUser.status !== 'active') {
        setError("Usuário inativo. Entre em contato com o RH.");
        setLoading(false);
        return;
      }

      const allFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: email.toLowerCase().trim()
      }, '-created_date');
      
      // Filtrar apenas feedbacks publicados
      const userFeedbacks = allFeedbacks.filter(f => f.workflow_status === 'PUBLICADO' || f.workflow_status === 'ASSINADO_COLABORADOR');

      setUser(foundUser);
      setFeedbacks(userFeedbacks);
      setAccessGranted(true);
    } catch (e) {
      console.error(e);
      setError("Erro ao acessar o sistema. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedFeedback) return;
    
    setProcessing(true);
    try {
      await base44.entities.FeedbackRecord.update(selectedFeedback.id, {
        validation_status: "accepted",
        validation_date: new Date().toISOString()
      });
      
      const updatedFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: email.toLowerCase().trim()
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
        validation_status: "contested",
        validation_date: new Date().toISOString(),
        contestation_reason: contestReason
      });

      await base44.entities.Justification.create({
        feedback_id: selectedFeedback.id,
        employee_id: user.id,
        employee_name: user.full_name,
        reason: contestReason,
        status: "open"
      });
      
      const updatedFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: email.toLowerCase().trim()
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
      pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
      accepted: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
      contested: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
      expired: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: AlertTriangle }
    };
    const labels = {
      pending: "Pendente",
      accepted: "Aceito",
      contested: "Contestado",
      expired: "Expirado"
    };
    const style = styles[status];
    const Icon = style.icon;
    
    return (
      <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const styles = {
      feedback: "bg-blue-50 text-blue-700 border-blue-200",
      one_on_one: "bg-purple-50 text-purple-700 border-purple-200",
      qs_45: "bg-orange-50 text-orange-700 border-orange-200"
    };
    const labels = {
      feedback: "Feedback Trimestral",
      one_on_one: "1:1",
      qs_45: "Qualidade de Serviço — 45 Dias"
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const pendingFeedbacks = feedbacks.filter(f => f.validation_status === 'pending');
  const processedFeedbacks = feedbacks.filter(f => f.validation_status !== 'pending');

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg" style={{background: '#F8B137'}}>
              <Shield className="w-8 h-8" style={{color: '#14141E'}} />
            </div>
            <CardTitle className="text-2xl font-bold" style={{color: '#14141E'}}>
              Acesso aos Feedbacks
            </CardTitle>
            <p className="text-slate-500 mt-2">
              Insira seu e-mail corporativo para visualizar seus feedbacks
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAccessRequest()}
                className="h-12"
              />
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <Button 
              onClick={handleAccessRequest}
              disabled={loading}
              className="w-full h-12 text-base font-semibold shadow-md"
              style={{background: '#F8B137', color: '#14141E'}}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Acessar Feedbacks
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                🔒 Acesso seguro e sem senha. Apenas feedbacks vinculados ao seu e-mail serão exibidos.
              </p>
            </div>
          </CardContent>
        </Card>
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
                  Olá, {user?.full_name?.split(' ')[0]}! 👋
                </h1>
                <p style={{color: '#14141E', opacity: 0.9}}>
                  Acessando como: {email}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAccessGranted(false);
                  setFeedbacks([]);
                  setUser(null);
                  setEmail("");
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
                  {feedbacks.filter(f => f.validation_status === 'accepted').length}
                </p>
                <p className="text-sm text-slate-500">Aceitos</p>
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
            {pendingFeedbacks.map((feedback) => {
              const daysUntilDeadline = feedback.validation_deadline
                ? differenceInDays(new Date(feedback.validation_deadline), new Date())
                : null;
              
              return (
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
                        {daysUntilDeadline !== null && daysUntilDeadline <= 3 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {daysUntilDeadline} dias restantes
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Processed Feedbacks */}
        {processedFeedbacks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Feedbacks Processados</h2>
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
                      {getStatusBadge(feedback.validation_status)}
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
                    {getStatusBadge(selectedFeedback.validation_status)}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedFeedback.feedback_type === 'qs_45' ? (
                    <QS45Content fb={selectedFeedback} showQualitative={false} />
                  ) : (
                    <>
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
                    </>
                  )}

                  {selectedFeedback.contestation_reason && (
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-2">Motivo da Contestação</p>
                      <p className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                        {selectedFeedback.contestation_reason}
                      </p>
                    </div>
                  )}
                </div>

                {selectedFeedback.validation_status === 'pending' && selectedFeedback.validation_deadline && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Prazo para validação: {format(new Date(selectedFeedback.validation_deadline), "dd/MM/yyyy")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedFeedback?.validation_status === 'pending' ? (
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
                    {processing ? "Processando..." : "Confirmar Realização"}
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