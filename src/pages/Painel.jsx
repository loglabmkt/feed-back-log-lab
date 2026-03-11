import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function Painel() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    disponiveisGestor: 0,
    emRevisao: 0,
    aguardandoColaborador: 0,
    assinados: 0,
    totalUsuarios: 0
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Verificar autenticação ANTES de qualquer coisa
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      base44.auth.redirectToLogin('/painel');
      return;
    }

    try {
      const currentUser = await base44.auth.me();
      
      if (!currentUser) {
        base44.auth.redirectToLogin('/painel');
        return;
      }
      
      setUser(currentUser);

      const isAdmin = currentUser.role === 'admin';

      const feedbacks = await base44.entities.FeedbackRecord.list('-created_date', 50);

      // Admins veem todos os feedbacks; outros filtram pelos seus próprios
      const myFeedbacks = isAdmin 
        ? feedbacks 
        : feedbacks.filter(f => f.manager_id === currentUser.id);

      setStats({
        totalFeedbacks: myFeedbacks.length,
        disponiveisGestor: myFeedbacks.filter(f => f.workflow_status === 'DISPONIVEL_PARA_GESTOR').length,
        emRevisao: myFeedbacks.filter(f => f.workflow_status === 'EM_REVISAO_ADMIN').length,
        aguardandoColaborador: myFeedbacks.filter(f => f.workflow_status === 'PUBLICADO').length,
        assinados: myFeedbacks.filter(f => f.workflow_status === 'ASSINADO_COLABORADOR').length,
        totalUsuarios: 0
      });

      setRecentFeedbacks(myFeedbacks.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      DISPONIVEL_PARA_GESTOR: { label: "Disponível", color: "bg-blue-50 text-blue-700", icon: Clock },
      EM_REVISAO_ADMIN: { label: "Em Revisão", color: "bg-amber-50 text-amber-700", icon: Shield },
      CONCLUIDO_PARA_ENVIO: { label: "Aprovado", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
      PUBLICADO: { label: "Publicado", color: "bg-purple-50 text-purple-700", icon: Send },
      ASSINADO_COLABORADOR: { label: "Assinado", color: "bg-slate-100 text-slate-700", icon: CheckCircle }
    };
    const info = statusMap[status] || statusMap.DISPONIVEL_PARA_GESTOR;
    const Icon = info.icon;
    return (
      <Badge variant="outline" className={info.color}>
        <Icon className="w-3 h-3 mr-1" />
        {info.label}
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

  const isAdmin = user?.role === 'admin';
  const completionRate = stats.totalFeedbacks > 0 
    ? Math.round((stats.assinados / stats.totalFeedbacks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Bem-vindo, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-600 mt-1">
          {isAdmin 
            ? "Visão geral do sistema de compliance de feedbacks"
            : "Acompanhe seus feedbacks e rituais"
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Feedbacks</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalFeedbacks}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Disponíveis</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.disponiveisGestor}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Em Revisão</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.emRevisao}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Assinados</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.assinados}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{color: '#F8B137'}} />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Feedbacks Concluídos</span>
                <span className="text-2xl font-bold text-slate-900">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Aguardando Colaborador</p>
                <p className="text-lg font-semibold text-purple-600">{stats.aguardandoColaborador}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Assinados</p>
                <p className="text-lg font-semibold text-emerald-600">{stats.assinados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin && (
              <Link to={createPageUrl("CriarFeedback")}>
                <Button className="w-full justify-start" style={{background: '#F8B137', color: '#14141E'}}>
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Criar Novo Feedback
                </Button>
              </Link>
            )}
            
            <Link to={createPageUrl("Feedbacks")}>
              <Button variant="outline" className="w-full justify-start">
                <LayoutDashboard className="w-4 h-4 mr-3" />
                Ver Todos os Feedbacks
              </Button>
            </Link>

            {isAdmin && (
              <>
                <Link to={createPageUrl("Empresas")}>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-3" />
                    Gerenciar Empresas
                  </Button>
                </Link>

                <Link to={createPageUrl("Colaboradores")}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-3" />
                    Gerenciar Colaboradores
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feedbacks Recentes</CardTitle>
            <Link to={createPageUrl("Feedbacks")}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentFeedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum feedback registrado ainda</p>
              {isAdmin && (
                <Link to={createPageUrl("CriarFeedback")}>
                  <Button className="mt-4" style={{background: '#F8B137', color: '#14141E'}}>
                    Criar Primeiro Feedback
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentFeedbacks.map((feedback) => (
                <div key={feedback.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                        {getInitials(feedback.employee_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{feedback.employee_name}</p>
                      <p className="text-xs text-slate-500">Gestor: {feedback.manager_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(feedback.workflow_status)}
                    <Link to={createPageUrl("RevisarFeedback") + `?id=${feedback.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}