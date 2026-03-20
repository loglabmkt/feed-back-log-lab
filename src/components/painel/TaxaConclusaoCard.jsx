import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TaxaConclusaoCard({ taxa, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pct = taxa?.percentual ?? 0;
  const barColor = pct >= 80 ? '[&>div]:bg-emerald-500' : pct >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500';

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#F8B137' }} />
          Taxa de Conclusão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Rituais Concluídos</span>
            <span className="text-2xl font-bold text-slate-900">{pct}%</span>
          </div>
          <Progress value={pct} className={`h-3 ${barColor}`} />
          <p className="text-xs text-slate-400 mt-1">
            {taxa?.concluidosNoPrazo + taxa?.concluidosComAtraso ?? 0} de {taxa?.totalDevido ?? 0} rituais devidos
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-500 leading-tight">No prazo</p>
            <p className="text-lg font-bold text-emerald-600">{taxa?.concluidosNoPrazo ?? 0}</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-xs text-slate-500 leading-tight">Com atraso</p>
            <p className="text-lg font-bold text-orange-500">{taxa?.concluidosComAtraso ?? 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 leading-tight">Não concluídos</p>
            <p className="text-lg font-bold text-red-600">{taxa?.atrasadosNaoConcluidos ?? 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}