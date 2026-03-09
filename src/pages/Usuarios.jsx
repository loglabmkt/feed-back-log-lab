import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [companies, setCompanies] = useState([]);
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
    status: "active",
    is_manager: false
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
      const [allUsers, gestoresData, companiesData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Gestor.list(),
        base44.entities.Company.list()
      ]);
      setUsers(allUsers);
      setGestores(gestoresData);
      setCompanies(companiesData);
      const activeUsers = allUsers.filter(u => u.status === 'active');
      const potentialManagers = activeUsers.filter(u => 
        u.role === 'admin' || activeUsers.some(subordinate => subordinate.manager_id === u.id)
      );
      setManagers(potentialManagers);
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    const isGestor = gestores.some(g => g.email?.toLowerCase() === user.email?.toLowerCase());
    setFormData({
      manager_id: user.manager_id || "",
      department: user.department || "",
      position: user.position || "",
      admission_date: user.admission_date ? format(new Date(user.admission_date), 'yyyy-MM-dd') : "",
      status: user.status || "active",
      is_manager: isGestor
    });
    setError("");
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Ensure manager_id is null if empty string
      const dataToUpdate = {
        ...formData,
        manager_id: formData.manager_id || null,
        admission_date: formData.admission_date || null,
        department: formData.department || null,
        position: formData.position || null,
      };
      await base44.entities.User.update(editingUser.id, dataToUpdate);
      await loadUsers();
      setShowDialog(false);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar usuário: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");

    if (!createFormData.full_name || !createFormData.email) {
      setError("Nome e e-mail são obrigatórios");
      setSaving(false);
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === createFormData.email.toLowerCase());
    if (emailExists) {
      setError("Este e-mail já está cadastrado no sistema");
      setSaving(false);
      return;
    }

    try {
      // Create user first via inviteUser (only email and role are directly handled here)
      await base44.users.inviteUser(createFormData.email, createFormData.role || "user", createFormData.full_name);

      // Fetch all users again to get the newly created user's ID
      // This is a workaround as inviteUser might not return the full user object with ID directly
      const allUsers = await base44.entities.User.list();
      const newUser = allUsers.find(u => u.email.toLowerCase() === createFormData.email.toLowerCase());
      
      if (newUser) {
        // Update the new user with additional details
        await base44.entities.User.update(newUser.id, {
          full_name: createFormData.full_name, // Ensure full_name is also updated if not set by inviteUser
          manager_id: createFormData.manager_id || null,
          department: createFormData.department || null,
          position: createFormData.position || null,
          admission_date: createFormData.admission_date || null,
          status: createFormData.status || "active"
        });
      } else {
        throw new Error("Usuário criado, mas não encontrado para atualização de detalhes.");
      }

      await loadUsers();
      setShowCreateDialog(false);
      setCreateFormData({ // Reset form
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
    const subordinates = users.filter(u => u.manager_id === user.id && u.status === 'active');
    
    if (subordinates.length > 0) {
      setInactivatingUser(user);
      setShowInactivateDialog(true);
      setNewManagerId(""); // Reset new manager selection
      setError(""); // Clear previous errors
    } else {
      // If no subordinates, inactivate directly without the dialog
      if (window.confirm(`Tem certeza que deseja inativar o usuário ${user.full_name}?`)) {
        confirmInactivation(user.id, null);
      }
    }
  };

  const confirmInactivation = async (userId, newManagerId) => {
    setSaving(true);
    setError("");
    try {
      if (newManagerId) {
        const subordinates = users.filter(u => u.manager_id === userId && u.status === 'active');
        for (const sub of subordinates) {
          await base44.entities.User.update(sub.id, {
            manager_id: newManagerId
          });
        }
      }

      await base44.entities.User.update(userId, {
        status: "inactive"
      });

      await loadUsers();
      setShowInactivateDialog(false);
      setInactivatingUser(null);
      setNewManagerId("");
    } catch (e) {
      console.error(e);
      setError("Erro ao inativar usuário: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const isAtRisk = (user) => {
    if (!user.last_feedback_date) return true; // No feedback date means at risk
    const daysSince = differenceInDays(new Date(), new Date(user.last_feedback_date));
    return daysSince > 90;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    const matchesRisk = filterRisk === "all" || 
                       (filterRisk === "at_risk" && isAtRisk(user)) ||
                       (filterRisk === "compliant" && !isAtRisk(user));
    
    // Determine if a user is a manager based on having active subordinates
    const userIsManager = users.some(u => u.manager_id === user.id && u.status === 'active');

    const matchesRole = filterRole === "all" || 
                       (filterRole === "admin" && user.role === 'admin') ||
                       (filterRole === "manager" && userIsManager) ||
                       (filterRole === "employee" && user.role !== 'admin' && !userIsManager);
    
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
                  const manager = users.find(m => m.id === user.manager_id); // Find manager from all users
                  const isManager = users.some(u => u.manager_id === user.id); // Check if user has subordinates
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
              <p className="text-slate-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">Nome</Label>
              <Input
                id="full_name"
                defaultValue={editingUser?.full_name}
                className="col-span-3"
                disabled // Name should not be editable here
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                defaultValue={editingUser?.email}
                className="col-span-3"
                disabled // Email should not be editable here
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">Gestor</Label>
              <Select
                value={formData.manager_id || ""}
                onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {managers
                    .filter(m => m.id !== editingUser?.id) // A user cannot be their own manager
                    .map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admission_date" className="text-right">Admissão</Label>
              <Input
                id="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-500 text-sm col-span-full">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_full_name" className="text-right">Nome Completo</Label>
              <Input
                id="create_full_name"
                value={createFormData.full_name}
                onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_email" className="text-right">Email</Label>
              <Input
                id="create_email"
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_role" className="text-right">Perfil</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value) => setCreateFormData({ ...createFormData, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Colaborador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_manager" className="text-right">Gestor</Label>
              <Select
                value={createFormData.manager_id || ""}
                onValueChange={(value) => setCreateFormData({ ...createFormData, manager_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_department" className="text-right">Departamento</Label>
              <Input
                id="create_department"
                value={createFormData.department}
                onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_position" className="text-right">Cargo</Label>
              <Input
                id="create_position"
                value={createFormData.position}
                onChange={(e) => setCreateFormData({ ...createFormData, position: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_admission_date" className="text-right">Admissão</Label>
              <Input
                id="create_admission_date"
                type="date"
                value={createFormData.admission_date}
                onChange={(e) => setCreateFormData({ ...createFormData, admission_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create_status" className="text-right">Status</Label>
              <Select
                value={createFormData.status}
                onValueChange={(value) => setCreateFormData({ ...createFormData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-500 text-sm col-span-full">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivate User Dialog */}
      <Dialog open={showInactivateDialog} onOpenChange={setShowInactivateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Inativar Usuário: {inactivatingUser?.full_name}</DialogTitle>
            <DialogDescription>
              {`Você está prestes a inativar o usuário ${inactivatingUser?.full_name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-700">
              Este usuário possui subordinados ativos. Para inativá-lo, você deve reatribuir seus subordinados a outro gestor.
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_manager" className="text-right">Novo Gestor</Label>
              <Select
                value={newManagerId}
                onValueChange={setNewManagerId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar novo gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum (Subordinados ficarão sem gestor)</SelectItem>
                  {managers
                    .filter(m => m.id !== inactivatingUser?.id) // The inactivating user cannot be the new manager
                    .map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-500 text-sm col-span-full">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInactivateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmInactivation(inactivatingUser?.id, newManagerId || null)} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? "Inativando..." : "Confirmar Inativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}