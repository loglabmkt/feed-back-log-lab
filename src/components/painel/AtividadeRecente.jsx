import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name) {
  if (!name) return "?";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function AtividadeRecente({ items, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5" style={{ color: '#F8B137' }} />
            Atividade Recente
          </CardTitle>
          <Link to={createPageUrl("Respostas")}>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 h-7 text-xs gap-1">
              Ver todos
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback
                    className="text-xs font-bold text-white"
                    style={{ background: item.ritualColor }}
                  >
                    {getInitials(item.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.employeeName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs h-4 px-1.5 border-0"
                      style={{ background: `${item.ritualColor}18`, color: item.ritualColor }}
                    >
                      {item.ritualLabel}
                    </Badge>
                    <span className="text-xs text-slate-400">• {item.managerName}</span>
                    <span className="text-xs text-slate-400">• {formatDate(item.conclusionDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.isOnTime ? (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      No prazo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 gap-1">
                      <Clock className="w-3 h-3" />
                      Com atraso
                    </Badge>
                  )}
                  <Link to={createPageUrl("RevisarFeedback") + `?id=${item.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">Nenhuma avaliação assinada ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}