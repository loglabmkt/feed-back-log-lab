import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";

const ALERT_DAYS = 5;

function diffDays(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function getRitualStatus(dataPrevista) {
  const days = diffDays(dataPrevista);
  if (days === null) return null;
  if (days < 0) return { status: "VENCIDO", diasRestantes: days };
  if (days <= ALERT_DAYS) return { status: "VENCENDO_EM_BREVE", diasRestantes: days };
  return null;
}

function calcDate(baseDate, addDays) {
  if (!baseDate) return null;
  const d = new Date(baseDate);
  d.setDate(d.getDate() + addDays);
  return d.toISOString().split("T")[0];
}

function getLastRecurringDate(startDate, intervalDays, feedbacks, type) {
  const relevant = feedbacks
    .filter(f => f.feedback_type === type && f.workflow_status === "ASSINADO_COLABORADOR")
    .sort((a, b) => new Date(b.feedback_date || b.created_date) - new Date(a.feedback_date || a.created_date));
  return relevant.length > 0 ? (relevant[0].feedback_date || relevant[0].created_date?.split("T")[0]) : startDate;
}

function computeRituais(col, feedbacks) {
  const myFeedbacks = feedbacks.filter(f => f.employee_id === col.id);

  // 45 dias
  const base45 = col.ritual_45d_use_admission !== false ? col.admission_date : col.ritual_45d_custom_start;
  const completed45 = col.ritual_45d_completed_manual ||
    myFeedbacks.some(f => f.feedback_type === "experience_45d" && f.workflow_status === "ASSINADO_COLABORADOR");
  const avaliacao45 = completed45 ? null : getRitualStatus(calcDate(base45, 45));

  // 90 dias
  const base90 = col.ritual_90d_use_admission !== false ? col.admission_date : col.ritual_90d_custom_start;
  const completed90 = col.ritual_90d_completed_manual ||
    myFeedbacks.some(f => f.feedback_type === "experience_90d" && f.workflow_status === "ASSINADO_COLABORADOR");
  const avaliacao90 = completed90 ? null : getRitualStatus(calcDate(base90, 90));

  // Trimestral (90 dias de ciclo)
  const startTrim = col.ritual_trimestral_use_admission !== false ? col.admission_date : col.ritual_trimestral_custom_start;
  const lastTrim = getLastRecurringDate(startTrim, 90, myFeedbacks, "evaluation");
  const trimestral = getRitualStatus(calcDate(lastTrim, 90));

  // 1:1 (60 dias de ciclo)
  const start11 = col.ritual_1on1_use_admission !== false ? col.admission_date : col.ritual_1on1_custom_start;
  const last11 = getLastRecurringDate(start11, 60, myFeedbacks, "one_on_one");
  const oneOnOne = getRitualStatus(calcDate(last11, 60));

  return { avaliacao45, avaliacao90, trimestral, oneOnOne };
}

function RitualCell({ info }) {
  if (!info) return <td className="px-3 py-2 text-center text-slate-300 text-xs">—</td>;
  const isVencido = info.status === "VENCIDO";
  return (
    <td className="px-3 py-2 text-center">
      <div className="flex flex-col items-center gap-0.5">
        <Badge className={isVencido ? "bg-red-100 text-red-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
          {isVencido ? "Vencido" : `Vence em ${info.diasRestantes}d`}
        </Badge>
      </div>
    </td>
  );
}

export default function RotinasWidget({ gestorId }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!gestorId) return;
    try {
      const [colaboradores, feedbacks] = await Promise.all([
        base44.entities.Colaborador.filter({ manager_id: gestorId, status: "active" }),
        base44.entities.FeedbackRecord.filter({ manager_id: gestorId })
      ]);

      const result = colaboradores
        .map(col => {
          const rituais = computeRituais(col, feedbacks);
          const hasAlert = rituais.avaliacao45 || rituais.avaliacao90 || rituais.trimestral || rituais.oneOnOne;
          if (!hasAlert) return null;
          return {
            id: col.id,
            nome: col.full_name,
            cargo: col.position || col.department || "",
            initials: col.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?",
            rituais
          };
        })
        .filter(Boolean);

      setRows(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [gestorId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm mb-8">
        <CardHeader>
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-80 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-amber-200 shadow-sm mb-8" style={{ background: "rgba(248,177,55,0.03)" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Atenção — Rotinas Pendentes
        </CardTitle>
        <p className="text-sm text-slate-500">Colaboradores com rotinas vencidas ou vencendo em breve</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">Todas as rotinas do seu time estão em dia!</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Colaborador</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">45 Dias</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">90 Dias</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Trimestral</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">1:1</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#F8B137", color: "#0a0a0a" }}>
                          {row.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-sm">{row.nome}</p>
                          {row.cargo && <p className="text-xs text-slate-500 truncate">{row.cargo}</p>}
                        </div>
                      </div>
                    </td>
                    <RitualCell info={row.rituais.avaliacao45} />
                    <RitualCell info={row.rituais.avaliacao90} />
                    <RitualCell info={row.rituais.trimestral} />
                    <RitualCell info={row.rituais.oneOnOne} />
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate("/gestorfeedbacks")}
                        className="text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        Ir para Rotinas <ArrowRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}