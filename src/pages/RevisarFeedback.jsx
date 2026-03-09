import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, FileDown, AlertTriangle } from "lucide-react";
import Qs90Content from "@/components/feedback/Qs90Content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

      navigate(createPageUrl("Respostas"));
    } catch (e) {
      setError(e.message || "Erro ao aprovar feedback");
    } finally {
      setApproving(false);
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

      if (feedback.feedback_type === 'evaluation') {
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
          onClick={() => navigate(createPageUrl("Feedbacks"))}
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

      {feedback.feedback_type === 'evaluation' ? (
        <AvaliacaoContent fb={feedback} />
      ) : feedback.feedback_type === 'experience_45d' ? (
        <Exp45Content fb={feedback} />
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

      {feedback.workflow_status === 'EM_REVISAO_ADMIN' ? (
        <>
          <Alert className="bg-blue-50 border-blue-200 mb-6">
            <AlertDescription className="text-blue-700">
              <strong>Revisão de Conformidade:</strong> Verifique se o conteúdo está adequado às políticas da empresa antes de aprovar.
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
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="font-semibold"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {generatingPdf ? "Gerando PDF..." : "Gerar PDF"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}