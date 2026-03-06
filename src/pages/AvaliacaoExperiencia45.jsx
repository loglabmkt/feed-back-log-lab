import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Save, AlertCircle, CheckCircle,
  User, ClipboardList, Search, Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


const DEFAULT_ITEMS = [
  { id: "e1",  label: "1 – Assimilação / Rapidez",          description: "Velocidade de aprendizado das rotinas, processos e ferramentas da função" },
  { id: "e2",  label: "2 – Cooperação",                      description: "Disposição para colaborar com colegas, líderes e demais áreas" },
  { id: "e3",  label: "3 – Empenho / Entusiasmo",            description: "Motivação e energia aplicadas nas atividades do dia a dia" },
  { id: "e4",  label: "4 – Qualidade",                       description: "Padrão de qualidade das entregas e atenção aos detalhes" },
  { id: "e5",  label: "5 – Articulação / Equipe",            description: "Capacidade de se integrar e comunicar bem dentro da equipe" },
  { id: "e6",  label: "6 – Superação de Obstáculos",         description: "Resiliência e criatividade diante de dificuldades e imprevistos" },
  { id: "e7",  label: "7 – Conclusividade",                  description: "Capacidade de concluir tarefas e entregar resultados completos" },
  { id: "e8",  label: "8 – Agregação de Valor",              description: "Contribuição efetiva para o time além do escopo básico da função" },
  { id: "e9",  label: "9 – Conhecimento Técnico",            description: "Domínio técnico exigido para a função no período de experiência" },
  { id: "e10", label: "10 – Geração de Soluções",            description: "Proatividade na identificação e proposição de soluções práticas" },
  { id: "e11", label: "11 – Organização / Gestão",           description: "Organização do trabalho, priorização e gestão do próprio tempo" },
  { id: "e12", label: "12 – Auto-motivação",                 description: "Iniciativa e autonomia sem necessidade de supervisão constante" },
  { id: "e13", label: "13 – Pontualidade / Compromissos",    description: "Cumprimento de horários, prazos e compromissos assumidos" },
];

const SCALE = [
  { value: 4,    label: "4",  description: "Acima do esperado",         cls: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: 3,    label: "3",  description: "Dentro do esperado",        cls: "border-blue-500 bg-blue-50 text-blue-700" },
  { value: 2,    label: "2",  description: "Abaixo do esperado",        cls: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: 1,    label: "1",  description: "Muito abaixo",              cls: "border-red-500 bg-red-50 text-red-700" },
  { value: "NO", label: "NO", description: "Não Observado",             cls: "border-slate-400 bg-slate-100 text-slate-600" },
];

