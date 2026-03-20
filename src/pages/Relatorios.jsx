import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Filter } from "lucide-react";

import KPICards from "../components/reports/KPICards";
import ComplianceGauge from "../components/reports/ComplianceGauge";
import ValidationStatusChart from "../components/reports/ValidationStatusChart";
import MonthlyEvolutionChart from "../components/reports/MonthlyEvolutionChart";
import TypeDistributionChart from "../components/reports/TypeDistributionChart";
import ManagerAdherenceTable from "../components/reports/ManagerAdherenceTable";
import RiskRadar from "../components/reports/RiskRadar";

import {
  calcManagerAdherence,
  getDistributionByRitual,
  getMonthlyEvolution,
  calcRitualStatus,
} from "../lib/reportEngine";

const TIPO_LABELS = {
  feedback: "Feedback",
  one_on_one: "1:1",
  evaluation: "Avaliação Trimestral",
  experience_45d: "Experiência 45d",
  experience_90d: "Qualidade 90d"
};

const TIPO_COLORS = {
  feedback: "#F8B137",
  one_on_one: "#6366F1",
  evaluation: "#10B981",
  experience_45d: "#3B82F6",
  experience_90d: "#EC4899"
};

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  // Filters
  const [filterTemplate, setFilterTemplate] = useState("all");
  const [filterGestor, setFilterGestor] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [recs, tmpls, gests, colabs] = await Promise.all([
      base44.entities.FeedbackRecord.list(),
      base44.entities.FeedbackTemplate.list(),
      base44.entities.Gestor.list(),
      base44.entities.Colaborador.list()
    ]);
    setRecords(recs || []);
    setTemplates(tmpls || []);
    setGestores(gests || []);
    setColaboradores(colabs || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ---------- filtered records (para widgets que ainda usam filtro simples) ----------
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterTemplate !== "all" && r.template_id !== filterTemplate) return false;
      if (filterGestor !== "all" && r.manager_id !== filterGestor) return false;
      if (filterDateFrom) {
        const d = parseDate(r.feedback_date || r.created_date);
        if (!d || d < new Date(filterDateFrom)) return false;
      }
      if (filterDateTo) {
        const d = parseDate(r.feedback_date || r.created_date);
        if (!d || d > new Date(filterDateTo + "T23:59:59")) return false;
      }
      return true;
    });
  }, [records, filterTemplate, filterGestor, filterDateFrom, filterDateTo]);

  // ---------- colaboradores ativos (com filtro de gestor se selecionado) ----------
  const activeColabs = useMemo(() => {
    const active = colaboradores.filter(c => c.status === "active");
    if (filterGestor !== "all") return active.filter(c => c.manager_id === filterGestor);
    return active;
  }, [colaboradores, filterGestor]);

  // ---------- template coverage (deadline-based — mantido para ComplianceGauge) ----------
  const templateCoverage = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const DONE = ["PUBLICADO", "ASSINADO_COLABORADOR"];

    return templates.filter(t => t.is_active && t.deadline).map(t => {
      const deadline = parseDate(t.deadline);
      const isOverdue = deadline ? today > deadline : false;
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntil = deadline ? Math.round((deadline - today) / msPerDay) : null;

      const relevant = records.filter(r => r.template_id === t.id);
      const covered = relevant.filter(r => DONE.includes(r.workflow_status)).length;
      const total = colaboradores.filter(c => c.status === "active").length;
      const missing = Math.max(0, total - covered);

      return { template: t, total, covered, missing, isOverdue, daysUntil };
    });
  }, [templates, records, colaboradores]);

  // ---------- compliance rate (mantido para ComplianceGauge) ----------
  const complianceRate = useMemo(() => {
    const DONE = ["PUBLICADO", "ASSINADO_COLABORADOR"];
    const activeTemplatesWithDeadline = templates.filter(t => t.is_active && t.deadline);
    if (activeTemplatesWithDeadline.length === 0) return 0;

    const totalExpected = activeTemplatesWithDeadline.reduce((s) => {
      return s + colaboradores.filter(c => c.status === "active").length;
    }, 0);

    const totalDone = activeTemplatesWithDeadline.reduce((s, t) => {
      return s + records.filter(r => r.template_id === t.id && DONE.includes(r.workflow_status)).length;
    }, 0);

    if (totalExpected === 0) return 0;
    return Math.round((totalDone / totalExpected) * 100);
  }, [templates, records, colaboradores]);

  // ---------- KPI stats ----------
  const stats = useMemo(() => {
    const DONE = ["PUBLICADO", "ASSINADO_COLABORADOR"];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Contar prestadores com pelo menos 1 ritual ATRASADO (usando motor novo)
    const atRiskSet = new Set();
    activeColabs.forEach(colab => {
      ['experience_45d', 'experience_90d', 'evaluation', 'one_on_one', 'feedback'].forEach(type => {
        const r = calcRitualStatus(colab, type, records, today);
        if (r.status === 'ATRASADO' || r.status === 'EM_RISCO') atRiskSet.add(colab.id);
      });
    });

    return {
      complianceRate,
      totalFeedbacks: filtered.length,
      completedFeedbacks: filtered.filter(r => DONE.includes(r.workflow_status)).length,
      atRiskCount: atRiskSet.size
    };
  }, [complianceRate, filtered, activeColabs, records]);

  // ---------- validation status chart ----------
  const validationStatusData = useMemo(() => {
    const counts = {
      "Aguardando Gestor": 0,
      "Em Revisão Admin": 0,
      "Em Andamento": 0,
      "Concluído": 0
    };
    filtered.forEach(r => {
      if (r.workflow_status === "DISPONIVEL_PARA_GESTOR") counts["Aguardando Gestor"]++;
      else if (r.workflow_status === "EM_REVISAO_ADMIN") counts["Em Revisão Admin"]++;
      else if (["APROVADO", "CONVERSA_AGENDADA", "CONVERSA_REALIZADA"].includes(r.workflow_status)) counts["Em Andamento"]++;
      else if (["PUBLICADO", "ASSINADO_COLABORADOR"].includes(r.workflow_status)) counts["Concluído"]++;
    });
    const colors = ["#94A3B8", "#F59E0B", "#6366F1", "#10B981"];
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: colors[i] }));
  }, [filtered]);

  // ---------- monthly evolution — usando motor novo ----------
  const monthlyData = useMemo(() => {
    return getMonthlyEvolution(
      colaboradores.filter(c => c.status === 'active'),
      records,
      {
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        managerId: filterGestor !== 'all' ? filterGestor : undefined,
      }
    );
  }, [colaboradores, records, filterDateFrom, filterDateTo, filterGestor]);

  // ---------- type distribution — usando motor novo ----------
  const typeDistribution = useMemo(() => {
    const distrib = getDistributionByRitual(
      colaboradores,
      records,
      {
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        managerId: filterGestor !== 'all' ? filterGestor : undefined,
      }
    );

    // Se há filtro de template, filtrar apenas o tipo correspondente ao template
    let filteredDistrib = distrib;
    if (filterTemplate !== 'all') {
      const tmpl = templates.find(t => t.id === filterTemplate);
      if (tmpl) {
        filteredDistrib = Object.fromEntries(
          Object.entries(distrib).filter(([k]) => k === tmpl.feedback_type)
        );
      }
    }

    return Object.entries(filteredDistrib).map(([type, data]) => ({
      name: TIPO_LABELS[type] || type,
      type,
      color: TIPO_COLORS[type] || "#94A3B8",
      // Para o gráfico de distribuição: usar total de concluídos como valor principal
      value: data.onTime + data.late,
      onTime: data.onTime,
      late: data.late,
      delayed: data.delayed,
      pending: data.pendingOrRisk,
      total: data.total,
    }));
  }, [colaboradores, records, filterDateFrom, filterDateTo, filterGestor, filterTemplate, templates]);

  // ---------- manager adherence — usando motor novo ----------
  const managerAdherence = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const activeGestores = gestores.filter(g => g.status === 'active');

    // Se filtro de gestor específico, apenas esse
    const targetGestores = filterGestor !== 'all'
      ? activeGestores.filter(g => g.id === filterGestor)
      : activeGestores;

    // Tipos de ritual a considerar (filtrar por template se selecionado)
    let ritualTypes = ['experience_45d', 'experience_90d', 'evaluation', 'one_on_one', 'feedback'];
    if (filterTemplate !== 'all') {
      const tmpl = templates.find(t => t.id === filterTemplate);
      if (tmpl) ritualTypes = [tmpl.feedback_type];
    }

    return targetGestores.map(gestor => {
      const team = colaboradores.filter(c => c.manager_id === gestor.id && c.status === 'active');
      if (team.length === 0) return null;
      return calcManagerAdherence(gestor, team, records, ritualTypes, today);
    }).filter(Boolean);
  }, [gestores, colaboradores, records, filterGestor, filterTemplate, templates]);

  // ---------- risk radar (mantido com lógica de templates-deadline) ----------
  const usersAtRisk = useMemo(() => {
    const DONE = ["PUBLICADO", "ASSINADO_COLABORADOR"];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const RISK_DAYS = 7;
    const msPerDay = 24 * 60 * 60 * 1000;
    const result = [];

    templates.filter(t => t.is_active && t.deadline).forEach(t => {
      const deadline = parseDate(t.deadline);
      if (!deadline) return;
      const daysUntil = Math.round((deadline - today) / msPerDay);
      if (daysUntil > RISK_DAYS) return;

      const doneColabs = new Set(
        records.filter(r => r.template_id === t.id && DONE.includes(r.workflow_status)).map(r => r.employee_id)
      );

      let targetColabs = colaboradores.filter(c => c.status === "active" && !doneColabs.has(c.id));
      if (filterGestor !== "all") {
        targetColabs = targetColabs.filter(c => c.manager_id === filterGestor);
      }

      targetColabs.forEach(c => {
        const gestor = gestores.find(g => g.id === c.manager_id);
        result.push({
          ...c,
          templateTitle: t.title,
          deadline: t.deadline,
          daysUntil,
          isOverdue: daysUntil < 0,
          gestorName: gestor ? gestor.full_name : "—"
        });
      });
    });

    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [templates, records, colaboradores, gestores, filterGestor]);

  const resetFilters = () => {
    setFilterTemplate("all");
    setFilterGestor("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const activeTemplates = templates.filter(t => t.is_active);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-1">
            <Filter className="w-4 h-4" />
            Filtros
          </div>
          <Select value={filterTemplate} onValueChange={setFilterTemplate}>
            <SelectTrigger className="w-52 h-9 text-sm">
              <SelectValue placeholder="Formulário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os formulários</SelectItem>
              {activeTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGestor} onValueChange={setFilterGestor}>
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue placeholder="Gestor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gestores</SelectItem>
              {gestores.filter(g => g.status === "active").map(g => (
                <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="h-9 text-sm w-36"
            />
            <span className="text-slate-400 text-sm">até</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="h-9 text-sm w-36"
            />
          </div>

          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-slate-500 hover:text-slate-700">
            <RefreshCw className="w-4 h-4 mr-1" />
            Limpar
          </Button>

          <Button variant="outline" size="sm" onClick={loadData} className="h-9 ml-auto">
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <KPICards stats={stats} loading={loading} />

      {/* Gauge + Status chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ComplianceGauge complianceRate={complianceRate} templateCoverage={templateCoverage} />
        <div className="lg:col-span-2">
          <ValidationStatusChart data={validationStatusData} loading={loading} />
        </div>
      </div>

      {/* Type distribution */}
      <TypeDistributionChart typeDistribution={typeDistribution} loading={loading} />

      {/* Monthly Evolution */}
      <MonthlyEvolutionChart data={monthlyData} loading={loading} />

      {/* Manager Adherence */}
      <ManagerAdherenceTable managerAdherence={managerAdherence} loading={loading} />

      {/* Risk Radar */}
      <RiskRadar usersAtRisk={usersAtRisk} loading={loading} />
    </div>
  );
}