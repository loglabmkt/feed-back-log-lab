import React from "react";
import { TrendingDown, Minus, TrendingUp, Award, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const BANDS = {
  immediate_action: {
    key: "immediate_action",
    label: "Ação Imediata",
    range: "10 – 15 pts",
    action: "Plano de melhoria estruturado (PIP) com acompanhamento quinzenal e metas claras.",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    scoreBg: "bg-red-600",
    icon: TrendingDown,
    barColor: "#ef4444"
  },
  attention: {
    key: "attention",
    label: "Atenção",
    range: "16 – 22 pts",
    action: "Identificar gargalos específicos. 1:1 focado em desenvolvimento e suporte ativo do gestor.",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    scoreBg: "bg-amber-500",
    icon: Minus,
    barColor: "#f59e0b"
  },
  adequate: {
    key: "adequate",
    label: "Adequado",
    range: "23 – 32 pts",
    action: "Prestador entrega dentro do esperado. Manter consistência e explorar evolução gradual.",
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    scoreBg: "bg-blue-600",
    icon: TrendingUp,
    barColor: "#3b82f6"
  },
  reference: {
    key: "reference",
    label: "Referência",
    range: "33 – 40 pts",
    action: "Explorar protagonismo, escopo ampliado, projetos estratégicos e renovação contratual diferenciada.",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    scoreBg: "bg-emerald-600",
    icon: Award,
    barColor: "#10b981"
  }
};

export function getBandKey(score) {
  if (score >= 10 && score <= 15) return "immediate_action";
  if (score >= 16 && score <= 22) return "attention";
  if (score >= 23 && score <= 32) return "adequate";
  if (score >= 33 && score <= 40) return "reference";
  return null;
}

export default function ScoreSummary({ totalScore, filledCount }) {
  const allFilled = filledCount === 10;
  const bandKey = allFilled ? getBandKey(totalScore) : null;
  const band = bandKey ? BANDS[bandKey] : null;
  const Icon = band?.icon;

  // Progress bar percentage (10-40 range mapped to 0-100%)
  const progressPct = allFilled ? Math.round(((totalScore - 10) / 30) * 100) : 0;

  return (
    <Card className={`border-2 transition-all ${band ? band.border : "border-slate-200"}`}>
      <CardContent className="p-0">
        {/* Top: score + band */}
        <div className={`p-6 rounded-t-xl ${band ? band.bg : "bg-slate-50"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Score circle */}
            <div className="flex-shrink-0 text-center">
              <div
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-inner border-4 ${
                  band ? `${band.border} bg-white` : "border-slate-200 bg-white"
                }`}
              >
                <span className={`text-4xl font-black ${band ? band.text : "text-slate-300"}`}>
                  {allFilled ? totalScore : "--"}
                </span>
                <span className="text-xs text-slate-400 font-medium">de 40</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{filledCount}/10 critérios</p>
            </div>

            {/* Band info */}
            {band && Icon ? (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${band.text}`} />
                  <span className={`text-2xl font-black ${band.text}`}>{band.label}</span>
                  <span className="text-sm text-slate-400 ml-1">({band.range} pts)</span>
                </div>
                <div className={`mt-3 p-4 rounded-xl border ${band.border} bg-white/60`}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    Ação Recomendada pelo Sistema
                  </p>
                  <p className={`font-bold text-base ${band.text}`}>{band.action}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-400 mb-1">Resultado Pendente</p>
                <p className="text-sm text-slate-400">
                  Preencha todos os 10 critérios (H1–H5 e S1–S5) para visualizar a faixa de desempenho e a ação recomendada.
                </p>
                {filledCount > 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    Pontuação parcial: <strong>{totalScore}</strong> pts com {filledCount} critério(s) avaliado(s).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {allFilled && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span>10 – Ação Imediata</span>
                <span>Referência – 40</span>
              </div>
              <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-200 relative">
                {/* Band zones */}
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-red-200" style={{width: '20%'}} />
                  <div className="h-full bg-amber-200" style={{width: '23.3%'}} />
                  <div className="h-full bg-blue-200" style={{width: '33.3%'}} />
                  <div className="h-full bg-emerald-200" style={{width: '23.4%'}} />
                </div>
                {/* Score marker */}
                <div
                  className="absolute top-0 h-full rounded-r-full transition-all duration-500"
                  style={{width: `${progressPct}%`, background: band?.barColor, opacity: 0.85}}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom: band table reference */}
        <div className="p-4 bg-white rounded-b-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Tabela de Referência</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.values(BANDS).map((b) => {
              const BIcon = b.icon;
              const isActive = bandKey === b.key;
              return (
                <div key={b.key} className={`p-2.5 rounded-lg border text-center transition-all ${isActive ? `${b.bg} ${b.border} ring-2 ring-offset-1` : 'border-slate-100 bg-slate-50'}`}
                  style={isActive ? {ringColor: b.barColor} : {}}>
                  <BIcon className={`w-4 h-4 mx-auto mb-1 ${isActive ? b.text : 'text-slate-400'}`} />
                  <p className={`text-xs font-bold ${isActive ? b.text : 'text-slate-500'}`}>{b.label}</p>
                  <p className="text-xs text-slate-400">{b.range} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}