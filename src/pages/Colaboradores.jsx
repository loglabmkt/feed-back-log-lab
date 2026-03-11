import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserCircle, Plus, Search, Pencil, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import RotinasAvaliacao from "@/components/colaboradores/RotinasAvaliacao";

export default function Colaboradores() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_id: "",
    manager_id: "",
    department: "",
    admission_date: "",
    eval_45d_completed: false,
    use_admission_for_schedule: false,
    schedule_start_date: ""
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [colaboradores, gestores, companiesData] = await Promise.all([
        base44.entities.Colaborador.list(),
        base44.entities.Gestor.list(),
        base44.entities.Company.list()
      ]);

      setEmployees(colaboradores);
      setManagers(gestores);
      setCompanies(companiesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name || "",
      email: employee.email || "",
      company_id: employee.company_id || "",
      manager_id: employee.manager_id || "",
      department: employee.department || "",
      admission_date: employee.admission_date || "",
      eval_45d_completed: employee.eval_45d_completed || false,
      use_admission_for_schedule: employee.use_admission_for_schedule ?? false,
      schedule_start_date: employee.schedule_start_date || ""
    });
    setShowDialog(true);
  };

  const handleNew = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: "",
      email: "",
      company_id: "",
      manager_id: "",
      department: "",
      admission_date: "",
      eval_45d_completed: false,
      use_admission_for_schedule: false,
      schedule_start_date: ""
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    if (!formData.full_name || !formData.email) {
      setError("Nome e email são obrigatórios");
      setSaving(false);
      return;
    }

    try {
      if (editingEmployee) {
        await base44.entities.Colaborador.update(editingEmployee.id, {
          ...formData,
          company_id: formData.company_id || null,
          manager_id: formData.manager_id || null,
          admission_date: formData.admission_date || null,
          schedule_start_date: formData.schedule_start_date || null
        });
      } else {
        const emailExists = employees.some(e => e.email.toLowerCase() === formData.email.toLowerCase());
        if (emailExists) {
          setError("Email já cadastrado");
          setSaving(false);
          return;
        }

        await base44.entities.Colaborador.create({
          full_name: formData.full_name,
          email: formData.email,
          company_id: formData.company_id || null,
          manager_id: formData.manager_id || null,
          department: formData.department || null,
          admission_date: formData.admission_date || null,
          eval_45d_completed: false,
          use_admission_for_schedule: formData.use_admission_for_schedule ?? false,
          schedule_start_date: formData.schedule_start_date || null,
          status: "active"
        });
      }

      await loadData();
      setShowDialog(false);
    } catch (e) {
      setError(e.message || "Erro ao salvar colaborador");
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
          <p className="text-slate-500">Gerencie o cadastro de colaboradores</p>
        </div>
        <Button onClick={handleNew} style={{background: '#F8B137', color: '#14141E'}}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {paginatedEmployees.map((employee) => {
          const company = companies.find(c => c.id === employee.company_id);
          const manager = managers.find(m => m.id === employee.manager_id);

          return (
            <Card key={employee.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{background: '#F8B137', color: '#14141E'}}>
                        {getInitials(employee.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-900">{employee.full_name}</h3>
                      <p className="text-sm text-slate-500">{employee.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        {company && <span>Empresa: {company.razao_social}</span>}
                        {manager && (
                          <>
                            <span>•</span>
                            <span>Gestor: {manager.full_name}</span>
                          </>
                        )}
                        {employee.department && (
                          <>
                            <span>•</span>
                            <span>{employee.department}</span>
                          </>
                        )}
                        {employee.admission_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Admissão: {new Date(employee.admission_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredEmployees.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <UserCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum colaborador encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredEmployees.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredEmployees.length)} de {filteredEmployees.length} colaboradores
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  style={currentPage === page ? {background: '#F8B137', color: '#14141E'} : {}}
                  className="w-8"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingEmployee ? 'Editar' : 'Novo'} Colaborador
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-2">

            {/* ── Coluna 1: Dados cadastrais ── */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <UserCircle className="w-3.5 h-3.5" />
                Dados Cadastrais
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Nome do colaborador"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Data de Admissão</Label>
                  <Input
                    type="date"
                    value={formData.admission_date}
                    onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
                  />
                  <p className="text-xs text-slate-400">Usada para calcular os ciclos de avaliação obrigatórios</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Empresa</Label>
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
                </div>

                <div className="space-y-1.5">
                  <Label>Gestor</Label>
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
                </div>

                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="Ex: Comercial, TI, RH..."
                  />
                </div>
              </div>
            </div>

            {/* ── Coluna 2: Rotinas de Avaliação ── */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Rotinas de Avaliação
              </p>
              <RotinasAvaliacao
                admissionDate={formData.admission_date}
                employeeId={editingEmployee?.id || null}
                eval45dCompleted={formData.eval_45d_completed}
                onMark45dDone={() => setFormData({...formData, eval_45d_completed: true})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{background: '#F8B137', color: '#14141E'}}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}