function ItemRow({ item, score, onScoreChange, hasError }) {
  const isNotFilled = hasError && score === undefined;
  return (
    <div className={`rounded-xl border-2 transition-all overflow-hidden ${isNotFilled ? "border-red-300 bg-red-50" : score !== undefined ? "border-slate-200 bg-white" : "border-slate-100 bg-white"}`}>
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm">{item.label}</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
            {SCALE.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onScoreChange(opt.value)}
                title={opt.description}
                className={`min-w-[44px] px-2 py-2.5 rounded-xl border-2 text-center transition-all font-bold text-sm focus:outline-none ${
                  score === opt.value
                    ? opt.cls + " shadow-sm"
                    : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 bg-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {!score && score !== 0 && (
          <div className="flex gap-3 mt-2 flex-wrap">
            {SCALE.map(opt => (
              <span key={opt.value} className="text-xs text-slate-400">{opt.label} = {opt.description}</span>
            ))}
          </div>
        )}
        {isNotFilled && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Selecione uma opção para este item.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AvaliacaoExperiencia45() {
  const [gestor, setGestor] = useState(null);
  const [allColaboradores, setAllColaboradores] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showColabModal, setShowColabModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [scores, setScores] = useState({});
  const [strengths, setStrengths] = useState("");
  const [developments, setDevelopments] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState(null);
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => { checkAuth(); }, []);

  const [evaluatedIds, setEvaluatedIds] = useState(new Set());

  const checkAuth = async () => {
    const session = localStorage.getItem("gestor_session");
    if (!session) { window.location.href = "/gestorlogin"; return; }
    const sessionData = JSON.parse(session);
    setGestor(sessionData);
    try {
      const [myTeam, templates, feedbacks] = await Promise.all([
        base44.entities.Colaborador.filter({ manager_id: sessionData.id, status: "active" }),
        base44.entities.FeedbackTemplate.filter({ feedback_type: "experience_45d", is_active: true }),
        base44.entities.FeedbackRecord.filter({ manager_id: sessionData.id })
      ]);
      setAllColaboradores(myTeam); // Gestor só vê seu time

      if (templates.length > 0) {
        setTemplateId(templates[0].id);
        if (templates[0].exp45_items_config?.length === 13) {
          setItems(templates[0].exp45_items_config);
        }
      }

      const doneStatuses = ["PUBLICADO", "ASSINADO_COLABORADOR", "CONVERSA_REALIZADA", "EM_REVISAO_ADMIN", "APROVADO"];
      const doneTypes = ["evaluation", "experience_45d"];
      const evalDone = new Set(
        feedbacks
          .filter(f => doneTypes.includes(f.feedback_type) && doneStatuses.includes(f.workflow_status))
          .map(f => f.employee_id)
      );
      setEvaluatedIds(evalDone);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Cálculo: exclui "NO" do denominador
  const { average, validCount, totalFilled } = useMemo(() => {
    const validScores = Object.values(scores).filter(v => v !== "NO" && v !== undefined);
    const totalFilled = Object.keys(scores).length;
    const sum = validScores.reduce((a, b) => a + b, 0);
    const average = validScores.length > 0 ? (sum / validScores.length).toFixed(2) : 0;
    return { average, validCount: validScores.length, totalFilled };
  }, [scores]);

  const handleScoreChange = (id, value) => setScores(prev => ({ ...prev, [id]: value }));

  const handleSave = async () => {
    setSubmitAttempted(true);
    setError("");
    if (!selectedEmployee) { setError("Selecione o colaborador avaliado."); return; }
    if (totalFilled < 13) { setError(`Preencha todos os 13 itens. Faltam ${13 - totalFilled}.`); return; }
    if (!strengths.trim()) { setError("Pontos Fortes é obrigatório."); return; }
    if (!developments.trim()) { setError("Pontos de Desenvolvimento é obrigatório."); return; }
    if (!actionPlan.trim()) { setError("Plano de Ação é obrigatório."); return; }

    setSaving(true);
    try {
      await base44.entities.FeedbackRecord.create({
        template_id: templateId || "AVAL_EXP45_V1",
        template_title: "Avaliação de Experiência – 45 Dias",
        feedback_type: "experience_45d",
        workflow_status: "EM_REVISAO_ADMIN",
        manager_id: gestor.id,
        manager_name: gestor.full_name,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.full_name,
        employee_email: selectedEmployee.email,
        feedback_date: format(new Date(), "yyyy-MM-dd"),
        exp45_scores: scores,
        exp45_average: parseFloat(average),
        exp45_strengths: strengths,
        exp45_developments: developments,
        exp45_action_plan: actionPlan,
      });
      // Notificar admins por e-mail
      try {
        await base44.functions.invoke('notifyAdminNewEvaluation', {
          managerName: gestor.full_name,
          employeeName: selectedEmployee.full_name,
        });
      } catch (emailErr) {
        console.error('Erro ao notificar admins:', emailErr);
      }
      setSaved(true);
      setTimeout(() => { window.location.href = "/gestorfeedbacks"; }, 2500);
    } catch (e) {
      setError("Erro ao salvar a avaliação. Tente novamente.");
      console.error(e);
    } finally { setSaving(false); }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl max-w-sm w-full text-center">
          <CardContent className="py-12 px-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Avaliação Enviada!</h2>
            <p className="text-slate-500 mb-1">Encaminhada para revisão do Admin.</p>
            <p className="text-sm text-slate-400">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: "#F8B137"}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b-2 shadow-sm" style={{borderColor: "#F8B137"}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Avaliação de Experiência – 45 Dias</h1>
            <p className="text-xs text-slate-400">EXP_45_DIAS_V1 · Escala 4/3/2/1/NO · 13 itens</p>
          </div>
          {totalFilled > 0 && (
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-slate-500">{totalFilled}/13 itens</p>
              <p className="text-lg font-bold" style={{color: "#F8B137"}}>Média: {average}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* Identificação */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4" style={{color: "#F8B137"}} />
              Seção 1 – Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gestor */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gestor (Auto-preenchido)</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-white text-xs font-bold" style={{background: "#14141E"}}>
                    {getInitials(gestor?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{gestor?.full_name}</p>
                  <p className="text-xs text-slate-500">{gestor?.email}</p>
                </div>
              </div>
            </div>

            {/* Data */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data da Avaliação (Auto)</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">
                  {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Colaborador */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Colaborador Avaliado *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar colaborador pelo nome..."
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => { setModalSearch(""); setShowColabModal(true); }} className="flex-shrink-0 gap-2">
                  <Users className="w-4 h-4" /> Meu Time
                </Button>
              </div>

              {searchQuery.trim().length > 0 && (() => {
                const results = allColaboradores.filter(e => e.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
                return results.length === 0
                  ? <p className="text-sm text-slate-400 py-1 px-1">Nenhum colaborador encontrado.</p>
                  : (
                    <div className="border rounded-xl overflow-hidden divide-y">
                      {results.map(emp => (
                        <button key={emp.id} type="button"
                          onClick={() => { setSelectedEmployee(emp); setSearchQuery(""); }}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 text-left transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs font-bold text-white bg-slate-400">{getInitials(emp.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-sm truncate">{emp.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{emp.position || emp.department || emp.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
              })()}

              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#F8B137] bg-amber-50">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold" style={{background: "#F8B137", color: "#14141E"}}>
                      {getInitials(selectedEmployee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.position || selectedEmployee.department || selectedEmployee.email}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: "#F8B137"}} />
                  <button type="button" onClick={() => setSelectedEmployee(null)} className="text-xs text-slate-400 hover:text-red-500 ml-1">✕</button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 13 Itens */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{background: "#F8B137", color: "#14141E"}}>13</div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Itens de Avaliação</CardTitle>
                <p className="text-sm text-slate-500">Escala: 4 = Acima do esperado · 3 = Dentro · 2 = Abaixo · 1 = Muito abaixo · NO = Não Observado</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Preenchidos</p>
                <p className="text-xl font-bold text-slate-700">{totalFilled}<span className="text-sm font-normal text-slate-400">/13</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                score={scores[item.id]}
                onScoreChange={(v) => handleScoreChange(item.id, v)}
                hasError={submitAttempted}
              />
            ))}
          </CardContent>
        </Card>

        {/* Resultado */}
        {totalFilled > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="w-4 h-4" style={{color: "#F8B137"}} />
                Resultado Parcial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
                  <p className="text-xs text-slate-500 mb-1">Itens Preenchidos</p>
                  <p className="text-2xl font-bold text-slate-700">{totalFilled}<span className="text-sm font-normal text-slate-400">/13</span></p>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
                  <p className="text-xs text-slate-500 mb-1">Válidos (excl. NO)</p>
                  <p className="text-2xl font-bold text-slate-700">{validCount}</p>
                </div>
                <div className="text-center px-6 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-600 mb-1">Média Ponderada</p>
                  <p className="text-3xl font-bold" style={{color: "#F8B137"}}>{average}</p>
                  <p className="text-xs text-slate-400">máx. 4,00</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">* Itens marcados como "Não Observado" são excluídos do cálculo da média.</p>
            </CardContent>
          </Card>
        )}

        {/* Bloco Qualitativo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Seção 14 – Comentários Qualitativos
            </CardTitle>
            <p className="text-sm text-slate-500">Campos obrigatórios. Visíveis apenas para Gestor e Admin (não serão exibidos ao colaborador).</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Pontos Fortes", value: strengths, onChange: setStrengths, placeholder: "Descreva os principais pontos fortes observados no período de experiência..." },
              { label: "Pontos de Desenvolvimento", value: developments, onChange: setDevelopments, placeholder: "Aponte os comportamentos e competências que precisam ser desenvolvidos..." },
              { label: "Plano de Ação", value: actionPlan, onChange: setActionPlan, placeholder: "Defina ações concretas para o desenvolvimento do colaborador..." },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  {label} <span className="text-red-500 ml-1">*</span>
                </label>
                <Textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className={`min-h-[90px] resize-none ${submitAttempted && !value.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {submitAttempted && !value.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{label} é obrigatório.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Modal colaboradores */}
        <Dialog open={showColabModal} onOpenChange={setShowColabModal}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Selecionar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} placeholder="Buscar pelo nome..." className="pl-9" autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 divide-y border rounded-xl">
              {allColaboradores.filter(e => e.full_name.toLowerCase().includes(modalSearch.toLowerCase())).map(emp => (
                <button key={emp.id} type="button"
                  onClick={() => { setSelectedEmployee(emp); setShowColabModal(false); setSearchQuery(""); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 text-left transition-colors"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold text-white bg-slate-400">{getInitials(emp.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{emp.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.position || emp.department || emp.email}</p>
                  </div>
                  {evaluatedIds.has(emp.id) && <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" title="Já avaliado" />}
                  {selectedEmployee?.id === emp.id && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: "#F8B137"}} />}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Após salvar, a avaliação será encaminhada ao Admin para revisão antes de ser publicada ao colaborador.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="outline" onClick={() => window.history.back()} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="px-8 font-bold shadow-md" style={{background: "#F8B137", color: "#14141E"}}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar e Enviar para Revisão"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}