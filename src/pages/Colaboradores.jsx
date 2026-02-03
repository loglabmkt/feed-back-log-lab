import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserCircle, Plus, Search, Pencil } from "lucide-react";
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
    department: ""
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [users, companiesData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Company.list()
      ]);

      const employeeUsers = users.filter(u => u.role !== 'admin');
      const managerUsers = users.filter(u => 
        u.role === 'admin' || users.some(emp => emp.manager_id === u.id)
      );

      setEmployees(employeeUsers);
      setManagers(managerUsers);
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
      department: employee.department || ""
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
      department: ""
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
        await base44.entities.User.update(editingEmployee.id, formData);
      } else {
        const emailExists = employees.some(e => e.email.toLowerCase() === formData.email.toLowerCase());
        if (emailExists) {
          setError("Email já cadastrado");
          setSaving(false);
          return;
        }

        await base44.users.inviteUser(formData.email, "user");
        
        const updatedUsers = await base44.entities.User.list();
        const newUser = updatedUsers.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        
        if (newUser) {
          await base44.entities.User.update(newUser.id, {
            company_id: formData.company_id || null,
            manager_id: formData.manager_id || null,
            department: formData.department || null
          });
        }
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
        {filteredEmployees.map((employee) => {
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
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Editar' : 'Novo'} Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Nome do colaborador"
                disabled={!!editingEmployee}
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                placeholder="email@empresa.com"
                disabled={!!editingEmployee}
              />
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem empresa</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gestor</Label>
              <Select value={formData.manager_id} onValueChange={(value) => setFormData({...formData, manager_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem gestor</SelectItem>
                  {managers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="Ex: Comercial, TI, RH..."
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