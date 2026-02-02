import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Building2,
  Mail,
  Calendar,
  UserCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInactivateDialog, setShowInactivateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inactivatingUser, setInactivatingUser] = useState(null);
  const [newManagerId, setNewManagerId] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    manager_id: "",
    department: "",
    position: "",
    admission_date: "",
    status: "active"
  });
  const [createFormData, setCreateFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
    department: "",
    position: "",
    manager_id: "",
    admission_date: "",
    status: "active"
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);
      // Gestores são users com subordinados OU admin
      const potentialManagers = allUsers.filter(u => 
        u.role === 'admin' || allUsers.some(subordinate => subordinate.manager_id === u.id)
      );
      setManagers(potentialManagers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      manager_id: user.manager_id || "",
      department: user.department || "",
      position: user.position || "",
      admission_date: user.admission_date || "",
      status: user.status || "active"
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.entities.User.update(editingUser.id, formData);
      await loadUsers();
      setShowDialog(false);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");

    // Validações
    if (!createFormData.full_name || !createFormData.email) {
      setError("Nome e e-mail são obrigatórios");
      setSaving(false);
      return;
    }

    // Verificar email duplicado
    const emailExists = users.some(u => u.email.toLowerCase() === createFormData.email.toLowerCase());
    if (emailExists) {
      setError("Este e-mail já está cadastrado no sistema");
      setSaving(false);
      return;
    }

    try {
      // Convidar usuário (Base44 cria automaticamente)
      await base44.users.inviteUser(createFormData.email, createFormData.role || "user");

      // Atualizar dados complementares
      const allUsers = await base44.entities.User.list();
      const newUser = allUsers.find(u => u.email.toLowerCase() === createFormData.email.toLowerCase());
      
      if (newUser) {
        await base44.entities.User.update(newUser.id, {
          manager_id: createFormData.manager_id || null,
          department: createFormData.department || null,
          position: createFormData.position || null,
          admission_date: createFormData.admission_date || null,
          status: createFormData.status || "active"
        });
      }

      await loadUsers();
      setShowCreateDialog(false);
      setCreateFormData({
        full_name: "",
        email: "",
        role: "user",
        department: "",
        position: "",
        manager_id: "",
        admission_date: "",
        status: "active"
      });
    } catch (e) {
      console.error(e);
      setError(e.message || "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleInactivateUser = (user) => {
    // Verificar se há subordinados
    const subordinates = users.filter(u => u.manager_id === user.id && u.status === 'active');
    
    if (subordinates.length > 0) {
      setInactivatingUser(user);
      setShowInactivateDialog(true);
    } else {
      // Inativar diretamente
      confirmInactivation(user.id, null);
    }
  };

  const confirmInactivation = async (userId, newManagerId) => {
    setSaving(true);
    try {
      // Transferir subordinados se necessário
      if (newManagerId) {
        const subordinates = users.filter(u => u.manager_id === userId && u.status === 'active');
        for (const sub of subordinates) {
          await base44.entities.User.update(sub.id, {
            manager_id: newManagerId
          });
        }
      }

      // Inativar usuário (soft delete)
      await base44.entities.User.update(userId, {
        status: "inactive"
      });

      await loadUsers();
      setShowInactivateDialog(false);
      setInactivatingUser(null);
      setNewManagerId("");
    } catch (e) {
      console.error(e);
      setError("Erro ao inativar usuário");
    } finally {
      setSaving(false);
    }
  };

  const isAtRisk = (user) => {
    if (!user.last_feedback_date) return true;
    const daysSince = differenceInDays(new Date(), new Date(user.last_feedback_date));
    return daysSince > 90;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Administrador';
    // Verificar se é gestor (tem subordinados)
    const hasSubordinates = users.some(u => u.manager_id === users.find(usr => usr.role === role)?.id);
    return hasSubordinates ? 'Gestor' : 'Colaborador';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    const matchesRisk = filterRisk === "all" || 
                       (filterRisk === "at_risk" && isAtRisk(user)) ||
                       (filterRisk === "compliant" && !isAtRisk(user));
    
    const matchesRole = filterRole === "all" || 
                       (filterRole === "admin" && user.role === 'admin') ||
                       (filterRole === "manager" && users.some(u => u.manager_id === user.id)) ||
                       (filterRole === "employee" && user.role !== 'admin' && !users.some(u => u.manager_id === user.id));
    
    return matchesSearch && matchesStatus && matchesRisk && matchesRole;
  });

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
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500">Cadastre gestores, colaboradores e gerencie acessos</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="font-semibold shadow-md"
          style={{background: '#F8B137', color: '#14141E'}}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
              <p className="text-xs text-slate-500">Total</p>
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
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className="text-xs text-slate-500">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter(u => isAtRisk(u) && u.status === 'active').length}
              </p>
              <p className="text-xs text-slate-500">Em Risco</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.status === 'inactive').length}
              </p>
              <p className="text-xs text-slate-500">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
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
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Perfis</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="manager">Gestores</SelectItem>
                <SelectItem value="employee">Colaboradores</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="at_risk">Em Risco</SelectItem>
                <SelectItem value="compliant">Em Dia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-4 font-medium text-slate-600">Usuário</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden md:table-cell">Perfil</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden md:table-cell">Cargo/Dept</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden lg:table-cell">Gestor</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden sm:table-cell">Último Feedback</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-right p-4 font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const atRisk = isAtRisk(user);
                  const manager = managers.find(m => m.id === user.manager_id);
                  const isManager = users.some(u => u.manager_id === user.id);
                  const daysSinceLastFeedback = user.last_feedback_date
                    ? differenceInDays(new Date(), new Date(user.last_feedback_date))
                    : null;

                  return (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback 
                              className="text-white text-sm font-semibold"
                              style={{background: user.role === 'admin' ? '#14141E' : '#F8B137'}}
                            >
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge 
                          variant="outline"
                          className={
                            user.role === 'admin' 
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : isManager
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          {user.role === 'admin' ? 'Admin' : isManager ? 'Gestor' : 'Colaborador'}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div>
                          <p className="text-slate-900">{user.position || '-'}</p>
                          <p className="text-sm text-slate-500">{user.department || '-'}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <p className="text-slate-900">{manager?.full_name || '-'}</p>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        {user.last_feedback_date ? (
                          <div className="flex items-center gap-2">
                            {atRisk && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                            <span className={atRisk ? 'text-amber-600' : 'text-slate-600'}>
                              {format(new Date(user.last_feedback_date), "dd/MM/yyyy")}
                            </span>
                            {daysSinceLastFeedback !== null && (
                              <span className="text-xs text-slate-400">
                                ({daysSinceLastFeedback} dias)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Nunca</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline" 
                          className={user.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                          }
                        >
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {user.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => handleInactivateUser(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Inativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum colaborador encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gestor Direto</Label>
              <Select 
                value={formData.manager_id} 
                onValueChange={(value) => setFormData({...formData, manager_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem gestor</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="Ex: Tecnologia, RH, Financeiro..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Ex: Analista, Coordenador..."
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Admissão</Label>
              <Input
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
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
                value={createFormData.full_name}
                onChange={(e) => setCreateFormData({...createFormData, full_name: e.target.value})}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label>E-mail Corporativo *</Label>
              <Input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({...createFormData, email: e.target.value.toLowerCase()})}
                placeholder="email@empresa.com"
              />
              <p className="text-xs text-slate-500">
                O usuário receberá um convite por e-mail para criar a senha
              </p>
            </div>

            <div className="space-y-2">
              <Label>Perfil *</Label>
              <Select 
                value={createFormData.role} 
                onValueChange={(value) => setCreateFormData({...createFormData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Gestor/Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gestor Imediato</Label>
              <Select 
                value={createFormData.manager_id} 
                onValueChange={(value) => setCreateFormData({...createFormData, manager_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem gestor</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={createFormData.department}
                onChange={(e) => setCreateFormData({...createFormData, department: e.target.value})}
                placeholder="Ex: Tecnologia, RH, Comercial..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={createFormData.position}
                onChange={(e) => setCreateFormData({...createFormData, position: e.target.value})}
                placeholder="Ex: Analista, Coordenador, Gerente..."
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Admissão</Label>
              <Input
                type="date"
                value={createFormData.admission_date}
                onChange={(e) => setCreateFormData({...createFormData, admission_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setError("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={saving || !createFormData.full_name || !createFormData.email}
              style={{background: '#F8B137', color: '#14141E'}}
            >
              {saving ? "Cadastrando..." : "Cadastrar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivate User Dialog */}
      <Dialog open={showInactivateDialog} onOpenChange={setShowInactivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Inativar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-700">
              O usuário <strong>{inactivatingUser?.full_name}</strong> possui{' '}
              <strong>{users.filter(u => u.manager_id === inactivatingUser?.id && u.status === 'active').length}</strong>{' '}
              colaborador(es) vinculado(s).
            </p>
            <p className="text-sm text-slate-600">
              Para prosseguir, você deve transferir estes colaboradores para outro gestor.
            </p>

            <div className="space-y-2">
              <Label>Novo Gestor *</Label>
              <Select value={newManagerId} onValueChange={setNewManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo gestor" />
                </SelectTrigger>
                <SelectContent>
                  {managers
                    .filter(m => m.id !== inactivatingUser?.id && m.status === 'active')
                    .map(manager => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                ⚠️ Esta ação não pode ser desfeita. O usuário será inativado e todos os seus subordinados serão transferidos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowInactivateDialog(false);
                setInactivatingUser(null);
                setNewManagerId("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmInactivation(inactivatingUser.id, newManagerId)}
              disabled={saving || !newManagerId}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? "Inativando..." : "Confirmar Inativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}