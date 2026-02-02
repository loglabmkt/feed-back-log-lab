import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ValidationPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showContestDialog, setShowContestDialog] = useState(false);
  const [contestReason, setContestReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const myFeedbacks = await base44.entities.FeedbackRecord.filter({
        employee_email: user.email
      }, '-created_date');

      setFeedbacks(myFeedbacks);
    } catch (e) {
      console.error(e);
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
      
      await loadData();
      setShowDialog(false);
      setSelectedFeedback(null);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleContest = async () => {
    if (!selectedFeedback || !contestReason.trim()) return;
    
    setProcessing(true);
    try {
      await base44.entities.FeedbackRecord.update(selectedFeedback.id, {
        validation_status: "contested",
        validation_date: new Date().toISOString(),
        contestation_reason: contestReason
      });

      // Create justification record
      await base44.entities.Justification.create({
        feedback_id: selectedFeedback.id,
        employee_id: currentUser.id,
        employee_name: currentUser.full_name,
        reason: contestReason,
        status: "open"
      });
      
      await loadData();
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
      evaluation: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
    const labels = {
      feedback: "Feedback",
      one_on_one: "1:1",
      evaluation: "Avaliação"
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const pendingFeedbacks = feedbacks.filter(f => f.validation_status === 'pending');
  const processedFeedbacks = feedbacks.filter(f => f.validation_status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Validação de Feedbacks</h1>
        <p className="text-slate-500">Revise e valide os feedbacks recebidos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendingFeedbacks.length}</p>
              <p className="text-xs text-slate-500">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {feedbacks.filter(f => f.validation_status === 'accepted').length}
              </p>
              <p className="text-xs text-slate-500">Aceitos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {feedbacks.filter(f => f.validation_status === 'contested').length}
              </p>
              <p className="text-xs text-slate-500">Contestados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pendingFeedbacks.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingFeedbacks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingFeedbacks.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
                <p className="text-slate-500">Nenhum feedback pendente de validação</p>
              </CardContent>
            </Card>
          ) : (
            pendingFeedbacks.map((feedback) => {
              const daysUntilDeadline = feedback.validation_deadline
                ? differenceInDays(new Date(feedback.validation_deadline), new Date())
                : null;
              
              return (
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
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
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
                        {daysUntilDeadline !== null && daysUntilDeadline <= 3 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {daysUntilDeadline} dias restantes
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-600 line-clamp-2">{feedback.strengths}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedFeedbacks.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Nenhum feedback processado ainda</p>
              </CardContent>
            </Card>
          ) : (
            processedFeedbacks.map((feedback) => (
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
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
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
            ))
          )}
        </TabsContent>
      </Tabs>

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
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
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
                    <p className="text-sm font-semibold text-slate-700 mb-2">Plano de Ação</p>
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
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={processing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing ? "Processando..." : "Confirmar Feedback"}
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
              Explique o motivo da contestação. Este texto será enviado ao RH para análise.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={contestReason}
              onChange={(e) => setContestReason(e.target.value)}
              placeholder="Descreva detalhadamente o motivo da contestação..."
              className="min-h-32"
            />
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
              disabled={processing || !contestReason.trim()}
            >
              {processing ? "Enviando..." : "Enviar Contestação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}