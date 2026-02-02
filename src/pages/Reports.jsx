import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  PieChart as PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function ReportsPage() {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("3");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, allFeedbacks] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.FeedbackRecord.list('-created_date')
      ]);

      setUsers(allUsers);
      setFeedbacks(allFeedbacks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeUsers = users.filter(u => u.status === 'active');
  const managers = users.filter(u => u.role === 'admin');

  // Calculate users at risk (>90 days without feedback)
  const usersAtRisk = activeUsers.filter(u => {
    if (!u.last_feedback_date) return true;
    const daysSince = differenceInDays(new Date(), new Date(u.last_feedback_date));
    return daysSince > 90;
  });

  const complianceRate = activeUsers.length > 0 
    ? Math.round(((activeUsers.length - usersAtRisk.length) / activeUsers.length) * 100)
    : 0;

  // Validation status distribution
  const statusCounts = {
    accepted: feedbacks.filter(f => f.validation_status === 'accepted').length,
    pending: feedbacks.filter(f => f.validation_status === 'pending').length,
    contested: feedbacks.filter(f => f.validation_status === 'contested').length,
    expired: feedbacks.filter(f => f.validation_status === 'expired').length
  };

  const pieData = [
    { name: 'Aceitos', value: statusCounts.accepted, color: '#10B981' },
    { name: 'Pendentes', value: statusCounts.pending, color: '#F59E0B' },
    { name: 'Contestados', value: statusCounts.contested, color: '#EF4444' },
    { name: 'Expirados', value: statusCounts.expired, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // Manager adherence matrix
  const managerAdherence = managers.map(manager => {
    const teamMembers = activeUsers.filter(u => u.manager_id === manager.id);
    const teamFeedbacks = feedbacks.filter(f => f.manager_id === manager.id);
    const teamWithFeedback = teamMembers.filter(member => {
      if (!member.last_feedback_date) return false;
      const daysSince = differenceInDays(new Date(), new Date(member.last_feedback_date));
      return daysSince <= 90;
    });

    const adherenceRate = teamMembers.length > 0
      ? Math.round((teamWithFeedback.length / teamMembers.length) * 100)
      : 0;

    return {
      name: manager.full_name?.split(' ')[0] || 'N/A',
      fullName: manager.full_name,
      team: teamMembers.length,
      feedbacks: teamFeedbacks.length,
      adherence: adherenceRate,
      atRisk: teamMembers.length - teamWithFeedback.length
    };
  }).filter(m => m.team > 0);

  // Feedbacks by month
  const periodMonths = parseInt(period);
  const monthlyData = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    const monthFeedbacks = feedbacks.filter(f => {
      const date = new Date(f.created_date);
      return date >= monthStart && date <= monthEnd;
    });
    
    monthlyData.push({
      month: format(monthStart, 'MMM', { locale: ptBR }),
      total: monthFeedbacks.length,
      accepted: monthFeedbacks.filter(f => f.validation_status === 'accepted').length,
      contested: monthFeedbacks.filter(f => f.validation_status === 'contested').length
    });
  }

  // Feedback type distribution
  const typeDistribution = [
    { name: 'Feedback', value: feedbacks.filter(f => f.feedback_type === 'feedback').length, color: '#3B82F6' },
    { name: '1:1', value: feedbacks.filter(f => f.feedback_type === 'one_on_one').length, color: '#8B5CF6' },
    { name: 'Avaliação', value: feedbacks.filter(f => f.feedback_type === 'evaluation').length, color: '#6366F1' }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios & BI</h1>
          <p className="text-slate-500">Métricas e indicadores de compliance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Taxa de Compliance</p>
                <p className="text-4xl font-bold text-blue-900 mt-1">{complianceRate}%</p>
                <p className="text-xs text-blue-600 mt-1">colaboradores em dia</p>
              </div>
              <div className="w-14 h-14 bg-blue-200/50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">Total de Feedbacks</p>
                <p className="text-4xl font-bold text-emerald-900 mt-1">{feedbacks.length}</p>
                <p className="text-xs text-emerald-600 mt-1">registrados no sistema</p>
              </div>
              <div className="w-14 h-14 bg-emerald-200/50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Aguardando Validação</p>
                <p className="text-4xl font-bold text-amber-900 mt-1">{statusCounts.pending}</p>
                <p className="text-xs text-amber-600 mt-1">feedbacks pendentes</p>
              </div>
              <div className="w-14 h-14 bg-amber-200/50 rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Radar de Risco</p>
                <p className="text-4xl font-bold text-red-900 mt-1">{usersAtRisk.length}</p>
                <p className="text-xs text-red-600 mt-1">&gt;90 dias sem feedback</p>
              </div>
              <div className="w-14 h-14 bg-red-200/50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validation Status Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              Status de Validação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Quantidade']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Evolution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name="Aceitos" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contested" name="Contestados" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Adherence Matrix */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Matriz de Aderência por Gestor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {managerAdherence.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 font-medium text-slate-600">Gestor</th>
                    <th className="text-center p-4 font-medium text-slate-600">Equipe</th>
                    <th className="text-center p-4 font-medium text-slate-600">Feedbacks</th>
                    <th className="text-center p-4 font-medium text-slate-600">Em Risco</th>
                    <th className="text-left p-4 font-medium text-slate-600">Taxa de Aderência</th>
                  </tr>
                </thead>
                <tbody>
                  {managerAdherence.map((manager, index) => (
                    <tr key={index} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{manager.fullName}</td>
                      <td className="p-4 text-center text-slate-600">{manager.team}</td>
                      <td className="p-4 text-center text-slate-600">{manager.feedbacks}</td>
                      <td className="p-4 text-center">
                        {manager.atRisk > 0 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {manager.atRisk}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            0
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={manager.adherence} 
                            className={`h-2 flex-1 ${
                              manager.adherence >= 80 ? '[&>div]:bg-emerald-500' :
                              manager.adherence >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                            }`}
                          />
                          <span className={`text-sm font-semibold ${
                            manager.adherence >= 80 ? 'text-emerald-600' :
                            manager.adherence >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {manager.adherence}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Nenhum gestor com equipe atribuída</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users at Risk */}
      {usersAtRisk.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Colaboradores em Risco de Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 font-medium text-slate-600">Colaborador</th>
                    <th className="text-left p-4 font-medium text-slate-600">Cargo</th>
                    <th className="text-left p-4 font-medium text-slate-600">Departamento</th>
                    <th className="text-left p-4 font-medium text-slate-600">Último Feedback</th>
                    <th className="text-left p-4 font-medium text-slate-600">Dias sem Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {usersAtRisk.slice(0, 10).map((user) => {
                    const daysSince = user.last_feedback_date
                      ? differenceInDays(new Date(), new Date(user.last_feedback_date))
                      : null;
                    
                    return (
                      <tr key={user.id} className="border-b border-slate-50 hover:bg-red-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{user.position || '-'}</td>
                        <td className="p-4 text-slate-600">{user.department || '-'}</td>
                        <td className="p-4 text-slate-600">
                          {user.last_feedback_date 
                            ? format(new Date(user.last_feedback_date), "dd/MM/yyyy")
                            : 'Nunca'
                          }
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {daysSince !== null ? `${daysSince} dias` : 'N/A'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {usersAtRisk.length > 10 && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Mostrando 10 de {usersAtRisk.length} colaboradores em risco
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
            Distribuição por Tipo de Ritual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typeDistribution.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {typeDistribution.map((type, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: `${type.color}10` }}
                >
                  <p className="text-sm font-medium" style={{ color: type.color }}>{type.name}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{type.value}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {feedbacks.length > 0 ? Math.round((type.value / feedbacks.length) * 100) : 0}% do total
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}