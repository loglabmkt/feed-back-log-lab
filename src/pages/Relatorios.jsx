import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Filter, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import KPICards from "../components/reports/KPICards";
import ComplianceGauge from "../components/reports/ComplianceGauge";
import ValidationStatusChart from "../components/reports/ValidationStatusChart";
import MonthlyEvolutionChart from "../components/reports/MonthlyEvolutionChart";
import TypeDistributionChart from "../components/reports/TypeDistributionChart";
import ManagerAdherenceTable from "../components/reports/ManagerAdherenceTable";
import RiskRadar from "../components/reports/RiskRadar";

// Statuses que significam feedback finalizado/entregue
const TERMINAL_STATUSES = ['PUBLICADO', 'ASSINADO_COLABORADOR', 'CONVERSA_REALIZADA', 'APROVADO'];

const FEEDBACK_TYPE_LABELS = {
  feedback: 'Feedback',
  one_on_one: '1:1',
  evaluation: 'Avaliação Trimestral',
  experience_45d: 'Experiência 45 Dias',
  experience_90d: 'Qualidade Serviço 90 Dias',
};

export default function Relatorios() {
  const [gestores, setGestores] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [period, setPeriod] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gest, colabs, allFeedbacks, allTemplates] = await Promise.all([
        base44.entities.Gestor.list(),
        base44.entities.Colaborador.list(),
        base44.entities.FeedbackRecord.list('-created_date'),
        base44.entities.FeedbackTemplate.list()
      ]);
      setGestores(gest);
      setColaboradores(colabs);
      setFeedbacks(allFeedbacks);
      setTemplates(allTemplates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ---- Filtragem ----
  const activeColabs = colaboradores.filter(c => c.status === 'active' || !c.status);

  let filteredFeedbacks = feedbacks;
  let filteredCollabs = activeColabs;

  if (selectedType !== 'all') {
    filteredFeedbacks = filteredFeedbacks.filter(f => f.feedback_type === selectedType);
  }
  if (selectedTemplate !== 'all') {
    filteredFeedbacks = filteredFeedbacks.filter(f => f.template_id === selectedTemplate);
  }
  if (selectedManager !== 'all') {
    filteredFeedbacks = filteredFeedbacks.filter(f => f.manager_id === selectedManager);
    filteredCollabs = filteredCollabs.filter(c => c.manager_id === selectedManager);
  }
  if (startDate && endDate) {
    filteredFeedbacks = filteredFeedbacks.filter(f => {
      if (!f.feedback_date) return false;
      return f.feedback_date >= startDate && f.feedback_date <= endDate;
    });
  }

  // ---- Templates ativos com prazo ----
  const relevantTemplates = templates.filter(t => {
    if (!t.is_active || !t.deadline) return false;
    if (selectedType !== 'all' && t.feedback_type !== selectedType) return false;
    if (selectedTemplate !== 'all' && t.id !== selectedTemplate) return false;
    return true;
  });

  // ---- Cobertura por template ----
  // Para cada template com prazo: quantos colaboradores têm feedback concluído?
  const templateCoverage = relevantTemplates.map(template => {
    const templateFeedbacks = feedbacks.filter(f => f.template_id === template.id);
    const completedFeedbacks = templateFeedbacks.filter(f => TERMINAL_STATUSES.includes(f.workflow_status));
    const coveredEmployeeIds = new Set(completedFeedbacks.map(f => f.employee_id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(template.deadline + 'T00:00:00');
    const isOverdue = today > deadlineDate;
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    const covered = filteredCollabs.filter(c => coveredEmployeeIds.has(c.id)).length;
    const total = filteredCollabs.length;

    return { template, total, covered, missing: total - covered, isOverdue, daysUntil };
  });

  // ---- Índice Geral de Compliance ----
  let complianceRate = 0;
  if (templateCoverage.length > 0) {
    const totalExpected = templateCoverage.reduce((sum, t) => sum + t.total, 0);
    const totalCovered = templateCoverage.reduce((sum, t) => sum + t.covered, 0);
    complianceRate = totalExpected > 0 ? Math.round((totalCovered / totalExpected) * 100) : 0;
  } else {
    // Fallback: proporção de colaboradores com pelo menos 1 feedback concluído
    const coveredIds = new Set(
      filteredFeedbacks.filter(f => TERMINAL_STATUSES.includes(f.workflow_status)).map(f => f.employee_id)
    );
    complianceRate = filteredCollabs.length > 0
      ? Math.round((filteredCollabs.filter(c => coveredIds.has(c.id)).length / filteredCollabs.length) * 100)
      : 0;
  }

  // ---- Status de Validação (workflow_status real) ----
  const pieData = [
    {
      name: 'Aguardando Gestor',
      value: filteredFeedbacks.filter(f => f.workflow_status === 'DISPONIVEL_PARA_GESTOR').length,
      color: '#F59E0B'
    },
    {
      name: 'Em Revisão',
      value: filteredFeedbacks.filter(f => f.workflow_status === 'EM_REVISAO_ADMIN').length,
      color: '#3B82F6'
    },
    {
      name: 'Em Andamento',
      value: filteredFeedbacks.filter(f => ['APROVADO', 'CONVERSA_AGENDADA', 'CONVERSA_REALIZADA'].includes(f.workflow_status)).length,
      color: '#8B5CF6'
    },
    {
      name: 'Concluído',
      value: filteredFeedbacks.filter(f => ['PUBLICADO', 'ASSINADO_COLABORADOR'].includes(f.workflow_status)).length,
      color: '#10B981'
    },
  ].filter(item => item.value > 0);

  // ---- Radar de Risco: colaboradores sem feedback concluído para templates vencidos/próximos ----
  const seenAtRisk = new Map();

  if (relevantTemplates.length > 0) {
    filteredCollabs.forEach(colab => {
      relevantTemplates.forEach(template => {
        const tc = templateCoverage.find(t => t.template.id === template.id);
        if (!tc) return;
        // Só entra no radar se prazo venceu ou vence em até 7 dias
        if (!tc.isOverdue && tc.daysUntil > 7) return;
        const hasCompleted = feedbacks.some(
          f => f.template_id === template.id && f.employee_id === colab.id && TERMINAL_STATUSES.includes(f.workflow_status)
        );
        if (!hasCompleted) {
          const existing = seenAtRisk.get(colab.id);
          if (!existing || tc.daysUntil < existing.daysUntil) {
            seenAtRisk.set(colab.id, {
              ...colab,
              templateTitle: template.title,
              deadline: template.deadline,
              isOverdue: tc.isOverdue,
              daysUntil: tc.daysUntil,
              gestorName: gestores.find(g => g.id === colab.manager_id)?.full_name || '-',
            });
          }
        }
      });
    });
  } else {
    // Fallback: colaboradores sem nenhum feedback jamais
    filteredCollabs.forEach(colab => {
      const hasFeedback = feedbacks.some(f => f.employee_id === colab.id);
      if (!hasFeedback) {
        seenAtRisk.set(colab.id, {
          ...colab,
          templateTitle: 'Sem feedback cadastrado',
          deadline: null,
          isOverdue: true,
          daysUntil: -999,
          gestorName: gestores.find(g => g.id === colab.manager_id)?.full_name || '-',
        });
      }
    });
  }
  const usersAtRisk = Array.from(seenAtRisk.values()).sort((a, b) => a.daysUntil - b.daysUntil);

  // ---- KPIs ----
  const completedFeedbacks = filteredFeedbacks.filter(f => TERMINAL_STATUSES.includes(f.workflow_status)).length;
  const stats = {
    totalFeedbacks: filteredFeedbacks.length,
    completedFeedbacks,
    atRiskCount: usersAtRisk.length,
    complianceRate,
  };

  // ---- Aderência por gestor ----
  const managerAdherence = gestores.map(gestor => {
    const teamCollabs = filteredCollabs.filter(c => c.manager_id === gestor.id);
    if (teamCollabs.length === 0) return null;

    const gestorFeedbacks = filteredFeedbacks.filter(f => f.manager_id === gestor.id);
    const coveredIds = new Set(
      gestorFeedbacks.filter(f => TERMINAL_STATUSES.includes(f.workflow_status)).map(f => f.employee_id)
    );
    const covered = teamCollabs.filter(c => coveredIds.has(c.id)).length;
    const atRiskCount = usersAtRisk.filter(r => r.manager_id === gestor.id).length;
    const adherenceRate = teamCollabs.length > 0 ? Math.round((covered / teamCollabs.length) * 100) : 0;
    const status = adherenceRate >= 100 ? 'meta' : adherenceRate >= 70 ? 'adequado' : 'atraso';

    return {
      name: gestor.full_name?.split(' ')[0] || 'N/A',
      fullName: gestor.full_name,
      team: teamCollabs.length,
      feedbacks: gestorFeedbacks.length,
      covered,
      adherence: adherenceRate,
      atRisk: atRiskCount,
      status,
    };
  }).filter(Boolean).filter(m => m.team > 0);

  // ---- Evolução mensal ----
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
      month: format(monthStart, 'MMM/yy', { locale: ptBR }),
      total: monthFeedbacks.length,
      concluido: monthFeedbacks.filter(f => TERMINAL_STATUSES.includes(f.workflow_status)).length,
      pendente: monthFeedbacks.filter(f => f.workflow_status === 'DISPONIVEL_PARA_GESTOR').length,
    });
  }

  // ---- Distribuição por tipo ----
  const typeDistribution = [
    { name: 'Feedback', value: filteredFeedbacks.filter(f => f.feedback_type === 'feedback').length, color: '#3B82F6' },
    { name: '1:1', value: filteredFeedbacks.filter(f => f.feedback_type === 'one_on_one').length, color: '#8B5CF6' },
    { name: 'Avaliação', value: filteredFeedbacks.filter(f => f.feedback_type === 'evaluation').length, color: '#6366F1' },
    { name: '45 Dias', value: filteredFeedbacks.filter(f => f.feedback_type === 'experience_45d').length, color: '#F59E0B' },
    { name: '90 Dias', value: filteredFeedbacks.filter(f => f.feedback_type === 'experience_90d').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportComplianceReport', {
        start_date: startDate || null,
        end_date: endDate || null,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F8B137' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios & BI</h1>
          <p className="text-slate-500">Indicadores baseados em prazos, formulários e compliance real</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button
            onClick={handleExport}
            className="font-semibold gap-2"
            style={{ background: '#F8B137', color: '#14141E' }}
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="border-0 shadow-sm bg-amber-50/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Tipo de Ritual</Label>
                <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setSelectedTemplate('all'); }}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {Object.entries(FEEDBACK_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Formulário</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Formulários</SelectItem>
                    {templates
                      .filter(t => selectedType === 'all' || t.feedback_type === selectedType)
                      .map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
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
                    {gestores.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Data Início (feedback)</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Data Fim (feedback)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => {
                setStartDate(""); setEndDate("");
                setSelectedType("all"); setSelectedTemplate("all"); setSelectedManager("all");
              }}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seletor de período (para evolução mensal) */}
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
        <ComplianceGauge complianceRate={complianceRate} templateCoverage={templateCoverage} />
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