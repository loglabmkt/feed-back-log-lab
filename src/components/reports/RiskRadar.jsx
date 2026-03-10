import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RiskRadar({ usersAtRisk, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Radar de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          Radar de Risco — Colaboradores Pendentes
        </CardTitle>
        {usersAtRisk.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            Colaboradores sem conclusão em formulários com prazo vencido ou vencendo em até 7 dias
          </p>
        )}
      </CardHeader>
      <CardContent>
        {usersAtRisk.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-100">
                  <th className="text-left p-3 font-medium text-slate-500 text-sm">Colaborador</th>
                  <th className="text-left p-3 font-medium text-slate-500 text-sm">Gestor</th>
                  <th className="text-left p-3 font-medium text-slate-500 text-sm">Formulário pendente</th>
                  <th className="text-left p-3 font-medium text-slate-500 text-sm">Prazo</th>
                  <th className="text-left p-3 font-medium text-slate-500 text-sm">Situação</th>
                </tr>
              </thead>
              <tbody>
                {usersAtRisk.slice(0, 15).map((user) => {
                  const [y, m, d] = user.deadline ? user.deadline.split('-') : [null, null, null];
                  const deadlineStr = d ? `${d}/${m}/${y}` : '—';
                  const isOverdue = user.isOverdue;
                  const daysUntil = user.daysUntil;

                  return (
                    <tr key={`${user.id}-${user.templateTitle}`} className="border-b border-red-50 hover:bg-red-50/40">
                      <td className="p-3">
                        <p className="font-medium text-slate-900 text-sm">{user.full_name}</p>
                        <p className="text-xs text-slate-400">{user.position || user.department || ''}</p>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{user.gestorName}</td>
                      <td className="p-3 text-sm text-slate-600 max-w-[200px] truncate">{user.templateTitle}</td>
                      <td className="p-3 text-sm font-medium">
                        {user.deadline ? (
                          <span className={isOverdue ? 'text-red-600' : 'text-amber-600'}>
                            {deadlineStr}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isOverdue
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {isOverdue
                            ? `Vencido há ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) !== 1 ? 's' : ''}`
                            : `Vence em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`
                          }
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {usersAtRisk.length > 15 && (
              <p className="text-center text-sm text-slate-500 mt-4 pt-4 border-t border-red-100">
                Mostrando 15 de {usersAtRisk.length} colaboradores em risco
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
            <p className="text-emerald-600 font-semibold">Nenhum colaborador em risco!</p>
            <p className="text-sm text-slate-400 mt-1">
              Todos estão em compliance com os prazos dos formulários ativos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}