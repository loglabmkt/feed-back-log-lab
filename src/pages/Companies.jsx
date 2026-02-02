import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj: "",
    email_principal: "",
    status: "active"
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await base44.entities.Company.list();
      setCompanies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 14);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      razao_social: company.razao_social,
      cnpj: company.cnpj,
      email_principal: company.email_principal,
      status: company.status
    });
    setShowDialog(true);
  };

  const handleNew = () => {
    setEditingCompany(null);
    setFormData({
      razao_social: "",
      cnpj: "",
      email_principal: "",
      status: "active"
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    if (!formData.razao_social || !formData.cnpj || !formData.email_principal) {
      setError("Todos os campos obrigatórios devem ser preenchidos");
      setSaving(false);
      return;
    }

    const cnpjExists = companies.some(c => 
      c.cnpj === formData.cnpj && c.id !== editingCompany?.id
    );
    if (cnpjExists) {
      setError("CNPJ já cadastrado");
      setSaving(false);
      return;
    }

    try {
      if (editingCompany) {
        await base44.entities.Company.update(editingCompany.id, formData);
      } else {
        await base44.entities.Company.create(formData);
      }
      await loadCompanies();
      setShowDialog(false);
    } catch (e) {
      setError(e.message || "Erro ao salvar empresa");
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm)
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
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-slate-500">Gerencie as empresas cadastradas</p>
        </div>
        <Button onClick={handleNew} style={{background: '#F8B137', color: '#14141E'}}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por razão social ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background: '#F8B137'}}>
                    <Building2 className="w-6 h-6" style={{color: '#14141E'}} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{company.razao_social}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span>CNPJ: {company.cnpj}</span>
                      <span>•</span>
                      <span>{company.email_principal}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline"
                    className={company.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                    }
                  >
                    {company.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCompanies.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhuma empresa encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar' : 'Nova'} Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Razão Social *</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                placeholder="00000000000000"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Principal *</Label>
              <Input
                type="email"
                value={formData.email_principal}
                onChange={(e) => setFormData({...formData, email_principal: e.target.value})}
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                </SelectContent>
              </Select>
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