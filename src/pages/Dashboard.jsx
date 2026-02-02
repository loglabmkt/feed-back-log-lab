import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  UserCheck,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFeedbacks: 0,
    pendingValidations: 0,
    atRiskCount: 0,
    acceptedCount: 0,
    contestedCount: 0,
    complianceRate: 0
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [atRiskUsers, setAtRiskUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [users, feedbacks] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.FeedbackRecord.list('-created_date', 100)
      ]);

      const activeUsers = users.filter(u => u.status === 'active');
      const pendingFeedbacks = feedbacks.filter(f => f.validation_status === 'pending');
      const acceptedFeedbacks = feedbacks.filter(f => f.validation_status === 'accepted');
      const contestedFeedbacks = feedbacks.filter(f => f.validation_status === 'contested');
      
      // Calculate at-risk users (>90 days without feedback)
      const today = new Date();
      const usersAtRisk = activeUsers.filter(u => {
        if (!u.last_feedback_date) return true;
        const lastFeedback = new Date(u.last_feedback_date);
        return differenceInDays(today, lastFeedback) > 90;
      });

      // Calculate compliance rate
      const usersWithRecentFeedback = activeUsers.filter(u => {
        if (!u.last_feedback_date) return false;
        const lastFeedback = new Date(u.last_feedback_date);
        return differenceInDays(today, lastFeedback) <= 90;
      });
      const complianceRate = activeUsers.length > 0 
        ? Math.round((usersWithRecentFeedback.length / activeUsers.length) * 100)
        : 0;

      setStats({
        totalUsers: activeUsers.length,
        totalFeedbacks: feedbacks.length,
        pendingValidations: pendingFeedbacks.length,
        atRiskCount: usersAtRisk.length,
        acceptedCount: acceptedFeedbacks.length,
        contestedCount: contestedFeedbacks.length,
        complianceRate
      });

      setRecentFeedbacks(feedbacks.slice(0, 5));
      setAtRiskUsers(usersAtRisk.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
      contested: "bg-red-50 text-red-700 border-red-200",
      expired: "bg-slate-100 text-slate-600 border-slate-200"
    };
    const labels = {
      pending: "Pendente",
      accepted: "Aceito",
      contested: "Contestado",
      expired: "Expirado"
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl p-8 text-white gradient-accent shadow-lg card-glow">
        <h1 className="text-3xl font-bold mb-2" style={{color: '#ffffff'}}>
          Olá, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="max-w-2xl" style={{color: 'rgba(255, 255, 255, 0.9)'}}>
          {isAdmin 
            ? "Acompanhe a conformidade dos rituais de gestão de pessoas da sua organização."
            : "Acompanhe seus feedbacks e mantenha suas validações em dia."
          }
        </p>
      </div>

      {/* Stats Grid */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Colaboradores Ativos</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total de Feedbacks</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalFeedbacks}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Pendentes Validação</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingValidations}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Em Risco (&gt;90 dias)</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.atRiskCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Rate & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Taxa de Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-5xl font-bold text-slate-900">{stats.complianceRate}%</span>
                  <p className="text-sm text-slate-500 mt-1">dos colaboradores em dia</p>
                </div>
                <Progress value={stats.complianceRate} className="h-3" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <span className="font-semibold text-emerald-700">{stats.acceptedCount}</span>
                    <p className="text-emerald-600">Aceitos</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                    <span className="font-semibold text-amber-700">{stats.pendingValidations}</span>
                    <p className="text-amber-600">Pendentes</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                    <span className="font-semibold text-red-700">{stats.contestedCount}</span>
                    <p className="text-red-600">Contestados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Feedbacks */}
        <Card className={`border-0 shadow-sm ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Feedbacks Recentes
            </CardTitle>
            <Link to={createPageUrl("Feedbacks")}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>Nenhum feedback registrado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFeedbacks.map((feedback) => (
                  <div 
                    key={feedback.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{feedback.employee_name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(feedback.validation_status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At Risk Users (Admin only) */}
      {isAdmin && stats.atRiskCount > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Colaboradores em Risco de Compliance
            </CardTitle>
            <Link to={createPageUrl("Users")}>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskUsers.map((userAtRisk) => {
                const daysSinceLastFeedback = userAtRisk.last_feedback_date
                  ? differenceInDays(new Date(), new Date(userAtRisk.last_feedback_date))
                  : null;
                
                return (
                  <div 
                    key={userAtRisk.id}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{userAtRisk.full_name}</p>
                        <p className="text-sm text-slate-500">{userAtRisk.position || 'Sem cargo definido'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        {daysSinceLastFeedback !== null 
                          ? `${daysSinceLastFeedback} dias sem feedback`
                          : 'Nunca recebeu feedback'
                        }
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isAdmin && (
          <Link to={createPageUrl("Feedbacks")}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <MessageSquare className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Registrar Feedback</h3>
                  <p className="text-sm text-slate-500">Adicionar novo feedback ou 1:1</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        )}
        
        <Link to={isAdmin ? createPageUrl("Reports") : createPageUrl("Validation")}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                {isAdmin ? (
                  <TrendingUp className="w-7 h-7 text-emerald-600" />
                ) : (
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {isAdmin ? "Ver Relatórios" : "Validar Feedbacks"}
                </h3>
                <p className="text-sm text-slate-500">
                  {isAdmin ? "Acompanhe métricas e KPIs" : "Revisar feedbacks pendentes"}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}