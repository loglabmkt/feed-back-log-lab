import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, FileDown, AlertTriangle, SlidersHorizontal, MessageSquareDiff } from "lucide-react";
import Qs90Content from "@/components/feedback/Qs90Content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Avaliação Trimestral helpers ──────────────────────────────────────────────
const HARD_SKILLS = [
  { id: "h1", label: "H1 – Conhecimento Técnico" },
  { id: "h2", label: "H2 – Qualidade das Entregas" },
  { id: "h3", label: "H3 – Produtividade" },
  { id: "h4", label: "H4 – Gestão de Informações" },
  { id: "h5", label: "H5 – Cumprimento de Prazos" },
];
const SOFT_SKILLS = [
  { id: "s1", label: "S1 – Comunicação" },
  { id: "s2", label: "S2 – Trabalho em Equipe" },
  { id: "s3", label: "S3 – Proatividade" },
  { id: "s4", label: "S4 – Adaptabilidade" },
  { id: "s5", label: "S5 – Responsabilidade" },
];
const SCORE_LABELS = { 1: "Abaixo do Esperado", 2: "Em Desenvolvimento", 3: "Atende ao Esperado", 4: "Supera o Esperado" };
const SCORE_COLORS = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  3: "bg-blue-100 text-blue-700 border-blue-200",
  4: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const BAND_LABELS = {
  immediate_action: { label: "Alerta – PIP", color: "bg-red-100 text-red-700 border-red-300" },
  attention: { label: "Atenção – Suporte necessário", color: "bg-amber-100 text-amber-700 border-amber-300" },
  adequate: { label: "Adequado – Manutenção", color: "bg-blue-100 text-blue-700 border-blue-300" },
  reference: { label: "Referência – Promoção", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};

function CriterionRow({ label, score, evidence }) {
  const colorClass = SCORE_COLORS[score] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-800 text-sm">{label}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass} flex-shrink-0`}>
          {score} – {SCORE_LABELS[score]}
        </span>
      </div>
      {evidence && (
        <p className="text-sm text-slate-500 italic border-t pt-2 mt-1">Evidência: {evidence}</p>
      )}
    </div>
  );
}

const EXP45_ITEMS = [
  { id: "e1",  label: "1 – Assimilação / Rapidez" },
  { id: "e2",  label: "2 – Cooperação" },
  { id: "e3",  label: "3 – Empenho / Entusiasmo" },
  { id: "e4",  label: "4 – Qualidade" },
  { id: "e5",  label: "5 – Articulação / Equipe" },
  { id: "e6",  label: "6 – Superação de Obstáculos" },
  { id: "e7",  label: "7 – Conclusividade" },
  { id: "e8",  label: "8 – Agregação de Valor" },
  { id: "e9",  label: "9 – Conhecimento Técnico" },
  { id: "e10", label: "10 – Geração de Soluções" },
  { id: "e11", label: "11 – Organização / Gestão" },
  { id: "e12", label: "12 – Auto-motivação" },
  { id: "e13", label: "13 – Pontualidade / Compromissos" },
];

const EXP45_SCORE_COLORS = {
  4: "bg-emerald-100 text-emerald-700 border-emerald-200",
  3: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  1: "bg-red-100 text-red-700 border-red-200",
  "NO": "bg-slate-100 text-slate-600 border-slate-200",
};
const EXP45_SCORE_LABELS = { 4: "Acima do esperado", 3: "Dentro do esperado", 2: "Abaixo do esperado", 1: "Muito abaixo", "NO": "Não Observado" };

