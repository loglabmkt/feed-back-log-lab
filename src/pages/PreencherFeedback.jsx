import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function PreencherFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    feedback_date: format(new Date(), "yyyy-MM-dd"),
    strengths: "",
    improvements: "",
    action_plan: "",
    additional_notes: ""
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
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

      if (fb.strengths) {
        setFormData({
          feedback_date: fb.feedback_date || format(new Date(), "yyyy-MM-dd"),
          strengths: fb.strengths || "",
          improvements: fb.improvements || "",
          action_plan: fb.action_plan || "",
          additional_notes: fb.additional_notes || ""
        });
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sendToAdmin = false) => {
    setError("");

    if (sendToAdmin) {
      if (!formData.strengths.trim() || !formData.improvements.trim()) {
        setError("Preencha os campos obrigatórios antes de enviar");
        return;
      }

      if (formData.strengths.trim().length < 50 || formData.improvements.trim().length < 50) {
        setError("Os campos devem ter no mínimo 50 caracteres");
        return;
      }
    }

    setSaving(true);
    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        ...formData,
        workflow_status: sendToAdmin ? "EM_REVISAO_ADMIN" : "DISPONIVEL_PARA_GESTOR"
      });

      navigate(createPageUrl("Feedbacks"));
    } catch (e) {
      setError(e.message || "Erro ao salvar feedback");
    } finally {
      setSaving(false);
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

  const canEdit = feedback.workflow_status === "DISPONIVEL_PARA_GESTOR";

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
            <h1 className="text-2xl font-bold text-slate-900">Preencher Feedback</h1>
            <p className="text-slate-500">Complete as informações do feedback</p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {canEdit ? "Em Edição" : "Em Revisão"}
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Formulário de Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data de Realização *</Label>
            <Input
              type="date"
              value={formData.feedback_date}
              onChange={(e) => setFormData({...formData, feedback_date: e.target.value})}
              max={format(new Date(), "yyyy-MM-dd")}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label>Pontos Fortes * (mínimo 50 caracteres)</Label>
            <Textarea
              value={formData.strengths}
              onChange={(e) => setFormData({...formData, strengths: e.target.value})}
              placeholder="Descreva os pontos fortes identificados..."
              className="min-h-32"
              disabled={!canEdit}
            />
            <p className="text-xs text-slate-500">{formData.strengths.length}/50 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Pontos de Melhoria * (mínimo 50 caracteres)</Label>
            <Textarea
              value={formData.improvements}
              onChange={(e) => setFormData({...formData, improvements: e.target.value})}
              placeholder="Descreva os pontos de melhoria identificados..."
              className="min-h-32"
              disabled={!canEdit}
            />
            <p className="text-xs text-slate-500">{formData.improvements.length}/50 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Plano de Ação (PDI)</Label>
            <Textarea
              value={formData.action_plan}
              onChange={(e) => setFormData({...formData, action_plan: e.target.value})}
              placeholder="Descreva o plano de ação acordado..."
              className="min-h-24"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
              placeholder="Observações adicionais (opcional)..."
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={saving || formData.strengths.trim().length < 50 || formData.improvements.trim().length < 50}
            style={{background: '#F8B137', color: '#14141E'}}
            className="font-semibold"
          >
            <Send className="w-4 h-4 mr-2" />
            {saving ? "Enviando..." : "Enviar para Revisão"}
          </Button>
        </div>
      )}
    </div>
  );
}