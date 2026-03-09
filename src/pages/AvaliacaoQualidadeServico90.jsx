import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Save, AlertCircle, CheckCircle,
  User, ClipboardList, Search, Users, AlertTriangle, Lock, BookOpen
} from "lucide-react";
import GuiaGestor90Dias from "@/components/avaliacao/GuiaGestor90Dias";

const GUIA_READ_KEY_90 = "guia_90dias_lido";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Itens com texto exato do instrumento (cópia fiel) ────────────────────────
const QS90_ITEMS = [
  { id: "q1",  label: "1",  description: "Assimilou o escopo das atividades contratadas com facilidade e rapidez." },
  { id: "q2",  label: "2",  description: "Atua de forma colaborativa com outras empresas e pares, contribuindo sem necessidade de solicitação expressa." },
  { id: "q3",  label: "3",  description: "Demonstra empenho, envolvimento e comprometimento na execução dos serviços contratados." },
  { id: "q4",  label: "4",  description: "Apresenta elevado nível de qualidade na execução e nos resultados das entregas." },
  { id: "q5",  label: "5",  description: "Articula-se com facilidade com membros de sua equipe, demais áreas e parceiros externos para gerar resultados." },
  { id: "q6",  label: "6",  description: "Supera obstáculos que surgem na execução dos serviços, identificando e implementando alternativas de solução." },
  { id: "q7",  label: "7",  description: "Conduz atividades até a conclusão, sendo conclusivo na entrega dos resultados acordados." },
  { id: "q8",  label: "8",  description: "A atuação agrega valor ao projeto e às entregas da equipe." },
  { id: "q9",  label: "9",  description: "A empresa demonstra conhecimento técnico adequado ao escopo contratado, compartilhando-o e buscando atualização quando necessário." },
  { id: "q10", label: "10", description: "O responsável técnico é ágil na identificação e geração de soluções para problemas relacionados ao escopo dos serviços." },
  { id: "q11", label: "11", description: "A empresa organiza adequadamente suas atividades e a gestão de documentos e informações vinculadas ao projeto." },
  { id: "q12", label: "12", description: "Demonstra iniciativa e motivação para entregar resultados acima do mínimo esperado." },
  { id: "q13", label: "13", description: "Cumpre os prazos acordados e os compromissos assumidos no âmbito da prestação de serviços." },
];

const SCALE = [
  { value: 4,    label: "4",  description: "Referência / Supera",  cls: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: 3,    label: "3",  description: "Entrega o esperado",   cls: "border-blue-500 bg-blue-50 text-blue-700" },
  { value: 2,    label: "2",  description: "Em desenvolvimento",   cls: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: 1,    label: "1",  description: "Crítico",              cls: "border-red-500 bg-red-50 text-red-700" },
  { value: "NO", label: "NO", description: "Não Observado",        cls: "border-slate-400 bg-slate-100 text-slate-600" },
];

// ── Bloco 15 – Decisão Contratual ────────────────────────────────────────────
const DECISION_OPTIONS = [
  { value: "continuidade",         label: "Continuidade contratual recomendada." },
  { value: "continuidade_melhoria",label: "Continuidade contratual recomendada com plano de melhoria de serviço acordado." },
  { value: "encerramento",         label: "Encerramento contratual recomendado." },
];