function Exp45Content({ fb }) {
  const scores = fb.exp45_scores || {};
  const average = fb.exp45_average;
  return (
    <div className="space-y-6">
      {/* Resultado */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Resultado da Avaliação</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center px-6 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-600 mb-1">Média Ponderada</p>
              <p className="text-3xl font-bold" style={{color: '#F8B137'}}>{average ? Number(average).toFixed(2) : "—"}<span className="text-base font-normal text-slate-400">/4,00</span></p>
            </div>
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Itens Avaliados</p>
              <p className="text-2xl font-bold text-slate-700">{Object.keys(scores).length}<span className="text-sm font-normal text-slate-400">/13</span></p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">* Itens marcados como "Não Observado" são excluídos do cálculo da média.</p>
        </CardContent>
      </Card>

      {/* 13 itens */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: "#F8B137", color: "#14141E"}}>13</div>
            <CardTitle className="text-base font-bold">Itens de Avaliação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {EXP45_ITEMS.map(item => {
            const score = scores[item.id];
            const colorClass = EXP45_SCORE_COLORS[score] || "bg-slate-100 text-slate-600 border-slate-200";
            return (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800 text-sm">{item.label}</span>
                {score !== undefined ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${colorClass}`}>
                    {score} – {EXP45_SCORE_LABELS[score]}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bloco Qualitativo */}
      {(fb.exp45_strengths || fb.exp45_developments || fb.exp45_action_plan) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Comentários Qualitativos (Interno – Gestor/Admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fb.exp45_strengths && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos Fortes</Label>
                <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.exp45_strengths}</p>
                </div>
              </div>
            )}
            {fb.exp45_developments && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2">Pontos de Desenvolvimento</Label>
                <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.exp45_developments}</p>
                </div>
              </div>
            )}
            {fb.exp45_action_plan && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2">Plano de Ação</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{fb.exp45_action_plan}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AvaliacaoContent({ fb }) {
  const hardTotal = HARD_SKILLS.reduce((s, c) => s + (fb[`${c.id}_score`] || 0), 0);
  const softTotal = SOFT_SKILLS.reduce((s, c) => s + (fb[`${c.id}_score`] || 0), 0);
  const band = BAND_LABELS[fb.performance_band] || {};
  return (
    <div className="space-y-6">
      {/* Resultado */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultado da Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Pontuação Total</p>
              <p className="text-3xl font-black" style={{color: '#F8B137'}}>{fb.total_score}<span className="text-base font-normal text-slate-400">/40</span></p>
            </div>
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Hard Skills</p>
              <p className="text-2xl font-bold text-slate-700">{hardTotal}<span className="text-sm font-normal text-slate-400">/20</span></p>
            </div>
            <div className="text-center px-6 py-3 rounded-xl bg-slate-50 border">
              <p className="text-xs text-slate-500 mb-1">Soft Skills</p>
              <p className="text-2xl font-bold text-slate-700">{softTotal}<span className="text-sm font-normal text-slate-400">/20</span></p>
            </div>
            {fb.performance_band && (
              <div className={`px-4 py-3 rounded-xl border ${band.color}`}>
                <p className="text-xs font-semibold mb-0.5">Faixa de Desempenho</p>
                <p className="font-bold text-sm">{band.label}</p>
              </div>
            )}
          </div>
          {fb.recommended_action && (
            <p className="mt-3 text-sm text-slate-600"><strong>Ação recomendada:</strong> {fb.recommended_action}</p>
          )}
          {fb.quarter_reference && (
            <p className="mt-1 text-sm text-slate-500">Trimestre: <strong>{fb.quarter_reference}</strong></p>
          )}
        </CardContent>
      </Card>

      {/* Hard Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{background: '#14141E'}}>H</div>
            <CardTitle className="text-base font-bold">Bloco H – Hard Skills</CardTitle>
            <span className="ml-auto text-sm font-bold text-slate-600">{hardTotal}/20</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {HARD_SKILLS.map(c => (
            <CriterionRow key={c.id} label={c.label} score={fb[`${c.id}_score`]} evidence={fb[`${c.id}_evidence`]} />
          ))}
        </CardContent>
      </Card>

      {/* Soft Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: '#F8B137', color: '#14141E'}}>S</div>
            <CardTitle className="text-base font-bold">Bloco S – Soft Skills</CardTitle>
            <span className="ml-auto text-sm font-bold text-slate-600">{softTotal}/20</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOFT_SKILLS.map(c => (
            <CriterionRow key={c.id} label={c.label} score={fb[`${c.id}_score`]} evidence={fb[`${c.id}_evidence`]} />
          ))}
        </CardContent>
      </Card>

      {/* Plano de Ação */}
      {(fb.eval_action_1 || fb.eval_action_2 || fb.eval_action_3) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Plano de Ação (PDI)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fb.eval_action_1 && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-1">Ação 1 *</p>
                <p className="text-sm text-slate-800">{fb.eval_action_1}</p>
              </div>
            )}
            {fb.eval_action_2 && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-1">Ação 2 *</p>
                <p className="text-sm text-slate-800">{fb.eval_action_2}</p>
              </div>
            )}
            {fb.eval_action_3 && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 mb-1">Ação 3 (opcional)</p>
                <p className="text-sm text-slate-800">{fb.eval_action_3}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RevisarFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState("");
  const [showCalibragem, setShowCalibragem] = useState(false);
  const [calibragemText, setCalibragemText] = useState("");
  const [savingCalibragem, setSavingCalibragem] = useState(false);

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
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setError("");
    setApproving(true);

    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        workflow_status: "APROVADO",
        admin_approved_by: currentUser.id,
        admin_approved_date: new Date().toISOString()
      });

      // Enviar notificação ao gestor
      base44.functions.invoke("notifyManagerApprovedFeedback", {
        feedbackId: feedback.id
      }).catch(() => {});

      navigate(createPageUrl("Respostas"));
    } catch (e) {
      setError(e.message || "Erro ao aprovar feedback");
    } finally {
      setApproving(false);
    }
  };

  const handleSaveCalibragem = async () => {
    if (!calibragemText.trim()) return;
    setSavingCalibragem(true);
    try {
      await base44.entities.FeedbackRecord.update(feedback.id, {
        admin_director_notes: calibragemText.trim()
      });
      setFeedback(prev => ({ ...prev, admin_director_notes: calibragemText.trim() }));
      setShowCalibragem(false);
    } catch (e) {
      setError(e.message || "Erro ao salvar calibragem");
    } finally {
      setSavingCalibragem(false);
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = 18;

      const addText = (text, x, fontSize = 10, style = "normal", color = [30, 30, 30]) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", style);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(String(text || ""), contentW - (x - margin));
        doc.text(lines, x, y);
        y += lines.length * (fontSize * 0.45) + 2;
        return lines.length;
      };

      const checkPage = (needed = 20) => {
        if (y + needed > 280) { doc.addPage(); y = 18; }
      };

      const drawBox = (bgR, bgG, bgB, height = 8) => {
        doc.setFillColor(bgR, bgG, bgB);
        doc.roundedRect(margin, y - 5, contentW, height, 2, 2, "F");
      };

      // Header
      doc.setFillColor(20, 20, 30);
      doc.rect(0, 0, pageW, 24, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(249, 177, 54);
      doc.text("Avaliação de Desempenho", margin, 11);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, margin, 18);
      y = 32;

      // Colaborador info
      addText("INFORMAÇÕES DO COLABORADOR", margin, 9, "bold", [100, 100, 120]);
      y += 1;
      addText(feedback.employee_name, margin, 13, "bold", [20, 20, 30]);
      addText(feedback.employee_email, margin, 9, "normal", [80, 80, 100]);
      addText(`Gestor: ${feedback.manager_name}   |   Data: ${feedback.feedback_date ? format(new Date(feedback.feedback_date), "dd/MM/yyyy") : "—"}${feedback.quarter_reference ? `   |   Trimestre: ${feedback.quarter_reference}` : ""}`, margin, 9, "normal", [80, 80, 100]);
      y += 4;

      if (feedback.feedback_type === 'experience_45d') {
        // ── Avaliação 45 Dias ──────────────────────────────────────────────────
        const EXP45 = [
          { id: "e1",  num: "1",  description: "Assimilação do escopo das atividades contratadas com facilidade e rapidez." },
          { id: "e2",  num: "2",  description: "Atuação colaborativa com a equipe, sem necessidade de solicitação expressa." },
          { id: "e3",  num: "3",  description: "Empenho, envolvimento e comprometimento na execução dos serviços." },
          { id: "e4",  num: "4",  description: "Elevado nível de qualidade na entrega dos resultados acordados." },
          { id: "e5",  num: "5",  description: "Articulação com outros prestadores, empresas do ecossistema e parceiros." },
          { id: "e6",  num: "6",  description: "Superação de obstáculos, identificando alternativas de solução." },
          { id: "e7",  num: "7",  description: "Conclusividade e comprometimento com os resultados finais." },
          { id: "e8",  num: "8",  description: "Atuação que agrega valor ao projeto e às entregas ao cliente." },
          { id: "e9",  num: "9",  description: "Conhecimento técnico adequado e busca por atualização." },
          { id: "e10", num: "10", description: "Agilidade na identificação e geração de soluções para problemas." },
          { id: "e11", num: "11", description: "Organização das atividades e gestão de documentos/informações." },
          { id: "e12", num: "12", description: "Iniciativa e motivação para entregar acima do mínimo esperado." },
          { id: "e13", num: "13", description: "Cumprimento de prazos acordados e compromissos assumidos." },
        ];
        const EXP45_SL = { 4: "Referência / Supera", 3: "Entrega o esperado", 2: "Em desenvolvimento", 1: "Crítico", "NO": "Não Observado" };
        const scores45 = feedback.exp45_scores || {};
        const avg45 = feedback.exp45_average;

        // Resultado
        checkPage(24);
        doc.setFillColor(248, 177, 54);
        doc.rect(margin, y - 1, contentW, 0.5, "F");
        y += 4;
        addText("RESULTADO — AVALIAÇÃO DE QUALIDADE DE SERVIÇO 45 DIAS", margin, 9, "bold", [100, 100, 120]);
        y += 1;

        doc.setFillColor(255, 251, 235);
        doc.roundedRect(margin, y - 1, 65, 18, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 120, 0);
        doc.text("Média Ponderada", margin + 3, y + 4);
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(248, 177, 54);
        doc.text(`${avg45 ? Number(avg45).toFixed(2) : "—"}`, margin + 3, y + 12);
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
        doc.text("/4,00", margin + 3 + (avg45 ? 16 : 10), y + 12);

        doc.setFillColor(248, 248, 250);
        doc.roundedRect(margin + 70, y - 1, 55, 18, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 120);
        doc.text("Itens Avaliados", margin + 73, y + 4);
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
        doc.text(`${Object.keys(scores45).length}`, margin + 73, y + 12);
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
        doc.text("/13", margin + 73 + 8, y + 12);
        y += 23;

        doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(160, 160, 160);
        doc.text('* Itens marcados como "Não Observado" são excluídos do cálculo da média.', margin, y);
        y += 8;

        // Cabeçalho Itens
        checkPage(20);
        doc.setFillColor(20, 20, 30);
        doc.rect(margin, y - 1, contentW, 9, "F");
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(249, 177, 54);
        doc.text("ITENS DE AVALIAÇÃO — 45 DIAS", margin + 3, y + 4.5);
        y += 13;

        EXP45.forEach(item => {
          const score = scores45[item.id];
          const descLines = doc.splitTextToSize(`${item.num}. ${item.description}`, contentW - 55);
          const rowH = Math.max(12, descLines.length * 5 + 6);
          checkPage(rowH + 3);

          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, y - 3, contentW, rowH, 1, 1, "F");
          doc.setDrawColor(230, 230, 235);
          doc.roundedRect(margin, y - 3, contentW, rowH, 1, 1, "S");

          doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
          doc.text(descLines[0], margin + 3, y + 2);
          if (descLines.length > 1) {
            doc.setFont("helvetica", "normal");
            descLines.slice(1).forEach((line, li) => doc.text(line, margin + 3, y + 2 + (li + 1) * 5));
          }

          if (score !== undefined) {
            const scoreColors45 = { 4: [209,250,229], 3: [219,234,254], 2: [255,251,235], 1: [254,226,226], "NO": [248,248,248] };
            const sc = scoreColors45[score] || [248,248,248];
            const badgeLabel = `${score} – ${EXP45_SL[score] || ""}`;
            const badgeW = 48;
            const badgeX = pageW - margin - badgeW;
            const badgeY = y - 1 + (rowH - 8) / 2;
            doc.setFillColor(...sc);
            doc.roundedRect(badgeX, badgeY, badgeW, 8, 3, 3, "F");
            doc.setFontSize(7); doc.setFont("helvetica", "bold");
            const textColors = { 4: [5,100,50], 3: [30,60,150], 2: [130,80,0], 1: [150,20,20], "NO": [80,80,90] };
            const tc = textColors[score] || [60,60,60];
            doc.setTextColor(...tc);
            doc.text(badgeLabel, badgeX + badgeW / 2, badgeY + 5.5, { align: "center" });
          }
          y += rowH + 2;
        });

        if (feedback.exp45_strengths || feedback.exp45_developments || feedback.exp45_action_plan) {
          y += 4;
          checkPage(20);
          doc.setFillColor(99, 102, 241);
          doc.rect(margin, y - 1, 3, 14, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(99, 102, 241);
          doc.text("COMENTÁRIOS QUALITATIVOS (USO INTERNO – GESTOR/ADMIN)", margin + 6, y + 5);
          y += 14;

          [[feedback.exp45_strengths, "Pontos Fortes Observados nas Entregas", [209,250,229]], [feedback.exp45_developments, "Pontos de Desenvolvimento", [255,251,235]], [feedback.exp45_action_plan, "Plano de Ação / Alinhamento de Expectativas", [219,234,254]]].forEach(([val, lbl, bg]) => {
            if (!val) return;
            checkPage(20);
            doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 80);
            doc.text(lbl, margin, y); y += 5;
            const lines = doc.splitTextToSize(val, contentW - 6);
            doc.setFillColor(...bg);
            doc.roundedRect(margin, y - 2, contentW, lines.length * 5 + 6, 2, 2, "F");
            doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 40);
            doc.text(lines, margin + 3, y + 3);
            y += lines.length * 5 + 10;
          });
        }

      } else if (feedback.feedback_type === 'experience_90d') {
        // ── Avaliação QS 90 Dias ───────────────────────────────────────────────
        const QS90_SL = { 4: "Referência / Supera", 3: "Entrega o esperado", 2: "Em desenvolvimento", 1: "Crítico", "NO": "Não Observado" };
        const QS90_ITEMS = [
          { id: "q1",  num: "1",  description: "Assimilou o escopo das atividades contratadas com facilidade e rapidez." },
          { id: "q2",  num: "2",  description: "Atua de forma colaborativa com outras empresas e pares, contribuindo sem necessidade de solicitação expressa." },
          { id: "q3",  num: "3",  description: "Demonstra empenho, envolvimento e comprometimento na execução dos serviços contratados." },
          { id: "q4",  num: "4",  description: "Apresenta elevado nível de qualidade na execução e nos resultados das entregas." },
          { id: "q5",  num: "5",  description: "Articula-se com facilidade com membros de sua equipe, demais áreas e parceiros externos para gerar resultados." },
          { id: "q6",  num: "6",  description: "Supera obstáculos que surgem na execução dos serviços, identificando e implementando alternativas de solução." },
          { id: "q7",  num: "7",  description: "Conduz atividades até a conclusão, sendo conclusivo na entrega dos resultados acordados." },
          { id: "q8",  num: "8",  description: "A atuação agrega valor ao projeto e às entregas da equipe." },
          { id: "q9",  num: "9",  description: "A empresa demonstra conhecimento técnico adequado ao escopo contratado, compartilhando-o e buscando atualização quando necessário." },
          { id: "q10", num: "10", description: "O responsável técnico é ágil na identificação e geração de soluções para problemas relacionados ao escopo dos serviços." },
          { id: "q11", num: "11", description: "A empresa organiza adequadamente suas atividades e a gestão de documentos e informações vinculadas ao projeto." },
          { id: "q12", num: "12", description: "Demonstra iniciativa e motivação para entregar resultados acima do mínimo esperado." },
          { id: "q13", num: "13", description: "Cumpre os prazos acordados e os compromissos assumidos no âmbito da prestação de serviços." },
        ];
        const QS90_DECISION_LABELS = {
          continuidade: "Continuidade contratual recomendada.",
          continuidade_melhoria: "Continuidade contratual recomendada com plano de melhoria de serviço acordado.",
          encerramento: "Encerramento contratual recomendado."
        };
        const scores90 = feedback.qs90_scores || {};
        const avg90 = feedback.qs90_average;

        // Resultado
        checkPage(24);
        doc.setFillColor(248, 177, 54);
        doc.rect(margin, y - 1, contentW, 0.5, "F");
        y += 4;
        addText("RESULTADO — AVALIAÇÃO DE QUALIDADE DE SERVIÇO 90 DIAS", margin, 9, "bold", [100, 100, 120]);
        y += 1;

        // Caixas de resultado
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(margin, y - 1, 65, 18, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 120, 0);
        doc.text("Média Aritmética", margin + 3, y + 4);
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(248, 177, 54);
        doc.text(`${avg90 ? Number(avg90).toFixed(2) : "—"}`, margin + 3, y + 12);
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
        doc.text("/4,00", margin + 3 + (avg90 ? 16 : 10), y + 12);

        doc.setFillColor(248, 248, 250);
        doc.roundedRect(margin + 70, y - 1, 55, 18, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 120);
        doc.text("Itens Avaliados", margin + 73, y + 4);
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
        doc.text(`${Object.keys(scores90).length}`, margin + 73, y + 12);
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
        doc.text("/13", margin + 73 + 8, y + 12);
        y += 23;

        doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(160, 160, 160);
        doc.text('* Fórmula: Σ notas ÷ (13 − contagem de "Não Observado")', margin, y);
        y += 8;

        // Cabeçalho Itens
        checkPage(20);
        doc.setFillColor(20, 20, 30);
        doc.rect(margin, y - 1, contentW, 9, "F");
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(249, 177, 54);
        doc.text("ITENS DE AVALIAÇÃO — 90 DIAS", margin + 3, y + 4.5);
        y += 13;

        QS90_ITEMS.forEach(item => {
          const score = scores90[item.id];
          const descLines = doc.splitTextToSize(`${item.num}. ${item.description}`, contentW - 55);
          const rowH = Math.max(12, descLines.length * 5 + 6);
          checkPage(rowH + 3);

          const scoreColorsQS = { 4: [209,250,229], 3: [219,234,254], 2: [255,251,235], 1: [254,226,226], "NO": [248,248,248] };
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, y - 3, contentW, rowH, 1, 1, "F");
          doc.setDrawColor(230, 230, 235);
          doc.roundedRect(margin, y - 3, contentW, rowH, 1, 1, "S");

          // Descrição
          doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
          doc.text(descLines[0], margin + 3, y + 2);
          if (descLines.length > 1) {
            doc.setFont("helvetica", "normal");
            descLines.slice(1).forEach((line, li) => {
              doc.text(line, margin + 3, y + 2 + (li + 1) * 5);
            });
          }

          // Badge nota
          if (score !== undefined) {
            const sc = scoreColorsQS[score] || [248, 248, 248];
            const badgeLabel = `${score} – ${QS90_SL[score] || ""}`;
            const badgeW = 48;
            const badgeX = pageW - margin - badgeW;
            const badgeY = y - 1 + (rowH - 8) / 2;
            doc.setFillColor(...sc);
            doc.roundedRect(badgeX, badgeY, badgeW, 8, 3, 3, "F");
            doc.setFontSize(7); doc.setFont("helvetica", "bold");
            const textColors = { 4: [5,100,50], 3: [30,60,150], 2: [130,80,0], 1: [150,20,20], "NO": [80,80,90] };
            const tc = textColors[score] || [60,60,60];
            doc.setTextColor(...tc);
            doc.text(badgeLabel, badgeX + badgeW / 2, badgeY + 5.5, { align: "center" });
          }
          y += rowH + 2;
        });

        // Bloco 14 — Comentários Qualitativos
        if (feedback.qs90_strengths || feedback.qs90_improvements) {
          y += 4;
          checkPage(20);
          doc.setFillColor(99, 102, 241);
          doc.rect(margin, y - 1, 3, 14, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(99, 102, 241);
          doc.text("BLOCO 14 – COMENTÁRIOS QUALITATIVOS (USO INTERNO)", margin + 6, y + 5);
          y += 14;

          [[feedback.qs90_strengths, "Pontos Fortes Observados nas Entregas", [209,250,229]], [feedback.qs90_improvements, "Pontos de Melhoria na Qualidade do Serviço", [255,251,235]]].forEach(([val, lbl, bg]) => {
            if (!val) return;
            checkPage(20);
            doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 80);
            doc.text(lbl, margin, y); y += 5;
            const lines = doc.splitTextToSize(val, contentW - 6);
            doc.setFillColor(...bg);
            doc.roundedRect(margin, y - 2, contentW, lines.length * 5 + 6, 2, 2, "F");
            doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 40);
            doc.text(lines, margin + 3, y + 3);
            y += lines.length * 5 + 10;
          });
        }

        // Bloco 15 — Decisão Contratual
        if (feedback.qs90_decision) {
          y += 2;
          checkPage(20);
          const isEnc = feedback.qs90_decision === 'encerramento';
          doc.setFillColor(isEnc ? 220 : 248, isEnc ? 38 : 177, isEnc ? 38 : 54);
          doc.rect(margin, y - 1, 3, 14, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(isEnc ? 180 : 80, isEnc ? 30 : 80, isEnc ? 30 : 0);
          doc.text("BLOCO 15 – DECISÃO CONTRATUAL (USO INTERNO)", margin + 6, y + 5);
          y += 14;

          const decisionText = QS90_DECISION_LABELS[feedback.qs90_decision] || feedback.qs90_decision;
          const decLines = doc.splitTextToSize(decisionText, contentW - 6);
          doc.setFillColor(isEnc ? 254 : 255, isEnc ? 226 : 251, isEnc ? 226 : 235);
          doc.roundedRect(margin, y - 2, contentW, decLines.length * 5 + 6, 2, 2, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(isEnc ? 150 : 120, isEnc ? 20 : 80, isEnc ? 20 : 0);
          doc.text(decLines, margin + 3, y + 3);
          y += decLines.length * 5 + 10;

          if (feedback.qs90_decision_justification) {
            checkPage(20);
            doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 80);
            doc.text("Justificativa da Decisão Contratual", margin, y); y += 5;
            const jLines = doc.splitTextToSize(feedback.qs90_decision_justification, contentW - 6);
            doc.setFillColor(245, 245, 250);
            doc.roundedRect(margin, y - 2, contentW, jLines.length * 5 + 6, 2, 2, "F");
            doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 40);
            doc.text(jLines, margin + 3, y + 3);
            y += jLines.length * 5 + 8;
          }
        }

      } else if (feedback.feedback_type === 'one_on_one') {
        // ── Registro 1:1 ──────────────────────────────────────────────────────
        checkPage(20);
        doc.setFillColor(20, 20, 30);
        doc.rect(margin, y - 1, contentW, 8, "F");
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(249, 177, 54);
        doc.text("REGISTRO DA CONVERSA DE ALINHAMENTO 1:1", margin + 3, y + 4);
        y += 12;

        doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 120);
        doc.text("USO INTERNO – Bloqueado para visualização pelo Prestador (LGPD)", margin, y); y += 6;

        if (feedback.has_critical_impediment) {
          checkPage(14);
          doc.setFillColor(254, 226, 226);
          doc.roundedRect(margin, y - 2, contentW, 10, 1, 1, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(180, 30, 30);
          doc.text("⚠ IMPEDIMENTO CRÍTICO SINALIZADO PELO GESTOR", margin + 3, y + 4);
          y += 14;
        }

        if (feedback.one_on_one_notes) {
          checkPage(20);
          const lines = doc.splitTextToSize(feedback.one_on_one_notes, contentW - 6);
          doc.setFillColor(245, 245, 250);
          doc.roundedRect(margin, y - 2, contentW, lines.length * 5 + 6, 2, 2, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 40);
          doc.text(lines, margin + 3, y + 2);
          y += lines.length * 5 + 10;
        }

      } else if (feedback.feedback_type === 'evaluation') {
        const HARD = [
          { id: "h1", label: "H1 – Conhecimento Técnico" },
          { id: "h2", label: "H2 – Qualidade das Entregas" },
          { id: "h3", label: "H3 – Produtividade" },
          { id: "h4", label: "H4 – Gestão de Informações" },
          { id: "h5", label: "H5 – Cumprimento de Prazos" },
        ];
        const SOFT = [
          { id: "s1", label: "S1 – Comunicação" },
          { id: "s2", label: "S2 – Trabalho em Equipe" },
          { id: "s3", label: "S3 – Proatividade" },
          { id: "s4", label: "S4 – Adaptabilidade" },
          { id: "s5", label: "S5 – Responsabilidade" },
        ];
        const SL = { 1: "Abaixo do Esperado", 2: "Em Desenvolvimento", 3: "Atende ao Esperado", 4: "Supera o Esperado" };
        const hardTotal = HARD.reduce((s, c) => s + (feedback[`${c.id}_score`] || 0), 0);
        const softTotal = SOFT.reduce((s, c) => s + (feedback[`${c.id}_score`] || 0), 0);
        const total = feedback.total_score || (hardTotal + softTotal);
        const BANDS = { immediate_action: "Alerta – PIP", attention: "Atenção – Suporte necessário", adequate: "Adequado – Manutenção", reference: "Referência – Promoção" };

        // Resultado
        checkPage(30);
        doc.setFillColor(248, 177, 54);
        doc.rect(margin, y - 1, contentW, 0.5, "F");
        y += 4;
        addText("RESULTADO DA AVALIAÇÃO", margin, 9, "bold", [100, 100, 120]);
        y += 1;
        addText(`Pontuação Total: ${total}/40   |   Hard Skills: ${hardTotal}/20   |   Soft Skills: ${softTotal}/20`, margin, 11, "bold", [20, 20, 30]);
        if (feedback.performance_band) addText(`Faixa de Desempenho: ${BANDS[feedback.performance_band] || feedback.performance_band}`, margin, 10, "bold", [20, 20, 30]);
        if (feedback.recommended_action) addText(`Ação Recomendada: ${feedback.recommended_action}`, margin, 9, "normal", [60, 60, 80]);
        y += 4;

        // Hard Skills
        checkPage(20);
        doc.setFillColor(20, 20, 30);
        doc.rect(margin, y - 1, contentW, 8, "F");
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(249, 177, 54);
        doc.text(`BLOCO H – HARD SKILLS   (${hardTotal}/20)`, margin + 3, y + 4);
        y += 12;

        HARD.forEach(c => {
          checkPage(16);
          const score = feedback[`${c.id}_score`];
          const evidence = feedback[`${c.id}_evidence`];
          const scoreColors = { 1: [254,226,226], 2: [255,251,235], 3: [219,234,254], 4: [209,250,229] };
          const sc = scoreColors[score] || [245,245,245];
          doc.setFillColor(...sc);
          doc.roundedRect(margin, y - 4, contentW, evidence ? 16 : 10, 1, 1, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
          doc.text(c.label, margin + 3, y + 1);
          doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 80);
          doc.text(`${score} – ${SL[score] || ""}`, pageW - margin - 3, y + 1, { align: "right" });
          y += 6;
          if (evidence) {
            doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 120);
            const lines = doc.splitTextToSize(`Evidência: ${evidence}`, contentW - 6);
            doc.text(lines, margin + 3, y);
            y += lines.length * 4;
          }
          y += 5;
        });

        // Soft Skills
        checkPage(20);
        doc.setFillColor(248, 177, 54);
        doc.rect(margin, y - 1, contentW, 8, "F");
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 30);
        doc.text(`BLOCO S – SOFT SKILLS   (${softTotal}/20)`, margin + 3, y + 4);
        y += 12;

        SOFT.forEach(c => {
          checkPage(16);
          const score = feedback[`${c.id}_score`];
          const evidence = feedback[`${c.id}_evidence`];
          const scoreColors = { 1: [254,226,226], 2: [255,251,235], 3: [219,234,254], 4: [209,250,229] };
          const sc = scoreColors[score] || [245,245,245];
          doc.setFillColor(...sc);
          doc.roundedRect(margin, y - 4, contentW, evidence ? 16 : 10, 1, 1, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
          doc.text(c.label, margin + 3, y + 1);
          doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 80);
          doc.text(`${score} – ${SL[score] || ""}`, pageW - margin - 3, y + 1, { align: "right" });
          y += 6;
          if (evidence) {
            doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 120);
            const lines = doc.splitTextToSize(`Evidência: ${evidence}`, contentW - 6);
            doc.text(lines, margin + 3, y);
            y += lines.length * 4;
          }
          y += 5;
        });

        // Plano de Ação
        if (feedback.eval_action_1 || feedback.eval_action_2 || feedback.eval_action_3) {
          checkPage(20);
          y += 2;
          addText("PLANO DE AÇÃO (PDI)", margin, 9, "bold", [100, 100, 120]);
          [[feedback.eval_action_1, "Ação 1"], [feedback.eval_action_2, "Ação 2"], [feedback.eval_action_3, "Ação 3"]].forEach(([val, lbl]) => {
            if (!val) return;
            checkPage(14);
            doc.setFillColor(245, 245, 250);
            doc.roundedRect(margin, y - 4, contentW, 12, 1, 1, "F");
            doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(120, 120, 140);
            doc.text(lbl, margin + 3, y);
            y += 4;
            doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 40);
            const lines = doc.splitTextToSize(val, contentW - 6);
            doc.text(lines, margin + 3, y);
            y += lines.length * 4 + 5;
          });
        }
      } else {
        // Feedback simples
        [["Pontos Fortes", feedback.strengths, [209,250,229]], ["Pontos de Melhoria", feedback.improvements, [255,251,235]], ["Plano de Ação", feedback.action_plan, [219,234,254]], ["Observações", feedback.additional_notes, [245,245,250]]].forEach(([lbl, val, bg]) => {
          if (!val) return;
          checkPage(20);
          addText(lbl.toUpperCase(), margin, 9, "bold", [100, 100, 120]);
          y += 1;
          doc.setFillColor(...bg);
          const lines = doc.splitTextToSize(val, contentW - 6);
          doc.roundedRect(margin, y - 4, contentW, lines.length * 5 + 6, 2, 2, "F");
          doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 40);
          doc.text(lines, margin + 3, y);
          y += lines.length * 5 + 8;
        });
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(20, 20, 30);
        doc.rect(0, 285, pageW, 12, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
        doc.text("LogLab – Sistema de Gestão de Pessoas", margin, 292);
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 292, { align: "right" });
      }

      const fileName = `avaliacao_${(feedback.employee_name || "colaborador").replace(/\s+/g, "_")}_${feedback.quarter_reference || format(new Date(), "yyyy-MM")}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPdf(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'Revisar Feedback' : 'Visualizar Feedback'}
            </h1>
            <p className="text-slate-500">
              {feedback.workflow_status === 'EM_REVISAO_ADMIN' 
                ? 'Analise e aprove o feedback preenchido pelo gestor'
                : 'Feedback já revisado e aprovado'}
            </p>
          </div>
          {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Em Revisão
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Aprovado
            </Badge>
          )}
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
              <p className="text-xs text-slate-400 mt-1">
                Gestor: {feedback.manager_name} • Data: {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta impedimento crítico 1:1 */}
      {feedback.feedback_type === 'one_on_one' && feedback.has_critical_impediment && (
        <Alert className="bg-red-50 border-2 border-red-600">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-bold text-base">
            🚨 IMPEDIMENTO CRÍTICO — O Gestor sinalizou um impedimento crítico à execução neste 1:1. Análise imediata necessária.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta crítico de encerramento contratual para o Admin */}
      {feedback.feedback_type === 'experience_90d' && feedback.qs90_decision === 'encerramento' && (
        <Alert className="bg-red-50 border-2 border-red-600">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-bold text-base">
            ⚠️ ATENÇÃO ADMINISTRADOR — O Gestor recomendou ENCERRAMENTO CONTRATUAL para este prestador de serviços. Revise com atenção antes de aprovar.
          </AlertDescription>
        </Alert>
      )}

      {feedback.feedback_type === 'evaluation' ? (
        <AvaliacaoContent fb={feedback} />
      ) : feedback.feedback_type === 'experience_45d' ? (
        <Exp45Content fb={feedback} />
      ) : feedback.feedback_type === 'experience_90d' ? (
        <Qs90Content fb={feedback} isInternal={true} />
      ) : feedback.feedback_type === 'one_on_one' ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{background: '#14141E'}}>1:1</div>
              Registro da Conversa de Alinhamento
            </CardTitle>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              🔒 Uso interno — Bloqueado para visualização pelo Prestador (LGPD)
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
              {feedback.one_on_one_notes || <span className="text-slate-400 italic">Nenhum registro informado.</span>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Conteúdo do Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
            {feedback.additional_notes && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2">Observações</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-700 whitespace-pre-wrap">{feedback.additional_notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bloco de Calibragem — aparece sempre que houver nota salva */}
      {feedback.admin_director_notes && (
        <Card className="border-0 shadow-sm" style={{borderLeft: '4px solid #8B5CF6', background: '#faf5ff'}}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2" style={{color: '#7C3AED'}}>
              <SlidersHorizontal className="w-4 h-4" />
              Calibragem do Administrador
            </CardTitle>
            <p className="text-xs text-purple-400">Comentário interno — visível para o gestor após aprovação</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-xl border border-purple-100 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
              {feedback.admin_director_notes}
            </div>
            <button
              onClick={() => { setCalibragemText(feedback.admin_director_notes); setShowCalibragem(true); }}
              className="mt-2 text-xs text-purple-500 hover:text-purple-700 underline"
            >
              Editar comentário
            </button>
          </CardContent>
        </Card>
      )}

      {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? (
        <>
          <Alert className="bg-blue-50 border-blue-200 mb-6">
            <AlertDescription className="text-blue-700">
              <strong>Revisão de Conformidade:</strong> Verifique se o conteúdo está adequado às políticas da empresa antes de aprovar.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="font-semibold"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {generatingPdf ? "Gerando PDF..." : "Gerar PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setCalibragemText(feedback.admin_director_notes || ""); setShowCalibragem(true); }}
              className="font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Calibragem
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={approving}
              style={{background: '#22C55E', color: 'white'}}
              className="font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {approving ? "Aprovando..." : "Concluir e Aprovar Feedback"}
            </Button>
          </div>

          <Alert className="bg-slate-50 border-slate-200">
            <AlertDescription className="text-slate-600">
              Após a aprovação, o gestor deverá agendar uma conversa com o colaborador antes de publicar o feedback.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <>
          <Alert className="bg-emerald-50 border-emerald-200">
            <AlertDescription className="text-emerald-700">
              <CheckCircle className="w-5 h-5 inline mr-2" />
              <strong>Feedback em conformidade:</strong> Disponibilizado para o gestor enviar ao colaborador após conversa pessoalmente.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="font-semibold"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {generatingPdf ? "Gerando PDF..." : "Gerar PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setCalibragemText(feedback.admin_director_notes || ""); setShowCalibragem(true); }}
              className="font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Calibragem
            </Button>
          </div>
        </>
      )}

      {/* Dialog de Calibragem */}
      <Dialog open={showCalibragem} onOpenChange={setShowCalibragem}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <SlidersHorizontal className="w-5 h-5" />
              Calibragem do Administrador
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mb-3">
            Registre um comentário de calibragem sobre este feedback. Este comentário ficará visível para o gestor na linha do tempo após a aprovação.
          </p>
          <Textarea
            value={calibragemText}
            onChange={(e) => setCalibragemText(e.target.value)}
            placeholder="Ex: Atenção ao peso das hard skills H3 e H4 em relação ao contexto do projeto atual. Considere reforçar o plano de ação para os próximos 30 dias..."
            className="min-h-[130px] resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowCalibragem(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveCalibragem}
              disabled={savingCalibragem || !calibragemText.trim()}
              style={{background: '#8B5CF6', color: 'white'}}
              className="font-semibold"
            >
              <MessageSquareDiff className="w-4 h-4 mr-2" />
              {savingCalibragem ? "Salvando..." : "Salvar Calibragem"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}