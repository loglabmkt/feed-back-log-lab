import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GestorLayout from "@/components/GestorLayout";

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

      // Buscar templates ativos
      const allTemplates = await base44.entities.FeedbackTemplate.filter({ is_active: true });
      setTemplates(allTemplates);

      // Buscar colaboradores do gestor
      const allColaboradores = await base44.entities.Colaborador.list();
      const gestorColaboradores = allColaboradores.filter(c => 
        c.manager_id === gestorData.id && c.status === 'active'
      );
      setColaboradores(gestorColaboradores);

      // Buscar feedbacks criados pelo gestor
      const feedbacks = await base44.entities.FeedbackRecord.filter({
        manager_id: gestorData.id
      });
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Meus Feedbacks
        </h1>
        <p className="text-slate-500">Crie e gerencie feedbacks para sua equipe</p>
      </div>

        {/* Templates Ativos */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Templates Disponíveis</h2>
          {templates.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-slate-500">
                Nenhum template ativo no momento
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="text-base">{template.title}</span>
                      <Badge className="ml-2" style={{background: '#F8B137', color: '#14141E'}}>
                        {template.feedback_type === 'feedback' ? 'Feedback' :
                         template.feedback_type === 'one_on_one' ? 'One-on-One' : 'Avaliação'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 mb-4">
                      {template.checklist_questions?.length || 0} perguntas de validação
                    </p>
                    <Button
                      className="w-full"
                      style={{background: '#F8B137', color: '#14141E'}}
                      onClick={() => handleCreateFeedback(template)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Responder Feedback
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      {/* Meus Feedbacks */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Feedbacks Criados</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {myFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum feedback criado ainda
              </div>
            ) : (
              <div className="space-y-3">
                {myFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{feedback.employee_name}</p>
                      <p className="text-sm text-slate-500">{feedback.template_title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(feedback.feedback_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge
                      className={
                        feedback.workflow_status === 'DISPONIVEL_PARA_GESTOR' ? 'bg-blue-100 text-blue-700' :
                        feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'bg-amber-100 text-amber-700' :
                        feedback.workflow_status === 'CONCLUIDO_PARA_ENVIO' ? 'bg-purple-100 text-purple-700' :
                        feedback.workflow_status === 'AGUARDANDO_VALIDACAO_COLABORADOR' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }
                    >
                      {feedback.workflow_status === 'DISPONIVEL_PARA_GESTOR' ? 'Rascunho' :
                       feedback.workflow_status === 'EM_REVISAO_ADMIN' ? 'Em Revisão' :
                       feedback.workflow_status === 'CONCLUIDO_PARA_ENVIO' ? 'Aprovado' :
                       feedback.workflow_status === 'AGUARDANDO_VALIDACAO_COLABORADOR' ? 'Aguardando Assinatura' :
                       'Concluído'}
                    </Badge>
                  </div>
                ))}
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
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">
                      Nenhum colaborador encontrado
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{background: '#F8B137', color: '#14141E'}}
            >
              {saving ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GestorLayout>
  );
}