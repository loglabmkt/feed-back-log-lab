import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Calendar,
  User,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FeedbacksPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [dateError, setDateError] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: "",
    feedback_date: format(new Date(), "yyyy-MM-dd"),
    feedback_type: "feedback",
    strengths: "",
    improvements: "",
    action_plan: "",
    additional_notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [allFeedbacks, allUsers] = await Promise.all([
        base44.entities.FeedbackRecord.list('-created_date', 100),
        base44.entities.User.list()
      ]);

      // Filter feedbacks based on role
      if (user.role === 'admin') {
        setFeedbacks(allFeedbacks);
      } else {
        // Managers can only see feedbacks they created or for their team
        const myFeedbacks = allFeedbacks.filter(f => 
          f.manager_id === user.id || f.employee_email === user.email
        );
        setFeedbacks(myFeedbacks);
      }

      setUsers(allUsers.filter(u => u.status === 'active'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const validateFeedbackDate = (date) => {
    const feedbackDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    feedbackDate.setHours(0, 0, 0, 0);
    
    const daysDiff = differenceInDays(today, feedbackDate);
    
    if (daysDiff > 5) {
      setDateError("RN.01: A data de realização não pode ser superior a 5 dias no passado.");
      return false;
    }
    
    if (feedbackDate > today) {
      setDateError("A data de realização não pode ser no futuro.");
      return false;
    }
    
    setDateError("");
    return true;
  };

  const handleDateChange = (date) => {
    setFormData({...formData, feedback_date: date});
    validateFeedbackDate(date);
  };

  const handleCreateFeedback = async () => {
    if (!validateFeedbackDate(formData.feedback_date)) return;
    if (!formData.employee_id || !formData.strengths || !formData.improvements) {
      return;
    }

    setSaving(true);
    try {
      const employee = users.find(u => u.id === formData.employee_id);
      const validationDeadline = format(addDays(new Date(), 10), "yyyy-MM-dd");

      await base44.entities.FeedbackRecord.create({
        ...formData,
        manager_id: currentUser.id,
        manager_name: currentUser.full_name,
        employee_name: employee.full_name,
        employee_email: employee.email,
        validation_status: "pending",
        validation_deadline: validationDeadline
      });

      // Update employee's last feedback date
      await base44.entities.User.update(employee.id, {
        last_feedback_date: formData.feedback_date,
        compliance_risk: false
      });

      await loadData();
      setShowCreateDialog(false);
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      feedback_date: format(new Date(), "yyyy-MM-dd"),
      feedback_type: "feedback",
      strengths: "",
      improvements: "",
      action_plan: "",
      additional_notes: ""
    });
    setDateError("");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
      accepted: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
      contested: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
      expired: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: AlertCircle }
    };
    const labels = {
      pending: "Pendente",
      accepted: "Aceito",
      contested: "Contestado",
      expired: "Expirado"
    };
    const style = styles[status];
    const Icon = style.icon;
    
    return (
      <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const styles = {
      feedback: "bg-blue-50 text-blue-700 border-blue-200",
      one_on_one: "bg-purple-50 text-purple-700 border-purple-200",
      evaluation: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
    const labels = {
      feedback: "Feedback",
      one_on_one: "1:1",
      evaluation: "Avaliação"
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.manager_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || feedback.feedback_type === filterType;
    const matchesStatus = filterStatus === "all" || feedback.validation_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feedbacks</h1>
          <p className="text-slate-500">Gerencie os rituais de feedback da equipe</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Feedback
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por colaborador ou gestor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="one_on_one">1:1</SelectItem>
                <SelectItem value="evaluation">Avaliação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="accepted">Aceito</SelectItem>
                <SelectItem value="contested">Contestado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum feedback encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card 
              key={feedback.id} 
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedFeedback(feedback);
                setShowViewDialog(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {getInitials(feedback.employee_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">{feedback.employee_name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="w-3 h-3" />
                        <span>Por {feedback.manager_name}</span>
                        <span className="text-slate-300">•</span>
                        <Calendar className="w-3 h-3" />
                        <span>
                          {feedback.feedback_date && format(new Date(feedback.feedback_date), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(feedback.feedback_type)}
                    {getStatusBadge(feedback.validation_status)}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Pontos Fortes</p>
                      <p className="text-sm text-slate-700 line-clamp-2">{feedback.strengths}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Pontos de Melhoria</p>
                      <p className="text-sm text-slate-700 line-clamp-2">{feedback.improvements}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Feedback Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Novo Feedback</DialogTitle>
            <DialogDescription>
              Preencha os dados do feedback realizado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select 
                  value={formData.employee_id} 
                  onValueChange={(value) => setFormData({...formData, employee_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.id !== currentUser?.id).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ritual *</Label>
                <Select 
                  value={formData.feedback_type} 
                  onValueChange={(value) => setFormData({...formData, feedback_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="one_on_one">1:1</SelectItem>
                    <SelectItem value="evaluation">Avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data de Realização *</Label>
              <Input
                type="date"
                value={formData.feedback_date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
              />
              {dateError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{dateError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label>Pontos Fortes *</Label>
              <Textarea
                value={formData.strengths}
                onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                placeholder="Descreva os pontos fortes identificados..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Pontos de Melhoria *</Label>
              <Textarea
                value={formData.improvements}
                onChange={(e) => setFormData({...formData, improvements: e.target.value})}
                placeholder="Descreva os pontos de melhoria identificados..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Plano de Ação</Label>
              <Textarea
                value={formData.action_plan}
                onChange={(e) => setFormData({...formData, action_plan: e.target.value})}
                placeholder="Descreva o plano de ação acordado..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações Adicionais</Label>
              <Textarea
                value={formData.additional_notes}
                onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                placeholder="Observações adicionais (opcional)..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateFeedback}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving || dateError || !formData.employee_id || !formData.strengths || !formData.improvements}
            >
              {saving ? "Salvando..." : "Registrar Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Feedback Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Feedback</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                    {getInitials(selectedFeedback.employee_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{selectedFeedback.employee_name}</p>
                  <p className="text-sm text-slate-500">{selectedFeedback.employee_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Gestor</p>
                  <p className="font-medium text-slate-900">{selectedFeedback.manager_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Data de Realização</p>
                  <p className="font-medium text-slate-900">
                    {selectedFeedback.feedback_date && format(new Date(selectedFeedback.feedback_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Tipo</p>
                  {getTypeBadge(selectedFeedback.feedback_type)}
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Status</p>
                  {getStatusBadge(selectedFeedback.validation_status)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Pontos Fortes</p>
                  <p className="text-slate-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    {selectedFeedback.strengths}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Pontos de Melhoria</p>
                  <p className="text-slate-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    {selectedFeedback.improvements}
                  </p>
                </div>

                {selectedFeedback.action_plan && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Plano de Ação</p>
                    <p className="text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      {selectedFeedback.action_plan}
                    </p>
                  </div>
                )}

                {selectedFeedback.additional_notes && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Observações</p>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedFeedback.additional_notes}
                    </p>
                  </div>
                )}

                {selectedFeedback.contestation_reason && (
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2">Motivo da Contestação</p>
                    <p className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                      {selectedFeedback.contestation_reason}
                    </p>
                  </div>
                )}
              </div>

              {selectedFeedback.validation_deadline && selectedFeedback.validation_status === 'pending' && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Prazo para validação: {format(new Date(selectedFeedback.validation_deadline), "dd/MM/yyyy")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}