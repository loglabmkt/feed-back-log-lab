import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { UserCircle, Plus, Search, Eye, CalendarDays, Building2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Prestadores() {
  const navigate = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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

      setPrestadores(colaboradores);
      setManagers(gestores);
      setCompanies(companiesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const filteredPrestadores = prestadores.filter(p => {
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = filterCompany === "all" || p.company_id === filterCompany;
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    return matchesSearch && matchesCompany && matchesStatus;
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
          <h1 className="text-2xl font-bold text-slate-900">Prestadores</h1>
          <p className="text-slate-500">
            Gerencie o cadastro completo de prestadores de serviço
          </p>
        </div>
        <Button 
          onClick={() => navigate("/DetalhesPrestador?novo=true")}
          style={{background: '#F8B137', color: '#14141E'}}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Prestador
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total de Prestadores</p>
                <p className="text-2xl font-bold">{prestadores.length}</p>
              </div>
              <UserCircle className="w-10 h-10 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {prestadores.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Inativos</p>
                <p className="text-2xl font-bold text-slate-400">
                  {prestadores.filter(p => p.status === 'inactive').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filteredPrestadores.map((prestador) => (
          <Card 
            key={prestador.id} 
            className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/DetalhesPrestador?id=${prestador.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12 border-2" style={{borderColor: '#F8B137'}}>
                    <AvatarFallback style={{background: '#F8B137', color: '#14141E'}}>
                      {getInitials(prestador.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {prestador.full_name}
                      </h3>
                      <Badge variant={prestador.status === "active" ? "default" : "secondary"}>
                        {prestador.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-2">{prestador.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {prestador.company_id && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {getCompanyName(prestador.company_id)}
                        </span>
                      )}
                      {prestador.manager_id && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getManagerName(prestador.manager_id)}
                        </span>
                      )}
                      {prestador.department && (
                        <span className="flex items-center gap-1">
                          <span>•</span>
                          {prestador.department}
                        </span>
                      )}
                      {prestador.admission_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Admissão: {new Date(prestador.admission_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="icon">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPrestadores.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <UserCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum prestador encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}