import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name) {
  if (!name) return "?";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProximosVencimentos({ items, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-5 h-5" style={{ color: '#F8B137' }} />
          Próximos Vencimentos
          <Badge variant="outline" className="ml-auto text-xs bg-amber-50 text-amber-700 border-amber-200">
            próx. 10 dias
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, i) => {
              const urgent = item.daysUntilDue <= 3;
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="text-xs font-bold text-white" style={{ background: item.ritualColor }}>
                      {getInitials(item.colaboradorNome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.colaboradorNome}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-xs h-4 px-1.5 border-0"
                        style={{ background: `${item.ritualColor}18`, color: item.ritualColor }}
                      >
                        {item.ritualLabel}
                      </Badge>
                      <span className="text-xs text-slate-400 truncate">• {item.gestorNome}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 text-xs gap-1 ${
                      urgent
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {item.daysUntilDue === 0 ? 'Hoje' : `${item.daysUntilDue}d`}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">Nenhum vencimento nos próximos 10 dias.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}