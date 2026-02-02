import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users,
  MessageSquare
} from "lucide-react";

export default function KPICards({ stats, loading }) {
  const kpis = [
    {
      title: "Taxa de Compliance",
      value: `${stats.complianceRate}%`,
      subtitle: "colaboradores em dia",
      icon: TrendingUp,
      bgColor: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-200/50",
      iconColor: "text-blue-700"
    },
    {
      title: "Total de Feedbacks",
      value: stats.totalFeedbacks,
      subtitle: "registrados no sistema",
      icon: MessageSquare,
      bgColor: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-200/50",
      iconColor: "text-emerald-700"
    },
    {
      title: "Aguardando Validação",
      value: stats.pendingValidations,
      subtitle: "feedbacks pendentes",
      icon: Clock,
      bgColor: "from-amber-50 to-amber-100",
      iconBg: "bg-amber-200/50",
      iconColor: "text-amber-700"
    },
    {
      title: "Radar de Risco",
      value: stats.atRiskCount,
      subtitle: ">90 dias sem feedback",
      icon: AlertTriangle,
      bgColor: "from-red-50 to-red-100",
      iconBg: "bg-red-200/50",
      iconColor: "text-red-700"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className={`border-0 shadow-sm bg-gradient-to-br ${kpi.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${kpi.iconColor}`}>{kpi.title}</p>
                  <p className="text-4xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                  <p className={`text-xs mt-1 ${kpi.iconColor}`}>{kpi.subtitle}</p>
                </div>
                <div className={`w-14 h-14 ${kpi.iconBg} rounded-2xl flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}