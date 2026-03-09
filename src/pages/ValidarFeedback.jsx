import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Shield, AlertCircle, Send } from "lucide-react";
import Qs90Content from "@/components/feedback/Qs90Content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ValidarFeedback() {
  const [step, setStep] = useState("email"); // email, view, completed
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [checklistAnswers, setChecklistAnswers] = useState([]);
  const [comments, setComments] = useState("");

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (!token) {
        setError("Link inválido");
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('validateFeedbackToken', { token });
      
      if (response.data.feedback) {
        setFeedback(response.data.feedback);
        
        if (response.data.feedback.workflow_status === "ASSINADO_COLABORADOR") {
          setStep("completed");
        }

        const answers = response.data.feedback.checklist_questions?.map(q => ({
          question_id: q.id,
          answer: false
        })) || [];
        setChecklistAnswers(answers);
      } else {
        setError("Token inválido ou expirado");
      }
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      setError("Digite seu email");
      return;
    }

    if (email.toLowerCase() !== feedback.employee_email.toLowerCase()) {
      setError("Email não corresponde ao colaborador deste feedback");
      return;
    }

    setStep("view");
    setError("");
  };

  const handleChecklistChange = (questionId, value) => {
    setChecklistAnswers(answers =>
      answers.map(a => a.question_id === questionId ? { ...a, answer: value } : a)
    );
  };

  const handleSubmit = async () => {
    setError("");

    const allAnswered = checklistAnswers.every(a => a.answer === true || a.answer === false);
    if (!allAnswered) {
      setError("Responda todas as perguntas do checklist");
      return;
    }

    setSubmitting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      await base44.functions.invoke('submitEmployeeValidation', {
        token,
        answers: checklistAnswers,
        comments
      });

      setStep("completed");
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao enviar validação");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Validação Concluída!</h2>
            <p className="text-slate-600">
              Seu feedback foi validado e registrado com sucesso.
            </p>
            {feedback?.employee_validation_date && (
              <p className="text-xs text-slate-500 mt-4">
                Assinado em {format(new Date(feedback.employee_validation_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: '#F8B137'}}>
              <Shield className="w-8 h-8" style={{color: '#14141E'}} />
            </div>
            <CardTitle className="text-2xl">Validação de Feedback</CardTitle>
            <p className="text-sm text-slate-500">Digite seu email para acessar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Email Corporativo</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyEmail()}
              />
            </div>

            <Button 
              onClick={handleVerifyEmail}
              disabled={verifying}
              className="w-full"
              style={{background: '#F8B137', color: '#14141E'}}
            >
              {verifying ? "Verificando..." : "Acessar Feedback"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                  {getInitials(feedback.employee_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Olá, {feedback.employee_name}!</CardTitle>
                <p className="text-sm text-slate-500">
                  Seu gestor {feedback.manager_name} registrou um feedback para você
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-6">
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
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{borderLeft: '4px solid #F8B137'}}>
          <CardHeader>
            <CardTitle>Checklist de Validação</CardTitle>
            <p className="text-sm text-slate-500">
              Confirme os itens abaixo marcando as caixas
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.checklist_questions?.map((question) => {
              const answer = checklistAnswers.find(a => a.question_id === question.id);
              return (
                <div key={question.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={answer?.answer || false}
                    onCheckedChange={(checked) => handleChecklistChange(question.id, checked)}
                    className="mt-1"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer flex-1">
                    {question.question}
                  </Label>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Seus Comentários</CardTitle>
            <p className="text-sm text-slate-500">
              Compartilhe suas impressões sobre este feedback (opcional)
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Escreva suas impressões, dúvidas ou comentários..."
              className="min-h-32"
            />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
            style={{background: '#22C55E', color: 'white'}}
            className="font-semibold"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Enviando..." : "Validar e Assinar Feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}