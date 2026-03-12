import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, 
  Mail, 
  Building2, 
  User, 
  Calendar,
  Briefcase,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import RotinasAvaliacaoTabs from "@/components/colaboradores/RotinasAvaliacaoTabs";

export default function DetalhesPrestador() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prestadorId = searchParams.get("id");
  const isNew = searchParams.get("novo") === "true";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(isNew);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [prestador, setPrestador] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [managers, setManagers] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_id: "",
    manager_id: "",
    department: "",
    position: "",
    admission_date: "",
    status: "active",
    ritual_45d_use_admission: true,
    ritual_45d_custom_start: null,
    ritual_45d_completed_manual: false,
    ritual_45d_completion_date: null,
    ritual_90d_use_admission: true,
    ritual_90d_custom_start: null,
    ritual_90d_completed_manual: false,
    ritual_90d_completion_date: null,
    ritual_trimestral_use_admission: true,
    ritual_trimestral_custom_start: null,
    ritual_1on1_use_admission: true,
    ritual_1on1_custom_start: null
  });
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [prestadorId]);

  const loadData = async () => {
    try {
      const [companiesData, gestores] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.Gestor.list()
      ]);
      
      setCompanies(companiesData);
      setManagers(gestores);

      if (prestadorId && !isNew) {
        const data = await base44.entities.Colaborador.get(prestadorId);
        setPrestador(data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          company_id: data.company_id || "",
          manager_id: data.manager_id || "",
          department: data.department || "",
          position: data.position || "",
          admission_date: data.admission_date || "",
          status: data.status || "active",
          ritual_45d_use_admission: data.ritual_45d_use_admission ?? true,
          ritual_45d_custom_start: data.ritual_45d_custom_start || null,
          ritual_45d_completed_manual: data.ritual_45d_completed_manual || false,
          ritual_45d_completion_date: data.ritual_45d_completion_date || null,
          ritual_90d_use_admission: data.ritual_90d_use_admission ?? true,
          ritual_90d_custom_start: data.ritual_90d_custom_start || null,
          ritual_90d_completed_manual: data.ritual_90d_completed_manual || false,
          ritual_90d_completion_date: data.ritual_90d_completion_date || null,
          ritual_trimestral_use_admission: data.ritual_trimestral_use_admission ?? true,
          ritual_trimestral_custom_start: data.ritual_trimestral_custom_start || null,
          ritual_1on1_use_admission: data.ritual_1on1_use_admission ?? true,
          ritual_1on1_custom_start: data.ritual_1on1_custom_start || null
        });
      }
    } catch (e) {
      setError("Erro ao carregar dados: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");
    setSaving(true);

    if (!formData.full_name || !formData.email) {
      setError("Nome completo e email são obrigatórios");
      setSaving(false);
      return;
    }

    try {
      if (isNew) {
        const created = await base44.entities.Colaborador.create({
          ...formData,
          company_id: formData.company_id || null,
          manager_id: formData.manager_id || null,
          admission_date: formData.admission_date || null,
          schedule_start_date: formData.schedule_start_date || null
        });
        setSuccessMessage("Prestador criado com sucesso!");
        setTimeout(() => {
          navigate(`/DetalhesPrestador?id=${created.id}`);
        }, 1500);
      } else {
        await base44.entities.Colaborador.update(prestadorId, {
          ...formData,
          company_id: formData.company_id || null,
          manager_id: formData.manager_id || null,
          admission_date: formData.admission_date || null,
          schedule_start_date: formData.schedule_start_date || null
        });
        setSuccessMessage("Alterações salvas com sucesso!");
        setEditMode(false);
        await loadData();
      }
    } catch (e) {
      setError("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Colaborador.delete(prestadorId);
      navigate("/Prestadores");
    } catch (e) {
      setError("Erro ao excluir: " + e.message);
      setShowDeleteDialog(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "PS";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.razao_social || "Não definida";
  };

  const getManagerName = (managerId) => {
    const manager = managers.find(m => m.id === managerId);
    return manager?.full_name || "Não definido";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/Prestadores")}
            className="mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2" style={{borderColor: '#F8B137'}}>
              <AvatarFallback style={{background: '#F8B137', color: '#14141E'}} className="text-xl font-bold">
                {getInitials(formData.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isNew ? "Novo Prestador" : formData.full_name || "Prestador"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {!isNew && (
                  <Badge variant={formData.status === "active" ? "default" : "secondary"}>
                    {formData.status === "active" ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativo</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                    )}
                  </Badge>
                )}
                {formData.email && <span className="text-sm text-slate-500">{formData.email}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isNew && !editMode && (
            <>
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </>
          )}
          
          {(editMode || isNew) && (
            <>
              {!isNew && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    loadData();
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{background: '#F8B137', color: '#14141E'}}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Dados Cadastrais */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" style={{color: '#F8B137'}} />
              Dados Cadastrais
            </CardTitle>
            <CardDescription>Informações pessoais e de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              {editMode || isNew ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Nome completo do prestador"
                />
              ) : (
                <p className="text-sm font-medium">{formData.full_name || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              {editMode || isNew ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                  placeholder="email@empresa.com.br"
                />
              ) : (
                <p className="text-sm font-medium">{formData.email || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Admissão
              </Label>
              {editMode || isNew ? (
                <Input
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
                />
              ) : (
                <p className="text-sm font-medium">
                  {formData.admission_date 
                    ? new Date(formData.admission_date + 'T00:00:00').toLocaleDateString('pt-BR')
                    : "—"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              {editMode || isNew ? (
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">
                  {formData.status === "active" ? "Ativo" : "Inativo"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Organizacionais */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" style={{color: '#F8B137'}} />
              Informações Organizacionais
            </CardTitle>
            <CardDescription>Vínculos com empresa, gestor e departamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              {editMode || isNew ? (
                <Select
                  value={formData.company_id || "none"}
                  onValueChange={(v) => setFormData({...formData, company_id: v === "none" ? "" : v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem empresa</SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">{getCompanyName(formData.company_id)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gestor Responsável</Label>
              {editMode || isNew ? (
                <Select
                  value={formData.manager_id || "none"}
                  onValueChange={(v) => setFormData({...formData, manager_id: v === "none" ? "" : v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem gestor</SelectItem>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">{getManagerName(formData.manager_id)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Departamento
              </Label>
              {editMode || isNew ? (
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Ex: Comercial, TI, RH..."
                />
              ) : (
                <p className="text-sm font-medium">{formData.department || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              {editMode || isNew ? (
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Ex: Analista, Coordenador..."
                />
              ) : (
                <p className="text-sm font-medium">{formData.position || "—"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rotinas de Avaliação */}
        {!isNew && (
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" style={{color: '#F8B137'}} />
                Rotinas de Avaliação
              </CardTitle>
              <CardDescription>
                Acompanhamento de ciclos obrigatórios de feedback e avaliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RotinasAvaliacaoTabs
                prestadorId={prestadorId}
                admissionDate={formData.admission_date}
                ritual45dConfig={{
                  use_admission: formData.ritual_45d_use_admission,
                  custom_start: formData.ritual_45d_custom_start,
                  completed_manual: formData.ritual_45d_completed_manual,
                  completion_date: formData.ritual_45d_completion_date
                }}
                ritual90dConfig={{
                  use_admission: formData.ritual_90d_use_admission,
                  custom_start: formData.ritual_90d_custom_start,
                  completed_manual: formData.ritual_90d_completed_manual,
                  completion_date: formData.ritual_90d_completion_date
                }}
                ritualTriConfig={{
                  use_admission: formData.ritual_trimestral_use_admission,
                  custom_start: formData.ritual_trimestral_custom_start
                }}
                ritual1on1Config={{
                  use_admission: formData.ritual_1on1_use_admission,
                  custom_start: formData.ritual_1on1_custom_start
                }}
                onUpdateRitual={async (updates) => {
                  await base44.entities.Colaborador.update(prestadorId, updates);
                  setFormData(prev => ({ ...prev, ...updates }));
                  await loadData();
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o prestador <strong>{formData.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}