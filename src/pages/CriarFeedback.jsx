import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trash2, ArrowLeft, Info } from "lucide-react";
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

const DEFAULT_EXP45_ITEMS = [
  { id: "e1",  label: "1",  description: "Assimilação do escopo das atividades contratadas com facilidade e rapidez." },
  { id: "e2",  label: "2",  description: "Atuação colaborativa com a equipe, sem necessidade de solicitação expressa." },
  { id: "e3",  label: "3",  description: "Empenho, envolvimento e comprometimento na execução dos serviços." },
  { id: "e4",  label: "4",  description: "Elevado nível de qualidade na entrega dos resultados acordados." },
  { id: "e5",  label: "5",  description: "Articulação com outros prestadores, empresas do ecossistema e parceiros." },
  { id: "e6",  label: "6",  description: "Superação de obstáculos, identificando alternativas de solução." },
  { id: "e7",  label: "7",  description: "Conclusividade e comprometimento com os resultados finais." },
  { id: "e8",  label: "8",  description: "Atuação que agrega valor ao projeto e às entregas ao cliente." },
  { id: "e9",  label: "9",  description: "Conhecimento técnico adequado e busca por atualização." },
  { id: "e10", label: "10", description: "Agilidade na identificação e geração de soluções para problemas." },
  { id: "e11", label: "11", description: "Organização das atividades e gestão de documentos/informações." },
  { id: "e12", label: "12", description: "Iniciativa e motivação para entregar acima do mínimo esperado." },
  { id: "e13", label: "13", description: "Cumprimento de prazos acordados e compromissos assumidos." },
];

export default function CriarFeedback() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    feedback_type: "feedback",
    checklist_questions: [
      { id: "1", question: "O gestor realizou a reunião presencial/online?", required: true },
      { id: "2", question: "O plano de ação foi discutido e acordado?", required: true }
    ]
  });

  const handleTypeChange = (value) => {
    // Se mudar para experience_45d, pré-preenche o título
    if (value === "experience_45d") {
      setFormData({ ...formData, feedback_type: value, title: "Avaliação de Qualidade de Serviço — 45 Dias" });
    } else if (value === "experience_90d") {
      setFormData({ ...formData, feedback_type: value, title: "Avaliação de Qualidade de Serviço — Período Inicial 90 Dias" });
    } else {
      setFormData({ ...formData, feedback_type: value });
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

    if (formData.feedback_type !== "experience_45d" && formData.checklist_questions.length === 0) {
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
      const currentUser = await base44.auth.me();

      const payload = {
        title: formData.title,
        feedback_type: formData.feedback_type,
        checklist_questions: formData.checklist_questions,
        is_active: false,
        created_by_admin: currentUser.id
      };

      // Se for Avaliação 45 Dias, salva os 13 itens padrão editáveis
      if (formData.feedback_type === "experience_45d") {
        payload.exp45_items_config = DEFAULT_EXP45_ITEMS;
      }

      await base44.entities.FeedbackTemplate.create(payload);
      navigate(createPageUrl("Feedbacks"));
    } catch (e) {
      setError(e.message || "Erro ao criar feedback");
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900">Criar Novo Feedback</h1>
        <p className="text-slate-500">Defina o título, tipo e configure o checklist de validação</p>
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
              onValueChange={handleTypeChange}
              >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">Feedback Trimestral</SelectItem>
                <SelectItem value="one_on_one">1:1</SelectItem>
                <SelectItem value="evaluation">Avaliação Trimestral</SelectItem>
                <SelectItem value="experience_45d">Avaliação 45 Dias</SelectItem>
                <SelectItem value="experience_90d">Avaliação 90 Dias (Decisória)</SelectItem>
              </SelectContent>
              </Select>
              {formData.feedback_type === "experience_45d" && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Os 13 itens de avaliação serão criados automaticamente com os critérios padrão. Você poderá editá-los depois em "Editar".</span>
              </div>
              )}
              {formData.feedback_type === "experience_90d" && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><strong>Instrumento Decisório.</strong> Contém os 13 itens do instrumento LOGLAB_QS_90, Bloco 14 (Comentários – uso interno) e Bloco 15 (Decisão Contratual). Blocos 14 e 15 são bloqueados para o Prestador de Serviços.</span>
              </div>
              )}
            </div>
          </CardContent>
        </Card>

        {formData.feedback_type !== "experience_45d" && (<Card className="border-0 shadow-sm">
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
        </Card>)}

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
            {saving ? "Criando..." : "Criar Feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}