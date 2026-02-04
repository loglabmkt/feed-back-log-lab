import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RevisarFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const params = new URLSearchParams(window.location.search);
      const feedbackId = params.get('id');
      
      if (!feedbackId) {
        navigate(createPageUrl("Feedbacks"));
        return;
      }

      const feedbackData = await base44.entities.FeedbackRecord.filter({ id: feedbackId });
      
      if (!feedbackData || feedbackData.length === 0) {
        navigate(createPageUrl("Feedbacks"));
        return;
      }

      const fb = feedbackData[0];
      setFeedback(fb);
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setError("");
    setApproving(true);

    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        workflow_status: "APROVADO",
        admin_approved_by: currentUser.id,
        admin_approved_date: new Date().toISOString()
      });

      navigate(createPageUrl("Respostas"));
    } catch (e) {
      setError(e.message || "Erro ao aprovar feedback");
    } finally {
      setApproving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Feedback não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("Feedbacks"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Revisar Feedback</h1>
            <p className="text-slate-500">Analise e aprove o feedback preenchido pelo gestor</p>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Em Revisão
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
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                {getInitials(feedback.employee_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-slate-900">{feedback.employee_name}</p>
              <p className="text-sm text-slate-500">{feedback.employee_email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Gestor: {feedback.manager_name} • Data: {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Conteúdo do Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos Fortes</Label>
            <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-slate-700 whitespace-pre-wrap">{feedback.strengths}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos de Melhoria</Label>
            <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-slate-700 whitespace-pre-wrap">{feedback.improvements}</p>
            </div>
          </div>

          {feedback.action_plan && (
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2">Plano de Ação</Label>
              <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-slate-700 whitespace-pre-wrap">{feedback.action_plan}</p>
              </div>
            </div>
          )}

          {feedback.additional_notes && (
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2">Observações</Label>
              <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-700 whitespace-pre-wrap">{feedback.additional_notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="bg-blue-50 border-blue-200 mb-6">
        <AlertDescription className="text-blue-700">
          <strong>Revisão de Conformidade:</strong> Verifique se o conteúdo está adequado às políticas da empresa antes de aprovar.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button 
          onClick={handleApprove}
          disabled={approving}
          style={{background: '#22C55E', color: 'white'}}
          className="font-semibold"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {approving ? "Aprovando..." : "Concluir e Aprovar Feedback"}
        </Button>
      </div>

      <Alert className="bg-slate-50 border-slate-200">
        <AlertDescription className="text-slate-600">
          Após a aprovação, o gestor deverá agendar uma conversa com o colaborador antes de publicar o feedback.
        </AlertDescription>
      </Alert>
    </div>
  );
}