import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, BarChart3, MessageSquare, CalendarClock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GestorLayout from "@/components/GestorLayout";
import { createPageUrl } from "@/utils";

export default function GestorFeedbacks() {
  const [gestor, setGestor] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    feedback_date: new Date().toISOString().split('T')[0],
    strengths: '',
    improvements: '',
    action_plan: '',
    additional_notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem('gestor_session');
    if (!session) {
      window.location.href = '/gestorlogin';
      return;
    }
    setGestor(JSON.parse(session));
  };

  const loadData = async () => {
    try {
      const session = localStorage.getItem('gestor_session');
      if (!session) return;

      const gestorData = JSON.parse(session);

      const allTemplates = await base44.entities.FeedbackTemplate.filter({ is_active: true });
      setTemplates(allTemplates);

      const allColaboradores = await base44.entities.Colaborador.filter({
        manager_id: gestorData.id,
        status: 'active'
      });
      setColaboradores(allColaboradores);

      const feedbacks = await base44.entities.FeedbackRecord.filter({
        manager_id: gestorData.id
      }, '-created_date');
      setMyFeedbacks(feedbacks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeedback = (template) => {
    setSelectedTemplate(template);
    setFormData({
      employee_id: '',
      feedback_date: new Date().toISOString().split('T')[0],
      strengths: '',
      improvements: '',
      action_plan: '',
      additional_notes: ''
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.employee_id) {
      alert('Por favor, selecione um colaborador');
      return;
    }

    setSaving(true);
    try {
      const colaborador = colaboradores.find(c => c.id === formData.employee_id);
      
      if (colaborador.manager_id !== gestor.id) {
        await base44.entities.Colaborador.update(colaborador.id, { manager_id: gestor.id });
      }
      
      await base44.entities.FeedbackRecord.create({
        template_id: selectedTemplate.id,
        template_title: selectedTemplate.title,
        manager_id: gestor.id,
        manager_name: gestor.full_name,
        employee_id: colaborador.id,
        employee_name: colaborador.full_name,
        employee_email: colaborador.email,
        feedback_date: formData.feedback_date,
        feedback_type: selectedTemplate.feedback_type,
        strengths: formData.strengths,
        improvements: formData.improvements,
        action_plan: formData.action_plan,
        additional_notes: formData.additional_notes,
        workflow_status: 'EM_REVISAO_ADMIN',
        checklist_questions: selectedTemplate.checklist_questions || []
      });

      setShowDialog(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao criar feedback');
    } finally {
      setSaving(false);
    }
  };

  // Helper: retorna info de prazo com cor dinâmica
  const getDeadlineInfo = (deadline) => {
    if (!deadline) return null;
    const [year, month, day] = deadline.split('-');
    const formatted = `${day}/${month}/${year}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-600', Icon: AlertTriangle, label: `Prazo encerrado em ${formatted}` };
    if (diffDays <= 7) return { color: 'text-red-500', Icon: AlertTriangle, label: `Prazo: ${formatted} (${diffDays}d restantes)` };
    if (diffDays <= 15) return { color: 'text-orange-500', Icon: CalendarClock, label: `Prazo: ${formatted} (${diffDays}d restantes)` };
    return { color: 'text-amber-600', Icon: CalendarClock, label: `Prazo: ${formatted}` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8B137]" />
      </div>
    );
  }

  return (
    <GestorLayout currentPage="feedbacks" gestor={gestor}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Meus Feedbacks</h1>
        <p className="text-slate-500">Crie e gerencie feedbacks para sua equipe</p>
      </div>

      {/* Templates Ativos */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Templates Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <p className="text-sm text-slate-400 col-span-3 py-4">Nenhum template ativo disponível.</p>
          ) : templates.map((template) => {
            const isAvaliacao = template.feedback_type === 'evaluation';
            const isExp45 = template.feedback_type === 'experience_45d';
            const isExp90 = template.feedback_type === 'experience_90d';
            const is11 = template.feedback_type === 'one_on_one';
            const isSpecial = isAvaliacao || isExp45 || isExp90 || is11;
            const deadlineInfo = getDeadlineInfo(template.deadline);

            return (
              <Card
                key={template.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
                style={isSpecial ? { borderLeft: '4px solid #F8B137' } : {}}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-base block">{template.title}</span>
                      {deadlineInfo && (
                        <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${deadlineInfo.color}`}>
                          <deadlineInfo.Icon className="w-3 h-3 flex-shrink-0" />
                          {deadlineInfo.label}
                        </p>
                      )}
                    </div>
                    <Badge
                      className="flex-shrink-0"
                      style={isSpecial ? { background: '#14141E', color: '#F8B137' } : { background: '#F8B137', color: '#14141E' }}
                    >
                      {template.feedback_type === 'feedback' ? 'Feedback' :
                       template.feedback_type === 'one_on_one' ? 'One-on-One' :
                       template.feedback_type === 'experience_45d' ? '45 Dias' :
                       template.feedback_type === 'experience_90d' ? '90 Dias' :
                       'Avaliação'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isExp90 ? (
                    <>
                      <p className="text-sm text-slate-500 mb-1">13 itens · Escala 4/3/2/1/NO · Instrumento Decisório</p>
                      <p className="text-xs text-slate-400 mb-4">Inclui Decisão Contratual · Blocos 14 e 15 de uso interno</p>
                      <Button
                        className="w-full font-bold"
                        style={{ background: '#F8B137', color: '#14141E' }}
                        onClick={() => window.location.href = createPageUrl("AvaliacaoQualidadeServico90")}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Iniciar Avaliação 90 Dias
                      </Button>
                    </>
                  ) : isExp45 ? (
                    <>
                      <p className="text-sm text-slate-500 mb-1">13 itens · Escala 4/3/2/1/NO</p>
                      <p className="text-xs text-slate-400 mb-4">Média ponderada · Itens "Não Observado" excluídos do cálculo</p>
                      <Button
                        className="w-full font-bold"
                        style={{ background: '#F8B137', color: '#14141E' }}
                        onClick={() => window.location.href = createPageUrl("AvaliacaoExperiencia45")}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Iniciar Avaliação 45 Dias
                      </Button>
                    </>
                  ) : is11 ? (
                    <>
                      <p className="text-sm text-slate-500 mb-1">Qualitativo · Bimestral · LGPD Compliant</p>
                      <p className="text-xs text-slate-400 mb-4">15 minutos cronometrados · Foco em impedimentos e execução</p>
                      <Button
                        className="w-full font-bold"
                        style={{ background: '#F8B137', color: '#14141E' }}
                        onClick={() => window.location.href = createPageUrl("Registro11")}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Iniciar Registro 1:1
                      </Button>
                    </>
                  ) : isAvaliacao ? (
                    <>
                      <p className="text-sm text-slate-500 mb-1">10 competências (H1–H5 + S1–S5)</p>
                      <p className="text-xs text-slate-400 mb-4">Escala 1–4 · Soma 10–40 pts · Motor de faixa automático</p>
                      <Button
                        className="w-full font-bold"
                        style={{ background: '#F8B137', color: '#14141E' }}
                        onClick={() => window.location.href = createPageUrl("AvaliacaoTrimestral")}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Iniciar Avaliação
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 mb-4">
                        {template.checklist_questions?.length || 0} perguntas de validação
                      </p>
                      <Button
                        className="w-full"
                        style={{ background: '#F8B137', color: '#14141E' }}
                        onClick={() => handleCreateFeedback(template)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Responder Feedback
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Meus Feedbacks */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Respondidos</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {myFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum feedback criado ainda
              </div>
            ) : (
              <div className="space-y-3">
                {myFeedbacks.map((feedback) => {
                  const statusMap = {
                    'DISPONIVEL_PARA_GESTOR': { label: 'Disponível', color: 'bg-blue-100 text-blue-700', clickable: false },
                    'EM_REVISAO_ADMIN': { label: 'Em Revisão', color: 'bg-amber-100 text-amber-700', clickable: false },
                    'APROVADO': { label: 'Aprovado - Ações Pendentes', color: 'bg-green-100 text-green-700', clickable: true },
                    'CONVERSA_AGENDADA': { label: 'Conversa Agendada', color: 'bg-purple-100 text-purple-700', clickable: true },
                    'CONVERSA_REALIZADA': { label: 'Conversa Realizada', color: 'bg-indigo-100 text-indigo-700', clickable: true },
                    'PUBLICADO': { label: 'Publicado', color: 'bg-emerald-100 text-emerald-700', clickable: false },
                    'ASSINADO_COLABORADOR': { label: 'Assinado', color: 'bg-teal-100 text-teal-700', clickable: false }
                  };
                  const statusDisplay = statusMap[feedback.workflow_status] || { label: feedback.workflow_status, color: 'bg-slate-100 text-slate-700', clickable: false };

                  return (
                    <div
                      key={feedback.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-all ${statusDisplay.clickable ? 'hover:bg-slate-50 cursor-pointer hover:border-[#F8B137]' : 'hover:bg-slate-50'}`}
                      onClick={() => {
                        if (statusDisplay.clickable) {
                          window.location.href = createPageUrl("GerenciarFeedback") + `?id=${feedback.id}`;
                        }
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{feedback.employee_name}</p>
                        <p className="text-sm text-slate-500">{feedback.template_title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(feedback.feedback_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={statusDisplay.color}>
                        {statusDisplay.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para criar feedback */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Responder Feedback: {selectedTemplate?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Colaborador *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData({...formData, employee_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador do seu time" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">
                      Nenhum colaborador vinculado ao seu time
                    </div>
                  ) : (
                    colaboradores.map((colab) => (
                      <SelectItem key={colab.id} value={colab.id}>
                        {colab.full_name} - {colab.position || 'Sem cargo'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Apenas colaboradores do seu time são listados.</p>
            </div>

            <div>
              <Label>Data do Feedback</Label>
              <Input
                type="date"
                value={formData.feedback_date}
                onChange={(e) => setFormData({...formData, feedback_date: e.target.value})}
              />
            </div>

            <div>
              <Label>Pontos Fortes</Label>
              <Textarea
                value={formData.strengths}
                onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                placeholder="Descreva os pontos fortes do colaborador..."
                rows={3}
              />
            </div>

            <div>
              <Label>Pontos de Melhoria</Label>
              <Textarea
                value={formData.improvements}
                onChange={(e) => setFormData({...formData, improvements: e.target.value})}
                placeholder="Descreva os pontos que podem ser melhorados..."
                rows={3}
              />
            </div>

            <div>
              <Label>Plano de Ação</Label>
              <Textarea
                value={formData.action_plan}
                onChange={(e) => setFormData({...formData, action_plan: e.target.value})}
                placeholder="Defina as ações para desenvolvimento..."
                rows={3}
              />
            </div>

            <div>
              <Label>Observações Adicionais</Label>
              <Textarea
                value={formData.additional_notes}
                onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                placeholder="Adicione observações extras se necessário..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#F8B137', color: '#14141E' }}
            >
              {saving ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GestorLayout>
  );
}