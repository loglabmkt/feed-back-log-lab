import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trash2, ArrowLeft, BarChart3 } from "lucide-react";
import Exp45Editor from "@/components/avaliacao/Exp45Editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AVALIACAO_TITLE = "Avaliação de Desempenho Trimestral";
const EXP45_TYPE = "experience_45d";

const DEFAULT_HARD_SKILLS = [
  { id: "h1", label: "H1 – Conhecimento Técnico", description: "Domínio das ferramentas, processos e métodos exigidos pela função" },
  { id: "h2", label: "H2 – Qualidade das Entregas", description: "Precisão, completude e conformidade com o padrão esperado nas entregas" },
  { id: "h3", label: "H3 – Produtividade", description: "Volume e eficiência na conclusão das tarefas atribuídas no período" },
  { id: "h4", label: "H4 – Gestão de Informações", description: "Organização, registro e uso adequado de dados e informações relevantes" },
  { id: "h5", label: "H5 – Cumprimento de Prazos", description: "Pontualidade e comprometimento com os deadlines acordados com a equipe" },
];

const DEFAULT_SOFT_SKILLS = [
  { id: "s1", label: "S1 – Comunicação", description: "Clareza, objetividade e assertividade na comunicação com colegas e líderes" },
  { id: "s2", label: "S2 – Trabalho em Equipe", description: "Colaboração, apoio mútuo e contribuição positiva ao desempenho do grupo" },
  { id: "s3", label: "S3 – Proatividade", description: "Iniciativa na identificação de problemas e proposição de soluções sem ser solicitado" },
  { id: "s4", label: "S4 – Adaptabilidade", description: "Flexibilidade e resiliência diante de mudanças de prioridade ou novos cenários" },
  { id: "s5", label: "S5 – Responsabilidade", description: "Comprometimento, accountability e integridade em relação aos resultados" },
];

// ── Avaliação Trimestral Editor ──────────────────────────────────────────────

