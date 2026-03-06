import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Pencil,
  Trash2,
  Power,
  PowerOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Feedbacks() {
  const [currentUser, setCurrentUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const AVALIACAO_TRIMESTRAL_TITLE = "Avaliação de Desempenho Trimestral";
  const AVALIACAO_EXP45_TITLE = "Avaliação de Experiência – 45 Dias";

  const ensureAvaliacaoTemplate = async (user) => {
    if (user?.role !== 'admin') return;
    const [existingTrimestral, existingExp45] = await Promise.all([
      base44.entities.FeedbackTemplate.filter({ feedback_type: 'evaluation', title: AVALIACAO_TRIMESTRAL_TITLE }),
      base44.entities.FeedbackTemplate.filter({ feedback_type: 'experience_45d' })
    ]);
    const creates = [];
    if (existingTrimestral.length === 0) {
      creates.push(base44.entities.FeedbackTemplate.create({
        title: AVALIACAO_TRIMESTRAL_TITLE,
        feedback_type: 'evaluation',
        is_active: true,
        checklist_questions: [],
        created_by_admin: user.id
      }));
    }
    if (existingExp45.length === 0) {
      creates.push(base44.entities.FeedbackTemplate.create({
        title: AVALIACAO_EXP45_TITLE,
        feedback_type: 'experience_45d',
        is_active: true,
        checklist_questions: [],
        created_by_admin: user.id
      }));
    }
    if (creates.length > 0) await Promise.all(creates);
  };

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      await ensureAvaliacaoTemplate(user);

      const allTemplates = await base44.entities.FeedbackTemplate.list('-created_date', 100);
      setTemplates(allTemplates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const newActiveState = !template.is_active;
      
      await base44.entities.FeedbackTemplate.update(template.id, {
        is_active: newActiveState
      });
      
      // Se foi ativado, notificar gestores via Resend
      if (newActiveState === true) {
        try {
          await base44.functions.invoke('notifyManagersNewFeedback', {
            templateId: template.id
          });
        } catch (emailError) {
          console.error('Erro ao enviar notificações:', emailError);
          // Não bloqueia a ativação se o email falhar
        }
      }
      
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      await base44.entities.FeedbackTemplate.delete(deleteId);
      await loadData();
      setDeleteId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      feedback: "bg-blue-50 text-blue-700 border-blue-200",
      one_on_one: "bg-purple-50 text-purple-700 border-purple-200",
      evaluation: "bg-indigo-50 text-indigo-700 border-indigo-200",
      experience_45d: "bg-orange-50 text-orange-700 border-orange-200"
    };
    const labels = {
      feedback: "Feedback Trimestral",
      one_on_one: "1:1",
      evaluation: "Avaliação Trimestral",
      experience_45d: "Avaliação 45 Dias"
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const filteredTemplates = templates.filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = currentUser?.role === 'admin';

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
          <h1 className="text-2xl font-bold text-slate-900">Feedbacks</h1>
          <p className="text-slate-500">
            {isAdmin ? "Gerencie os templates de feedback do sistema" : "Preencha os feedbacks disponíveis"}
          </p>
        </div>
        {isAdmin && (
          <Link to={createPageUrl("CriarFeedback")}>
            <Button style={{background: '#F8B137', color: '#14141E'}} className="font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Feedback
            </Button>
          </Link>
        )}
      </div>

        {isAdmin && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        )}
        <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum feedback encontrado</p>
              {isAdmin && (
                <Link to={createPageUrl("CriarFeedback")}>
                  <Button className="mt-4" style={{background: '#F8B137', color: '#14141E'}}>
                    Criar Primeiro Feedback
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{template.title}</h3>
                      {getTypeBadge(template.feedback_type)}
                    </div>
                    <p className="text-sm text-slate-500">
                      {template.checklist_questions?.length || 0} perguntas no checklist
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                        {template.is_active ? (
                          <Power className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <PowerOff className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => handleToggleActive(template)}
                        />
                      </div>

                      <Link to={createPageUrl("EditarFeedback") + `?id=${template.id}`}>
                        <Button variant="outline" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setDeleteId(template.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}