import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Search, 
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MyTeam() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [stats, setStats] = useState({
    totalTeam: 0,
    atRisk: 0,
    compliant: 0,
    pendingFeedbacks: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Buscar membros da equipe
      const allUsers = await base44.entities.User.list();
      const myTeam = allUsers.filter(u => u.manager_id === user.id && u.status === 'active');

      // Buscar feedbacks da equipe
      const allFeedbacks = await base44.entities.FeedbackRecord.filter({
        manager_id: user.id
      }, '-created_date');

      setTeamMembers(myTeam);
      setFeedbacks(allFeedbacks);

      // Calcular estatísticas
      const today = new Date();
      const atRiskMembers = myTeam.filter(member => {
        if (!member.last_feedback_date) return true;
        const lastFeedback = new Date(member.last_feedback_date);
        return differenceInDays(today, lastFeedback) > 90;
      });

      const compliantMembers = myTeam.filter(member => {
        if (!member.last_feedback_date) return false;
        const lastFeedback = new Date(member.last_feedback_date);
        return differenceInDays(today, lastFeedback) <= 90;
      });

      const pendingFeedbacks = allFeedbacks.filter(f => f.validation_status === 'pending');

      setStats({
        totalTeam: myTeam.length,
        atRisk: atRiskMembers.length,
        compliant: compliantMembers.length,
        pendingFeedbacks: pendingFeedbacks.length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = (member) => {
    if (!member.last_feedback_date) {
      return { 
        status: 'critical', 
        label: 'Sem Feedback', 
        days: null,
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    const today = new Date();
    const lastFeedback = new Date(member.last_feedback_date);
    const daysSince = differenceInDays(today, lastFeedback);

    if (daysSince > 90) {
      return { 
        status: 'critical', 
        label: 'Em Risco', 
        days: daysSince,
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else if (daysSince > 60) {
      return { 
        status: 'warning', 
        label: 'Atenção', 
        days: daysSince,
        color: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      };
    } else {
      return { 
        status: 'compliant', 
        label: 'Em Dia', 
        days: daysSince,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
      };
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLastFeedbackCount = (memberId) => {
    return feedbacks.filter(f => f.employee_id === memberId).length;
  };

  const filteredTeam = teamMembers.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRisk === "all") return matchesSearch;
    
    const compliance = getComplianceStatus(member);
    return matchesSearch && compliance.status === filterRisk;
  });

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
          <h1 className="text-2xl font-bold text-slate-900">Minha Equipe</h1>
          <p className="text-slate-500">Gerencie os feedbacks e compliance dos seus liderados</p>
        </div>
        <Link to={createPageUrl("Feedbacks")}>
          <Button className="font-semibold shadow-md" style={{background: '#F8B137', color: '#14141E'}}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Feedback
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total da Equipe</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalTeam}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Em Compliance</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.compliant}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Em Risco (&gt;90d)</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.atRisk}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Pendentes Validação</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingFeedbacks}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Rate */}
      {stats.totalTeam > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Taxa de Compliance da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-slate-900">
                  {Math.round((stats.compliant / stats.totalTeam) * 100)}%
                </span>
                <span className="text-sm text-slate-500">
                  {stats.compliant} de {stats.totalTeam} colaboradores em dia
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    background: '#F8B137',
                    width: `${(stats.compliant / stats.totalTeam) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="compliant">Em Dia</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="critical">Em Risco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      <div className="space-y-4">
        {filteredTeam.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {teamMembers.length === 0 
                  ? "Nenhum colaborador vinculado à sua gestão"
                  : "Nenhum colaborador encontrado com os filtros aplicados"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTeam.map((member) => {
            const compliance = getComplianceStatus(member);
            const feedbackCount = getLastFeedbackCount(member.id);
            
            return (
              <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="text-white text-lg font-semibold" style={{background: '#F8B137'}}>
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{member.full_name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
                          {member.position && (
                            <>
                              <span>{member.position}</span>
                              <span className="text-slate-300">•</span>
                            </>
                          )}
                          {member.department && (
                            <>
                              <span>{member.department}</span>
                              <span className="text-slate-300">•</span>
                            </>
                          )}
                          <span>{feedbackCount} feedback{feedbackCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <Badge variant="outline" className={`${compliance.bgColor} ${compliance.textColor} ${compliance.borderColor}`}>
                          {compliance.label}
                        </Badge>
                        {member.last_feedback_date && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Último feedback: {format(new Date(member.last_feedback_date), "dd/MM/yyyy")}
                            </span>
                          </div>
                        )}
                        {compliance.days !== null && (
                          <span className="text-xs text-slate-500">
                            {compliance.days} dias atrás
                          </span>
                        )}
                      </div>

                      <Link to={createPageUrl("Feedbacks")}>
                        <Button 
                          size="sm" 
                          className={`font-semibold ${compliance.status === 'critical' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                          style={compliance.status !== 'critical' ? {background: '#F8B137', color: '#14141E'} : {}}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Novo Feedback
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {compliance.status === 'critical' && (
                    <div className="mt-4 pt-4 border-t border-red-100">
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700">
                            Atenção: Colaborador em Risco de Non-Compliance
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {compliance.days !== null 
                              ? `Há ${compliance.days} dias sem feedback. Registre um feedback o quanto antes.`
                              : 'Nunca recebeu feedback. É obrigatório registrar um feedback.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}