function AvaliacaoEditor({ template, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(template.title || AVALIACAO_TITLE);
  const [isActive, setIsActive] = useState(template.is_active ?? true);
  const [hardSkills, setHardSkills] = useState(
    template.hard_skills_config || DEFAULT_HARD_SKILLS
  );
  const [softSkills, setSoftSkills] = useState(
    template.soft_skills_config || DEFAULT_SOFT_SKILLS
  );

  const updateSkill = (list, setList, id, field, value) => {
    setList(list.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = () => {
    onSave({ title, is_active: isActive, hard_skills_config: hardSkills, soft_skills_config: softSkills });
  };

  const SkillRow = ({ skill, list, setList }) => (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono font-bold text-xs">{skill.id.toUpperCase()}</Badge>
        <Input
          value={skill.label}
          onChange={(e) => updateSkill(list, setList, skill.id, 'label', e.target.value)}
          className="font-semibold"
          placeholder="Nome da competência..."
        />
      </div>
      <Textarea
        value={skill.description}
        onChange={(e) => updateSkill(list, setList, skill.id, 'description', e.target.value)}
        placeholder="Descrição da competência..."
        className="text-sm resize-none min-h-[64px]"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{color: '#F8B137'}} />
            Configurações da Avaliação Trimestral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Status do Template</p>
              <p className="text-sm text-slate-500">{isActive ? 'Visível para gestores' : 'Oculto para gestores'}</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-800 mb-1">Configurações fixas (Escala 1–4 · 10 critérios · Soma 10–40 pts)</p>
            <p className="text-xs text-amber-700">Edite os nomes e descrições de cada competência abaixo. A escala de avaliação e o motor de cálculo são fixos.</p>
          </div>
        </CardContent>
      </Card>

      {/* Hard Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{background: '#14141E'}}>H</div>
            <div>
              <CardTitle className="text-base">Bloco H – Hard Skills (5 competências)</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Competências técnicas e de execução</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {hardSkills.map(skill => (
            <SkillRow key={skill.id} skill={skill} list={hardSkills} setList={setHardSkills} />
          ))}
        </CardContent>
      </Card>

      {/* Soft Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm" style={{background: '#F8B137', color: '#14141E'}}>S</div>
            <div>
              <CardTitle className="text-base">Bloco S – Soft Skills (5 competências)</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Competências comportamentais e relacionais</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {softSkills.map(skill => (
            <SkillRow key={skill.id} skill={skill} list={softSkills} setList={setSoftSkills} />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving} style={{background: '#F8B137', color: '#14141E'}} className="font-semibold">
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EditarFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(null);
  const [isAvaliacaoTrimestral, setIsAvaliacaoTrimestral] = useState(false);
  const [isExp45, setIsExp45] = useState(false);

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

      if (!templateId) { navigate(createPageUrl("Feedbacks")); return; }

      const templates = await base44.entities.FeedbackTemplate.filter({ id: templateId });
      if (!templates || templates.length === 0) { navigate(createPageUrl("Feedbacks")); return; }

      const t = templates[0];
      setTemplate(t);

      if (t.feedback_type === EXP45_TYPE) {
        setIsExp45(true);
      } else if (t.title === AVALIACAO_TITLE || t.feedback_type === 'evaluation') {
        setIsAvaliacaoTrimestral(true);
      } else {
        setFormData({
          title: t.title,
          feedback_type: t.feedback_type,
          checklist_questions: t.checklist_questions || []
        });
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  // ── Generic template handlers ───────────────────────────────────────────────

  const addQuestion = () => {
    const newId = String(Date.now());
    setFormData({
      ...formData,
      checklist_questions: [...formData.checklist_questions, { id: newId, question: "", required: true }]
    });
  };

  const updateQuestion = (id, field, value) => {
    setFormData({
      ...formData,
      checklist_questions: formData.checklist_questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    });
  };

  const removeQuestion = (id) => {
    setFormData({
      ...formData,
      checklist_questions: formData.checklist_questions.filter(q => q.id !== id)
    });
  };

  const handleGenericSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.title.trim()) { setError("O título é obrigatório"); return; }
    if (formData.checklist_questions.length === 0) { setError("Adicione pelo menos uma pergunta ao checklist"); return; }
    const invalid = formData.checklist_questions.filter(q => !q.question.trim());
    if (invalid.length > 0) { setError("Todas as perguntas devem ser preenchidas"); return; }

    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      await base44.entities.FeedbackTemplate.update(params.get('id'), {
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

  const handleAvaliacaoSave = async (data) => {
    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      await base44.entities.FeedbackTemplate.update(params.get('id'), {
        title: data.title,
        is_active: data.is_active,
        hard_skills_config: data.hard_skills_config,
        soft_skills_config: data.soft_skills_config,
      });
      navigate(createPageUrl("Feedbacks"));
    } catch (e) {
      setError(e.message || "Erro ao atualizar avaliação");
    } finally {
      setSaving(false);
    }
  };

  const handleExp45Save = async (data) => {
    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      await base44.entities.FeedbackTemplate.update(params.get('id'), {
        title: data.title,
        is_active: data.is_active,
        exp45_items_config: data.exp45_items_config,
      });
      navigate(createPageUrl("Feedbacks"));
    } catch (e) {
      setError(e.message || "Erro ao atualizar avaliação 45 dias");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#F8B137'}} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(createPageUrl("Feedbacks"))} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAvaliacaoTrimestral ? "Editar Avaliação Trimestral" : "Editar Feedback"}
        </h1>
        <p className="text-slate-500">
          {isAvaliacaoTrimestral
            ? "Gerencie os critérios, nomes e status da avaliação de desempenho"
            : "Atualize as informações do feedback"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isAvaliacaoTrimestral ? (
        <AvaliacaoEditor
          template={template}
          onSave={handleAvaliacaoSave}
          onCancel={() => navigate(createPageUrl("Feedbacks"))}
          saving={saving}
        />
      ) : (
        <form onSubmit={handleGenericSubmit} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título do Feedback *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Ritual *</Label>
                <Select value={formData.feedback_type} onValueChange={(v) => setFormData({...formData, feedback_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <p className="text-sm text-slate-500 mt-1">Perguntas que o colaborador responderá ao validar o feedback</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />Adicionar Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.checklist_questions.map((question, index) => (
                <div key={question.id} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                      placeholder="Digite a pergunta..."
                    />
                  </div>
                  {formData.checklist_questions.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(question.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Feedbacks"))}>Cancelar</Button>
            <Button type="submit" disabled={saving} style={{background: '#F8B137', color: '#14141E'}} className="font-semibold">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}