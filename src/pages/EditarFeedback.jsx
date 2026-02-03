import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditarFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    feedback_type: "feedback",
    checklist_questions: []
  });

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get('id');
      
      if (!templateId) {
        navigate(createPageUrl("Feedbacks"));
        return;
      }

      const templates = await base44.entities.FeedbackTemplate.filter({ id: templateId });
      
      if (!templates || templates.length === 0) {
        navigate(createPageUrl("Feedbacks"));
        return;
      }

      const template = templates[0];
      setFormData({
        title: template.title,
        feedback_type: template.feedback_type,
        checklist_questions: template.checklist_questions || []
      });
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newId = String(formData.checklist_questions.length + 1);
    setFormData({
      ...formData,
      checklist_questions: [
        ...formData.checklist_questions,
        { id: newId, question: "", required: true }
      ]
    });
  };

  const updateQuestion = (id, field, value) => {
    setFormData({
      ...formData,
      checklist_questions: formData.checklist_questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    });
  };

  const removeQuestion = (id) => {
    setFormData({
      ...formData,
      checklist_questions: formData.checklist_questions.filter(q => q.id !== id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("O título é obrigatório");
      return;
    }

    if (formData.checklist_questions.length === 0) {
      setError("Adicione pelo menos uma pergunta ao checklist");
      return;
    }

    const invalidQuestions = formData.checklist_questions.filter(q => !q.question.trim());
    if (invalidQuestions.length > 0) {
      setError("Todas as perguntas devem ser preenchidas");
      return;
    }

    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get('id');

      await base44.entities.FeedbackTemplate.update(templateId, {
        title: formData.title,
        feedback_type: formData.feedback_type,
        checklist_questions: formData.checklist_questions
      });

      navigate(createPageUrl("Feedbacks"));
    } catch (e) {
      setError(e.message || "Erro ao atualizar feedback");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
        <h1 className="text-2xl font-bold text-slate-900">Editar Feedback</h1>
        <p className="text-slate-500">Atualize as informações do feedback</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Feedback *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Feedback Trimestral Q1 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Ritual *</Label>
              <Select 
                value={formData.feedback_type} 
                onValueChange={(value) => setFormData({...formData, feedback_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feedback">Feedback Trimestral</SelectItem>
                  <SelectItem value="one_on_one">1:1</SelectItem>
                  <SelectItem value="evaluation">Avaliação de Experiência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checklist de Validação</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Perguntas que o colaborador responderá ao validar o feedback
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.checklist_questions.map((question, index) => (
              <div key={question.id} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    placeholder="Digite a pergunta..."
                  />
                </div>
                {formData.checklist_questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(createPageUrl("Feedbacks"))}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
            style={{background: '#F8B137', color: '#14141E'}}
            className="font-semibold"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}