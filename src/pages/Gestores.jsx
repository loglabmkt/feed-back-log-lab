import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Plus, Search, Pencil, Users as UsersIcon, UserCheck, AlertCircle } from "lucide-react";
import TeamModal from "@/components/gestores/TeamModal";
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
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  const [teamModalManager, setTeamModalManager] = useState(null);
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

  // Busca de usuário no modal "Novo Gestor"
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gestores, colaboradores, companiesData, usersData] = await Promise.all([
        base44.entities.Gestor.list(),
        base44.entities.Colaborador.list(),
        base44.entities.Company.list(),
        base44.entities.User.list()
      ]);

      setAllUsers(colaboradores);
      setManagers(gestores);
      setCompanies(companiesData);
      setAllSystemUsers(usersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search nos Users
  const handleUserSearch = (value) => {
    setUserSearch(value);
    setSelectedUser(null);
    setShowDropdown(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.length < 2) {
      setUserSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const term = value.toLowerCase();
      const filtered = allSystemUsers.filter(u =>
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
      setUserSearchResults(filtered);
      setShowDropdown(true);
    }, 300);
  };

  const handleSelectUser = (user) => {
    // Verificar se já é gestor ou admin
    if (user.role === 'admin') {
      setError("Este usuário já possui perfil de administrador.");
      setShowDropdown(false);
      setUserSearch(user.full_name);
      return;
    }
    // Verificar se já é gestor na entidade Gestor
    const jaGestor = managers.some(m => m.email?.toLowerCase() === user.email?.toLowerCase());
    if (jaGestor) {
      setError("Este usuário já possui perfil de gestão.");
      setShowDropdown(false);
      setUserSearch(user.full_name);
      return;
    }

    setError("");
    setSelectedUser(user);
    setUserSearch(user.full_name);
    setShowDropdown(false);
    setFormData(prev => ({
      ...prev,
      full_name: user.full_name,
      email: user.email
    }));
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
    setSelectedUser(null);
    setUserSearch("");
    setUserSearchResults([]);
    setShowDropdown(false);
    setFormData({
      full_name: "",
      email: "",
      company_id: "",
      department: "",
      role: "user"
    });
    setError("");
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
        await base44.entities.Gestor.update(editingManager.id, {
          full_name: formData.full_name,
          email: formData.email,
          company_id: formData.company_id || null,
          department: formData.department || null
        });
      } else {
        if (!selectedUser) {
          setError("Selecione um usuário da lista de busca");
          setSaving(false);
          return;
        }

        const emailExists = managers.some(m => m.email.toLowerCase() === formData.email.toLowerCase());
        if (emailExists) {
          setError("Este usuário já possui perfil de gestão.");
          setSaving(false);
          return;
        }

        // Criar registro na entidade Gestor
        await base44.entities.Gestor.create({
          full_name: formData.full_name,
          email: formData.email,
          company_id: formData.company_id || null,
          department: formData.department || null,
          is_admin: false,
          status: "active"
        });

        // Atualizar role do usuário na tabela Users para 'admin' não - manter como user
        // (a entidade Gestor já controla o perfil de gestor)
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
                        {manager.is_admin && (
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTeamModalManager(manager)}
                      className="text-xs gap-1.5"
                    >
                      <UsersIcon className="w-3.5 h-3.5" />
                      Meu Time
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(manager)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
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

      {/* Team Modal */}
      {teamModalManager && (
        <TeamModal
          manager={teamModalManager}
          allColaboradores={allUsers}
          onClose={() => setTeamModalManager(null)}
          onSaved={async () => { setTeamModalManager(null); await loadData(); }}
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" style={{color: '#F8B137'}} />
              {editingManager ? 'Editar Gestor' : 'Promover a Gestor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Busca de usuário — apenas no cadastro novo */}
            {!editingManager && (
              <div className="space-y-2">
                <Label>Buscar Colaborador *</Label>
                <div className="relative" ref={dropdownRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-10"
                    placeholder="Busque por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {showDropdown && userSearchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {userSearchResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && userSearchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-500">
                      Nenhum usuário encontrado.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nome e email — read-only ao selecionar usuário no modo novo */}
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.full_name}
                readOnly={!editingManager && !!selectedUser}
                onChange={(e) => !selectedUser && setFormData({...formData, full_name: e.target.value})}
                placeholder="Nome do gestor"
                className={!editingManager && selectedUser ? "bg-slate-50 text-slate-600 cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                readOnly={!editingManager && !!selectedUser}
                onChange={(e) => !selectedUser && setFormData({...formData, email: e.target.value.toLowerCase()})}
                placeholder="email@empresa.com"
                className={!editingManager && selectedUser ? "bg-slate-50 text-slate-600 cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Input value="Gestor" readOnly className="bg-slate-50 text-slate-600 cursor-not-allowed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || (!editingManager && !selectedUser)}
              style={{background: '#14141E', color: '#F8B137'}}
            >
              {saving ? "Salvando..." : editingManager ? "Salvar" : "Promover a Gestor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}