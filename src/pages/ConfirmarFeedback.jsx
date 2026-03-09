import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ConfirmarFeedback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    confirmFeedback();
  }, [token]);

  const confirmFeedback = async () => {
    try {
      if (!token) {
        setStatus("error");
        setError("Token de confirmação inválido");
        return;
      }

      // Buscar feedback com este token
      const feedbacks = await base44.asServiceRole.entities.FeedbackRecord.filter({
        public_access_token: token
      });

      if (!feedbacks || feedbacks.length === 0) {
        setStatus("error");
        setError("Feedback não encontrado ou token expirado");
        return;
      }

      const fb = feedbacks[0];
      setFeedback(fb);

      // Atualizar status para confirmado
      await base44.asServiceRole.entities.FeedbackRecord.update(fb.id, {
        workflow_status: "ASSINADO_COLABORADOR"
      });

      // Enviar email de confirmação para Haisa e Rodolpho
      await base44.functions.invoke('notifyAdminsConfirmationReceived', {
        feedbackId: fb.id,
        employeeName: fb.employee_name
      }).catch(() => {});

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Erro ao confirmar feedback");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8B137] mx-auto mb-4"></div>
              <p className="text-slate-600">Processando sua confirmação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Erro na Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = createPageUrl("Painel")}
            >
              Voltar ao Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-slate-900">
              Confirmação Recebida!
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-slate-600">
              Agradecemos por confirmar o recebimento da sua avaliação de desempenho.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Feedback ID:</span> {feedback?.id}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                <span className="font-semibold">Data da Confirmação:</span> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            <p className="text-center text-sm text-slate-500">
              Seu protocolo foi arquivado e será utilizado para fins de conformidade contratual.
            </p>

            <Button 
              className="w-full bg-[#F8B137] hover:bg-[#e6a030] text-[#14141E]"
              onClick={() => window.location.href = createPageUrl("Painel")}
            >
              Voltar ao Painel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}