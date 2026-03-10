import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

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
        setError("Token de confirmação inválido ou ausente.");
        return;
      }

      // Chama função backend que usa asServiceRole (sem exigir auth do usuário)
      const response = await base44.functions.invoke('confirmFeedbackToken', { token });
      const data = response?.data;

      if (!data?.success) {
        setStatus("error");
        setError(data?.error || "Token inválido ou expirado.");
        return;
      }

      setFeedback(data.feedback);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.response?.data?.error || err.message || "Erro ao confirmar feedback.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8B137] mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Processando sua confirmação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
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
              onClick={() => window.location.href = "/"}
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
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

            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-1">
              <p><span className="font-semibold">Prestador:</span> {feedback?.employee_name}</p>
              <p><span className="font-semibold">Data da Confirmação:</span> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>

            <p className="text-center text-sm text-slate-500">
              Seu protocolo foi arquivado e será utilizado para fins de conformidade contratual.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}