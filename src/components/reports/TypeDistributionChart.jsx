import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, CheckCircle, Clock, AlertCircle, Hourglass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Exibe a distribuição de rituais por tipo.
 * Cada card mostra: total, no prazo, com atraso, atrasados e pendentes/em risco.
 * Os dados já chegam calculados pelo motor reportEngine (getDistributionByRitual).
 */
export default function TypeDistributionChart({ typeDistribution, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" style={{ color: '#F8B137' }} />
            Distribuição por Tipo de Ritual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = typeDistribution && typeDistribution.length > 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" style={{ color: '#F8B137' }} />
          Distribuição por Tipo de Ritual
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {typeDistribution.map((type, index) => (
              <div
                key={index}
                className="p-4 rounded-xl"
                style={{ backgroundColor: `${type.color}12` }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: type.color }}>{type.name}</p>
                <p className="text-3xl font-bold text-slate-900">{type.total}</p>
                <p className="text-xs text-slate-500 mb-3">total</p>

                {/* Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> No prazo
                    </span>
                    <span className="font-semibold text-emerald-700">{type.onTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-3 h-3" /> Com atraso
                    </span>
                    <span className="font-semibold text-orange-600">{type.late}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-3 h-3" /> Atrasados
                    </span>
                    <span className="font-semibold text-red-600">{type.delayed}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Hourglass className="w-3 h-3" /> Pendente
                    </span>
                    <span className="font-semibold text-slate-500">{type.pending}</span>
                  </div>
                </div>

                {/* Barra de progresso: % no prazo sobre total devido (excluindo pendentes) */}
                {(type.onTime + type.late + type.delayed) > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/60">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.round((type.onTime / (type.onTime + type.late + type.delayed)) * 100)}%`,
                          backgroundColor: type.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.round((type.onTime / (type.onTime + type.late + type.delayed)) * 100)}% aderência
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <LayoutGrid className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-slate-400 mt-1">Configure as datas âncora dos prestadores para visualizar os rituais</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}