// ── Componente de linha de avaliação ─────────────────────────────────────────
function ItemRow({ item, score, onScoreChange, hasError }) {
  const isNotFilled = hasError && score === undefined;
  return (
    <div className={`rounded-xl border-2 transition-all overflow-hidden ${
      isNotFilled ? "border-red-300 bg-red-50" : score !== undefined ? "border-slate-200 bg-white" : "border-slate-100 bg-white"
    }`}>
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 leading-relaxed">
              <span className="font-bold text-slate-900">{item.label}. </span>
              {item.description}
            </p>
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
        {isNotFilled && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Selecione uma opção para este item.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AvaliacaoQualidadeServico90() {
  const [gestor, setGestor] = useState(null);
  const [allColaboradores, setAllColaboradores] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showColabModal, setShowColabModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [scores, setScores] = useState({});
  // Bloco 14
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  // Bloco 15
  const [decision, setDecision] = useState("");
  const [justification, setJustification] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState(null);
  const [showGuia, setShowGuia] = useState(false);
  const [isFirstTimeGuia, setIsFirstTimeGuia] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const session = localStorage.getItem("gestor_session");
    if (!session) { window.location.href = "/gestorlogin"; return; }
    const sessionData = JSON.parse(session);
    setGestor(sessionData);

    const alreadyRead = localStorage.getItem(GUIA_READ_KEY_90);
    if (!alreadyRead) {
      setIsFirstTimeGuia(true);
      setShowGuia(true);
    }
    try {
      const [myTeam, templates] = await Promise.all([
        base44.entities.Colaborador.filter({ manager_id: sessionData.id, status: "active" }),
        base44.entities.FeedbackTemplate.filter({ feedback_type: "experience_90d", is_active: true }),
      ]);
      setAllColaboradores(myTeam);
      if (templates.length > 0) setTemplateId(templates[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Média = Σ notas / (13 - count(NO))
  const { average, validCount, totalFilled } = useMemo(() => {
    const validScores = Object.values(scores).filter(v => v !== "NO" && v !== undefined);
    const totalFilled = Object.keys(scores).length;
    const sum = validScores.reduce((a, b) => a + b, 0);
    const average = validScores.length > 0 ? (sum / validScores.length).toFixed(2) : "0.00";
    return { average, validCount: validScores.length, totalFilled };
  }, [scores]);

  const handleScoreChange = (id, value) => setScores(prev => ({ ...prev, [id]: value }));

  const handleSave = async () => {
    setSubmitAttempted(true);
    setError("");
    if (!selectedEmployee) { setError("Selecione o prestador de serviços avaliado."); return; }
    if (totalFilled < 13) { setError(`Preencha todos os 13 itens. Faltam ${13 - totalFilled}.`); return; }
    if (!strengths.trim()) { setError("Bloco 14 – Pontos Fortes é obrigatório."); return; }
    if (!improvements.trim()) { setError("Bloco 14 – Pontos de Melhoria é obrigatório."); return; }
    if (!decision) { setError("Bloco 15 – Selecione a Decisão Contratual."); return; }
    if (!justification.trim()) { setError("Bloco 15 – Justificativa da Decisão é obrigatória."); return; }

    setSaving(true);
    try {
      await base44.entities.FeedbackRecord.create({
        template_id: templateId || "AVAL_QS90_V1",
        template_title: "Avaliação de Qualidade de Serviço — Período Inicial 90 Dias",
        feedback_type: "experience_90d",
        workflow_status: "EM_REVISAO_ADMIN",
        manager_id: gestor.id,
        manager_name: gestor.full_name,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.full_name,
        employee_email: selectedEmployee.email,
        feedback_date: format(new Date(), "yyyy-MM-dd"),
        qs90_scores: scores,
        qs90_average: parseFloat(average),
        qs90_strengths: strengths,
        qs90_improvements: improvements,
        qs90_decision: decision,
        qs90_decision_justification: justification,
      });
      setSaved(true);
      setTimeout(() => { window.location.href = "/gestorfeedbacks"; }, 2500);
    } catch (e) {
      setError("Erro ao salvar a avaliação. Tente novamente.");
      console.error(e);
    } finally { setSaving(false); }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleMarkGuiaAsRead = () => {
    localStorage.setItem(GUIA_READ_KEY_90, "true");
    setShowGuia(false);
    setIsFirstTimeGuia(false);
  };

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

      <GuiaGestor90Dias
        open={showGuia}
        onClose={() => setShowGuia(false)}
        onMarkAsRead={handleMarkGuiaAsRead}
        isFirstTime={isFirstTimeGuia}
      />

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b-2 shadow-sm" style={{borderColor: "#F8B137"}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Avaliação de Qualidade de Serviço — Período Inicial 90 Dias
            </h1>
            <p className="text-xs text-slate-400">
              Instrumento Decisório · Escala: 4=Referência · 3=Entrega o esperado · 2=Em desenvolvimento · 1=Crítico · NO=Não Observado
            </p>
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

        {/* ── Seção 1 – Identificação ── */}
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gestor Responsável pelo Contrato</label>
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data de Preenchimento</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">
                  {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Prestador */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prestador de Serviços Avaliado *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar pelo nome..."
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
                  ? <p className="text-sm text-slate-400 py-1 px-1">Nenhum encontrado.</p>
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
                <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 bg-amber-50" style={{borderColor: "#F8B137"}}>
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

        {/* ── Seção 2 – 13 Itens de Avaliação ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{background: "#F8B137", color: "#14141E"}}>13</div>
              <div className="flex-1">
                <CardTitle className="text-base font-bold text-slate-900">Seção 2 – Itens de Avaliação</CardTitle>
                <p className="text-xs text-slate-500">Escala: 4 = Referência/Supera · 3 = Entrega o esperado · 2 = Em desenvolvimento · 1 = Crítico · NO = Não Observado</p>
              </div>
              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-xs text-slate-400">Preenchidos</p>
                <p className="text-xl font-bold text-slate-700">{totalFilled}<span className="text-sm font-normal text-slate-400">/13</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {QS90_ITEMS.map(item => (
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

        {/* ── Resultado Parcial ── */}
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
                  <p className="text-xs text-amber-600 mb-1">Média Aritmética</p>
                  <p className="text-3xl font-bold" style={{color: "#F8B137"}}>{average}</p>
                  <p className="text-xs text-slate-400">máx. 4,00</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">* Fórmula: Σ notas ÷ (13 − contagem de "Não Observado"). Itens NO são excluídos do denominador.</p>
            </CardContent>
          </Card>
        )}

        {/* ── Bloco 14 – Comentários Qualitativos ── */}
        <Card className="border-0 shadow-sm" style={{borderLeft: "4px solid #6366f1"}}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2" style={{color: "#6366f1"}}>
              <Lock className="w-4 h-4" />
              Bloco 14 – Comentários Qualitativos
            </CardTitle>
            <div className="flex items-center gap-2 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 mt-1">
              <Lock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <p className="text-xs text-indigo-700">
                <strong>Uso Interno — Exclusivo Contratante.</strong> Estes campos <strong>nunca são exibidos ao Prestador de Serviços</strong>.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                label: "Pontos Fortes Observados nas Entregas",
                value: strengths, onChange: setStrengths,
                placeholder: "Descreva os principais pontos fortes observados nas entregas do prestador de serviços durante o período de 90 dias..."
              },
              {
                label: "Pontos de Melhoria na Qualidade do Serviço",
                value: improvements, onChange: setImprovements,
                placeholder: "Aponte os aspectos que precisam de melhoria na qualidade do serviço prestado durante o período de 90 dias..."
              },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  {label} <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className={`min-h-[90px] resize-none ${submitAttempted && !value.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {submitAttempted && !value.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {label} é obrigatório.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Bloco 15 – Decisão Contratual ── */}
        <Card className="border-0 shadow-sm" style={{borderLeft: "4px solid #dc2626"}}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-red-700 uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Bloco 15 – Decisão Contratual
            </CardTitle>
            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100 mt-1">
              <Lock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">
                <strong>Uso Interno — Exclusivo Contratante.</strong> Este campo <strong>nunca é exibido ao Prestador de Serviços</strong>. Campo obrigatório.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Radio buttons */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Decisão Contratual <span className="text-red-500">*</span></label>
              {DECISION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    decision === opt.value
                      ? opt.value === "encerramento"
                        ? "border-red-500 bg-red-50"
                        : "border-amber-400 bg-amber-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="qs90_decision"
                    value={opt.value}
                    checked={decision === opt.value}
                    onChange={() => setDecision(opt.value)}
                    className="mt-0.5 flex-shrink-0"
                    style={{accentColor: opt.value === "encerramento" ? "#dc2626" : "#F8B137"}}
                  />
                  <span className={`text-sm font-semibold leading-snug ${
                    decision === opt.value && opt.value === "encerramento" ? "text-red-700" : "text-slate-800"
                  }`}>
                    {opt.label}
                  </span>
                </label>
              ))}
              {submitAttempted && !decision && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Selecione uma decisão contratual.
                </p>
              )}
            </div>

            {/* Alerta imediato ao selecionar encerramento */}
            {decision === "encerramento" && (
              <Alert className="bg-red-50 border-2 border-red-500">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  ⚠️ ATENÇÃO — ENCERRAMENTO CONTRATUAL: Esta decisão será destacada em vermelho para o Administrador na revisão. Certifique-se de detalhar a justificativa com evidências objetivas.
                </AlertDescription>
              </Alert>
            )}

            {/* Justificativa */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                Justificativa da Decisão Contratual <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Justifique detalhadamente a decisão contratual, com base nas evidências observadas durante o período de 90 dias de prestação de serviços..."
                className={`min-h-[120px] resize-none ${submitAttempted && !justification.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {submitAttempted && !justification.trim() && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Justificativa da Decisão é obrigatória.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Modal de seleção de colaborador */}
        <Dialog open={showColabModal} onOpenChange={setShowColabModal}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Selecionar Prestador de Serviços</DialogTitle>
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
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Botão de envio */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Instrumento Decisório — Avaliação de Qualidade de Serviço · Período Inicial 90 Dias.
            Após salvar, encaminhado ao Admin para revisão.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="outline" onClick={() => window.history.back()} disabled={saving}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8 font-bold shadow-md"
              style={{background: "#F8B137", color: "#14141E"}}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar e Enviar para Revisão"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}