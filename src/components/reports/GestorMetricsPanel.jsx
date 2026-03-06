import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  UserCheck
} from "lucide-react";

const DONE_STATUSES = ['APROVADO', 'CONVERSA_AGENDADA', 'CONVERSA_REALIZADA', 'PUBLICADO', 'ASSINADO_COLABORADOR', 'EM_REVISAO_ADMIN'];

const FEEDBACK_TYPE_LABELS = {
  feedback: "Feedback",
  one_on_one: "1:1",
  evaluation: "Avaliação Trimestral",
  experience_45d: "Avaliação 45 Dias"
};

export default function GestorMetricsPanel({ gestor, colaboradores, feedbacks, selectedFeedbackType }) {
  if (!gestor) return null;

  // Filtra colaboradores deste gestor
  const teamMembers = colaboradores.filter(c => c.manager_id === gestor.id && c.status === 'active');

  // Filtra feedbacks deste gestor (+ tipo se selecionado)
  let gestorFeedbacks = feedbacks.filter(f => f.manager_id === gestor.id);
  if (selectedFeedbackType && selectedFeedbackType !== 'all') {
    gestorFeedbacks = gestorFeedbacks.filter(f => f.feedback_type === selectedFeedbackType);
  }

  const realizados = gestorFeedbacks.filter(f => DONE_STATUSES.includes(f.workflow_status)).length;
  const pendentes = gestorFeedbacks.filter(f => f.workflow_status === 'DISPONIVEL_PARA_GESTOR').length;
  const total = gestorFeedbacks.length;
  
  // Aderência: colaboradores que têm pelo menos 1 avaliação concluída
  const colaboradoresComFeedback = new Set(
    gestorFeedbacks
      .filter(f => DONE_STATUSES.includes(f.workflow_status))
      .map(f => f.employee_id)
  );
  const aderencia = teamMembers.length > 0
    ? Math.round((colaboradoresComFeedback.size / teamMembers.length) * 100)
    : 0;

  // Breakdown por tipo de avaliação (apenas quando não filtrado)
  const byType = Object.entries(FEEDBACK_TYPE_LABELS).map(([key, label]) => {
    const typeFeedbacks = feedbacks.filter(f => f.manager_id === gestor.id && f.feedback_type === key);
    const done = typeFeedbacks.filter(f => DONE_STATUSES.includes(f.workflow_status)).length;
    return { key, label, total: typeFeedbacks.length, done };
  }).filter(t => t.total > 0);

  const kpis = [
    {
      title: "Tamanho do Time",
      value: teamMembers.length,
      subtitle: "colaboradores ativos",
      icon: Users,
      color: "text-[#F8B137]",
      bg: "bg-amber-50",
      iconBg: "bg-[#F8B137]/20"
    },
    {
      title: "Feedbacks Realizados",
      value: realizados,
      subtitle: `de ${total} total`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100"
    },
    {
      title: "Pendentes",
      value: pendentes,
      subtitle: "aguardando preenchimento",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100"
    },
    {
      title: "Aderência",
      value: `${aderencia}%`,
      subtitle: `${colaboradoresComFeedback.size}/${teamMembers.length} colaboradores`,
      icon: TrendingUp,
      color: aderencia >= 80 ? "text-emerald-600" : aderencia >= 50 ? "text-amber-600" : "text-red-600",
      bg: aderencia >= 80 ? "bg-emerald-50" : aderencia >= 50 ? "bg-amber-50" : "bg-red-50",
      iconBg: aderencia >= 80 ? "bg-emerald-100" : aderencia >= 50 ? "bg-amber-100" : "bg-red-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header do Gestor */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-100 shadow-sm">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
          style={{ background: '#F8B137' }}>
          {gestor.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{gestor.full_name}</h3>
          <p className="text-sm text-slate-500">{gestor.department || 'Sem departamento'} {gestor.position ? `· ${gestor.position}` : ''}</p>
        </div>
        <div className="ml-auto">
          <Badge className={`text-sm px-3 py-1 ${aderencia >= 80 ? 'bg-emerald-100 text-emerald-700' : aderencia >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {aderencia >= 80 ? 'Aderência Alta' : aderencia >= 50 ? 'Aderência Média' : 'Aderência Baixa'}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className={`border-0 shadow-sm ${kpi.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{kpi.title}</p>
                    <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{kpi.subtitle}</p>
                  </div>
                  <div className={`w-10 h-10 ${kpi.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Barra de Aderência */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F8B137]" />
            Taxa de Aderência Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress
              value={aderencia}
              className={`h-3 flex-1 ${aderencia >= 80 ? '[&>div]:bg-emerald-500' : aderencia >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
            />
            <span className={`text-2xl font-bold min-w-[60px] text-right ${aderencia >= 80 ? 'text-emerald-600' : aderencia >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {aderencia}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {colaboradoresComFeedback.size} de {teamMembers.length} colaboradores possuem ao menos uma avaliação concluída
          </p>
        </CardContent>
      </Card>

      {/* Breakdown por tipo de avaliação */}
      {byType.length > 0 && !selectedFeedbackType || selectedFeedbackType === 'all' ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#F8B137]" />
              Breakdown por Tipo de Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byType.map((t) => {
                const pct = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
                return (
                  <div key={t.key} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-44 shrink-0">{t.label}</span>
                    <Progress
                      value={pct}
                      className={`h-2 flex-1 ${pct >= 80 ? '[&>div]:bg-emerald-500' : pct >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                    />
                    <span className="text-sm font-semibold text-slate-700 min-w-[80px] text-right">
                      {t.done}/{t.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Lista de colaboradores do time */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F8B137]" />
            Colaboradores do Time ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum colaborador neste time</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {teamMembers.map((colab) => {
                const colabFeedbacks = gestorFeedbacks.filter(f => f.employee_id === colab.id);
                const done = colabFeedbacks.filter(f => DONE_STATUSES.includes(f.workflow_status)).length;
                const temAvaliacao = colaboradoresComFeedback.has(colab.id);
                return (
                  <div key={colab.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {colab.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{colab.full_name}</p>
                        <p className="text-xs text-slate-400">{colab.position || colab.department || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{done} avaliação{done !== 1 ? 'ões' : ''}</span>
                      <Badge className={temAvaliacao ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {temAvaliacao ? 'Em dia' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}