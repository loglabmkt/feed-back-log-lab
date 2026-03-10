import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TypeDistributionChart({ typeDistribution, totalFeedbacks, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            Distribuição por Tipo de Ritual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
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
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          Distribuição por Tipo de Ritual
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {typeDistribution.map((type, index) => (
              <div
                key={index}
                className="p-5 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: `${type.color}12` }}
              >
                <p className="text-xs font-semibold" style={{ color: type.color }}>{type.name}</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{type.value}</p>
                <div className="mt-3">
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: `${type.color}20` }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${totalFeedbacks > 0 ? (type.value / totalFeedbacks) * 100 : 0}%`,
                        backgroundColor: type.color
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {totalFeedbacks > 0 ? Math.round((type.value / totalFeedbacks) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <LayoutGrid className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Nenhum dado disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}