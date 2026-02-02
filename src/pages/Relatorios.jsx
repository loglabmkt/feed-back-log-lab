import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Download,
  Filter,
  Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import KPICards from "../components/reports/KPICards";
import ComplianceGauge from "../components/reports/ComplianceGauge";
import ValidationStatusChart from "../components/reports/ValidationStatusChart";
import MonthlyEvolutionChart from "../components/reports/MonthlyEvolutionChart";
import TypeDistributionChart from "../components/reports/TypeDistributionChart";
import ManagerAdherenceTable from "../components/reports/ManagerAdherenceTable";
import RiskRadar from "../components/reports/RiskRadar";

export default function Relatorios() {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [period, setPeriod] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

  let filteredFeedbacks = feedbacks;
  let filteredUsers = activeUsers;

  if (startDate && endDate) {
    filteredFeedbacks = feedbacks.filter(f => {
      if (!f.feedback_date) return false;
      const feedbackDate = new Date(f.feedback_date);
      return feedbackDate >= new Date(startDate) && feedbackDate <= new Date(endDate);
    });
  }

  if (selectedDepartment !== 'all') {
    const deptUserIds = users.filter(u => u.department === selectedDepartment).map(u => u.id);
    filteredFeedbacks = filteredFeedbacks.filter(f => deptUserIds.includes(f.employee_id));
    filteredUsers = filteredUsers.filter(u => u.department === selectedDepartment);
  }

  if (selectedManager !== 'all') {
    filteredFeedbacks = filteredFeedbacks.filter(f => f.manager_id === selectedManager);
    filteredUsers = filteredUsers.filter(u => u.manager_id === selectedManager);
  }

  const usersAtRisk = filteredUsers.filter(u => {
    if (!u.last_feedback_date) return true;
    const daysSince = differenceInDays(new Date(), new Date(u.last_feedback_date));
    return daysSince > 90;
  });

  const complianceRate = filteredUsers.length > 0 
    ? Math.round(((filteredUsers.length - usersAtRisk.length) / filteredUsers.length) * 100)
    : 0;

  const statusCounts = {
    accepted: filteredFeedbacks.filter(f => f.validation_status === 'accepted').length,
    pending: filteredFeedbacks.filter(f => f.validation_status === 'pending').length,
    contested: filteredFeedbacks.filter(f => f.validation_status === 'contested').length,
    expired: filteredFeedbacks.filter(f => f.validation_status === 'expired').length
  };

  const pieData = [
    { name: 'Aceitos', value: statusCounts.accepted, color: '#10B981' },
    { name: 'Pendentes', value: statusCounts.pending, color: '#F59E0B' },
    { name: 'Contestados', value: statusCounts.contested, color: '#EF4444' },
    { name: 'Expirados', value: statusCounts.expired, color: '#6B7280' }
  ].filter(item => item.value > 0);

  const stats = {
    totalFeedbacks: filteredFeedbacks.length,
    pendingValidations: statusCounts.pending,
    atRiskCount: usersAtRisk.length,
    complianceRate
  };

  const managerAdherence = managers.map(manager => {
    const teamMembers = filteredUsers.filter(u => u.manager_id === manager.id);
    const teamFeedbacks = filteredFeedbacks.filter(f => f.manager_id === manager.id);
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

  const periodMonths = parseInt(period);
  const monthlyData = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    const monthFeedbacks = filteredFeedbacks.filter(f => {
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

  const typeDistribution = [
    { name: 'Feedback', value: filteredFeedbacks.filter(f => f.feedback_type === 'feedback').length, color: '#3B82F6' },
    { name: '1:1', value: filteredFeedbacks.filter(f => f.feedback_type === 'one_on_one').length, color: '#8B5CF6' },
    { name: 'Avaliação', value: filteredFeedbacks.filter(f => f.feedback_type === 'evaluation').length, color: '#6366F1' }
  ].filter(item => item.value > 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportComplianceReport', {
        start_date: startDate || null,
        end_date: endDate || null,
        department: selectedDepartment !== 'all' ? selectedDepartment : null,
        manager_id: selectedManager !== 'all' ? selectedManager : null
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios & BI</h1>
          <p className="text-slate-500">Métricas e indicadores de compliance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button 
            onClick={handleExport}
            className="btn-primary shadow-md font-semibold gap-2"
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-0 shadow-sm bg-blue-50/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Departamento</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Departamentos</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Gestor</Label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Gestores</SelectItem>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSelectedDepartment("all");
                  setSelectedManager("all");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-52">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <KPICards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ComplianceGauge complianceRate={complianceRate} />
        <ValidationStatusChart data={pieData} loading={loading} />
        <MonthlyEvolutionChart data={monthlyData} loading={loading} />
      </div>

      <ManagerAdherenceTable managerAdherence={managerAdherence} loading={loading} />

      <RiskRadar usersAtRisk={usersAtRisk} loading={loading} />

      <TypeDistributionChart 
        typeDistribution={typeDistribution} 
        totalFeedbacks={filteredFeedbacks.length}
        loading={loading} 
      />
    </div>
  );
}