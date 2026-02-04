import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Link as LinkIcon, Copy, CheckCircle, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VisualizarFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicLink, setPublicLink] = useState("");

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

      if (fb.public_access_token) {
        const link = `${window.location.origin}${createPageUrl("ValidarFeedback")}?token=${fb.public_access_token}`;
        setPublicLink(link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateFeedbackToken', { 
        feedback_id: feedback.id 
      });

      const link = `${window.location.origin}${createPageUrl("ValidarFeedback")}?token=${response.data.token}`;
      setPublicLink(link);
      
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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

  const isManager = currentUser?.id === feedback.manager_id;
  const isAdmin = currentUser?.role === 'admin';
  const canGenerateLink = (isManager || isAdmin) && feedback.workflow_status === "CONCLUIDO_PARA_ENVIO";
  const linkGenerated = !!feedback.public_access_token;

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
            <h1 className="text-2xl font-bold text-slate-900">Detalhes do Feedback</h1>
            <p className="text-slate-500">Visualize e gerencie o feedback</p>
          </div>
          <Button 
            onClick={handlePrint}
            variant="outline"
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

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
                Gestor: {feedback.manager_name}
                {feedback.feedback_date && ` • Data: ${format(new Date(feedback.feedback_date), "dd/MM/yyyy")}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos Fortes</Label>
            <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-slate-700 whitespace-pre-wrap">{feedback.strengths || "Não preenchido"}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos de Melhoria</Label>
            <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-slate-700 whitespace-pre-wrap">{feedback.improvements || "Não preenchido"}</p>
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

          {feedback.admin_review_notes && (
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2">Notas da Revisão (Admin)</Label>
              <div className="mt-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-slate-700 whitespace-pre-wrap">{feedback.admin_review_notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canGenerateLink && !linkGenerated && (
        <Card className="border-0 shadow-sm" style={{borderLeft: '4px solid #F8B137'}}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Feedback Aprovado</h3>
                <p className="text-sm text-slate-600">
                  O Admin concluiu a revisão. Gere o link de acesso para o colaborador validar o feedback.
                </p>
              </div>
              <Button 
                onClick={handleGenerateLink}
                disabled={generating}
                style={{background: '#F8B137', color: '#14141E'}}
                className="font-semibold"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                {generating ? "Gerando..." : "Gerar Link de Acesso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {linkGenerated && (
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="w-5 h-5" />
              Link de Acesso Gerado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Link Público para o Colaborador</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  value={publicLink}
                  readOnly
                  className="bg-white"
                />
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Envie este link para {feedback.employee_name} ({feedback.employee_email})
              </p>
            </div>

            {feedback.workflow_status === "ASSINADO_COLABORADOR" && (
              <Alert className="bg-white border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  Feedback validado e assinado pelo colaborador em{' '}
                  {feedback.employee_validation_date && format(new Date(feedback.employee_validation_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}