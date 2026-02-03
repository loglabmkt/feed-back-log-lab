
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  AlertTriangle,
  Search,
  Eye,
  CheckCircle,
  Clock,
  User,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Contestacoes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [justifications, setJustifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [allJustifications, allFeedbacks] = await Promise.all([
        base44.entities.Justification.list('-created_date'),
        base44.entities.FeedbackRecord.list()
      ]);

      setJustifications(allJustifications);
      setFeedbacks(allFeedbacks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (justification) => {
    setSelectedJustification(justification);
    const feedback = feedbacks.find(f => f.id === justification.feedback_id);
    setSelectedFeedback(feedback);
    setReviewNotes(justification.review_notes || "");
    setShowDialog(true);
  };

  const handleResolve = async (newStatus) => {
    if (!selectedJustification) return;
    
    setProcessing(true);
    try {
      await base44.entities.Justification.update(selectedJustification.id, {
        status: newStatus,
        reviewed_by: currentUser.id,
        review_notes: reviewNotes,
        review_date: new Date().toISOString()
      });
      
      await loadData();
      setShowDialog(false);
      setSelectedJustification(null);
      setSelectedFeedback(null);
      setReviewNotes("");
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock, label: "Aberto" },
      reviewed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Eye, label: "Em Análise" },
      resolved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle, label: "Resolvido" }
    };
    const style = styles[status] || styles.open;
    const Icon = style.icon;
    
    return (
      <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {style.label}
      </Badge>
    );
  };

  const filteredJustifications = justifications.filter(j => {
    const matchesSearch = j.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         j.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || j.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCount = justifications.filter(j => j.status === 'open').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contestações</h1>
        <p className="text-slate-500">Analise e resolva as contestações de feedbacks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{openCount}</p>
              <p className="text-xs text-slate-500">Abertas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {justifications.filter(j => j.status === 'reviewed').length}
              </p>
              <p className="text-xs text-slate-500">Em Análise</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {justifications.filter(j => j.status === 'resolved').length}
              </p>
              <p className="text-xs text-slate-500">Resolvidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por colaborador ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertas</SelectItem>
                <SelectItem value="reviewed">Em Análise</SelectItem>
                <SelectItem value="resolved">Resolvidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredJustifications.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhuma contestação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredJustifications.map((justification) => {
            const feedback = feedbacks.find(f => f.id === justification.feedback_id);
            
            return (
              <Card 
                key={justification.id} 
                className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  justification.status === 'open' ? 'border-l-4 border-l-amber-500' : ''
                }`}
                onClick={() => handleOpenDetails(justification)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold">
                          {getInitials(justification.employee_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{justification.employee_name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {justification.created_date && format(new Date(justification.created_date), "dd/MM/yyyy")}
                          </span>
                          {feedback && (
                            <>
                              <span className="text-slate-300">•</span>
                              <User className="w-3 h-3" />
                              <span>Gestor: {feedback.manager_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(justification.status)}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600 line-clamp-2">{justification.reason}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Contestação</DialogTitle>
          </DialogHeader>
          {selectedJustification && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold">
                    {getInitials(selectedJustification.employee_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{selectedJustification.employee_name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {selectedJustification.created_date && format(new Date(selectedJustification.created_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {selectedFeedback && (
                      <>
                        <span className="text-slate-300">•</span>
                        <User className="w-3 h-3" />
                        <span>Gestor: {selectedFeedback.manager_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Motivo da Contestação</h3>
                {getStatusBadge(selectedJustification.status)}
              </div>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                {selectedJustification.reason}
              </p>

              {selectedFeedback && (
                <>
                  <h3 className="text-lg font-semibold text-slate-900 mt-4">Feedback Original</h3>
                  <p className="text-slate-700 bg-blue-50 p-3 rounded-md border border-blue-100">
                    {selectedFeedback.content}
                  </p>
                </>
              )}

              <div className="space-y-2 mt-4">
                <Label htmlFor="reviewNotes">Notas de Revisão</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Adicione suas notas de revisão aqui..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  disabled={selectedJustification.status === 'resolved'} // Disable if already resolved
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Fechar
            </Button>
            {selectedJustification && selectedJustification.status !== 'resolved' && (
              <>
                <Button 
                  variant="secondary" 
                  onClick={() => handleResolve("reviewed")} 
                  disabled={processing}
                >
                  {processing ? "Analisando..." : "Marcar como Analisado"}
                </Button>
                <Button 
                  onClick={() => handleResolve("resolved")} 
                  disabled={processing}
                >
                  {processing ? "Resolvendo..." : "Marcar como Resolvido"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
