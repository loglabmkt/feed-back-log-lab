import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ColaboradorCadastro() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [colaboradorData, setColaboradorData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke('checkColaboradorEmail', { email });
      
      if (response.data.found) {
        setColaboradorData(response.data.colaborador);
        setStep(2);
      } else {
        setError("Email não encontrado no sistema. Entre em contato com o RH.");
      }
    } catch (err) {
      setError("Erro ao verificar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      await base44.functions.invoke('createColaboradorPassword', {
        colaborador_id: colaboradorData.id,
        password
      });

      localStorage.setItem('colaborador_session', JSON.stringify({
        id: colaboradorData.id,
        email: colaboradorData.email,
        full_name: colaboradorData.full_name
      }));

      window.location.href = '/colaborador';
    } catch (err) {
      setError("Erro ao criar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #14141E 0%, #1a1a2e 100%)'}}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{background: '#F8B137'}}>
              <Shield className="w-8 h-8" style={{color: '#14141E'}} />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Cadastro de Colaborador</CardTitle>
          <p className="text-center text-slate-500 text-sm">
            {step === 1 ? 'Primeiro, vamos verificar seu email' : 'Agora, crie sua senha de acesso'}
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 ? (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Use o email cadastrado no sistema pela sua empresa
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                style={{background: '#F8B137', color: '#14141E'}}
              >
                {loading ? "Verificando..." : "Continuar"}
              </Button>

              <div className="text-center">
                <a href="/colaboradorlogin" className="text-sm text-slate-500 hover:underline">
                  Já tem cadastro? Fazer login
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreatePassword} className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p className="text-sm text-green-800 font-medium">
                  Email verificado com sucesso!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Olá, <strong>{colaboradorData.full_name}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Criar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                style={{background: '#F8B137', color: '#14141E'}}
              >
                {loading ? "Criando conta..." : "Criar Conta e Acessar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}