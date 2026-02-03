import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Plus, Search, Pencil, Users as UsersIcon } from "lucide-react";
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

export default function Gestores() {
  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_id: "",
    department: "",
    role: "user"
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

      setAllUsers(users);
      
      // Gestores são users que têm subordinados OU são admin
      const managerUsers = users.filter(u => 
        u.role === 'admin' || users.some(emp => emp.manager_id === u.id)
      );
      
      setManagers(managerUsers);
      setCompanies(companiesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "G";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSubordinatesCount = (managerId) => {
    return allUsers.filter(u => u.manager_id === managerId).length;
  };

  const handleEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      full_name: manager.full_name || "",
      email: manager.email || "",
      company_id: manager.company_id || "",
      department: manager.department || "",
      role: manager.role || "user"
    });
    setShowDialog(true);
  };

  const handleNew = () => {
    setEditingManager(null);
    setFormData({
      full_name: "",
      email: "",
      company_id: "",
      department: "",
      role: "user"
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
      if (editingManager) {
        await base44.entities.User.update(editingManager.id, formData);
      } else {
        const emailExists = allUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase());
        if (emailExists) {
          setError("Email já cadastrado");
          setSaving(false);
          return;
        }

        await base44.users.inviteUser(formData.email, formData.role);
        
        const updatedUsers = await base44.entities.User.list();
        const newUser = updatedUsers.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        
        if (newUser) {
          await base44.entities.User.update(newUser.id, {
            company_id: formData.company_id || null,
            department: formData.department || null
          });
        }
      }

      await loadData();
      setShowDialog(false);
    } catch (e) {
      setError(e.message || "Erro ao salvar gestor");
    } finally {
      setSaving(false);
    }
  };

  const filteredManagers = managers.filter(m =>
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-slate-900">Gestores</h1>
          <p className="text-slate-500">Gerencie o cadastro de gestores e líderes</p>
        </div>
        <Button onClick={handleNew} style={{background: '#14141E', color: '#F8B137'}}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Gestor
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
        {filteredManagers.map((manager) => {
          const company = companies.find(c => c.id === manager.company_id);
          const subordinatesCount = getSubordinatesCount(manager.id);

          return (
            <Card key={manager.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{background: '#14141E', color: '#F8B137'}}>
                        {getInitials(manager.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{manager.full_name}</h3>
                        {manager.role === 'admin' && (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{manager.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {company && <span>Empresa: {company.razao_social}</span>}
                        {manager.department && (
                          <>
                            <span>•</span>
                            <span>Setor: {manager.department}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" />
                          {subordinatesCount} liderado{subordinatesCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(manager)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredManagers.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum gestor encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingManager ? 'Editar' : 'Novo'} Gestor</DialogTitle>
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
                placeholder="Nome do gestor"
                disabled={!!editingManager}
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                placeholder="email@empresa.com"
                disabled={!!editingManager}
              />
              {!editingManager && (
                <p className="text-xs text-slate-500">
                  Uma senha temporária será enviada por email
                </p>
              )}
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
              <Label>Setor/Departamento</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="Ex: Comercial, TI, Operações..."
              />
            </div>

            {!editingManager && (
              <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Gestor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              style={{background: '#14141E', color: '#F8B137'}}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}