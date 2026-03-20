import React, { useState } from "react";
import { useSecurityGuard } from "@/hooks/useSecurityGuard";
import { base44 } from "@/api/base44Client";
import { Shield, Mail, Lock, Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GestorCadastro() {
  // step 1: verificar email | step 2: inserir código | step 3: criar senha
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [gestorData, setGestorData] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 1: Verificar e-mail + enviar código
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke('sendGestorVerificationCode', { email });

      if (response.data.success) {
        setGestorData(response.data.gestor);
        setStep(2);
        startResendCooldown();
      } else {
        setError(response.data.error || "Erro ao verificar email.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao verificar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await base44.functions.invoke('sendGestorVerificationCode', { email });
      startResendCooldown();
      setCode("");
    } catch (err) {
      setError("Erro ao reenviar código.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Digite os 6 dígitos do código enviado por email.");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('verifyGestorCode', {
        gestor_id: gestorData.id,
        code
      });

      if (response.data.success) {
        setStep(3);
      } else {
        setError(response.data.error || "Código inválido.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Criar senha
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
      await base44.functions.invoke('createGestorPassword', {
        gestor_id: gestorData.id,
        password
      });

      localStorage.setItem('gestor_session', JSON.stringify({
        id: gestorData.id,
        email: gestorData.email,
        full_name: gestorData.full_name
      }));

      window.location.href = '/painelgestor';
    } catch (err) {
      setError("Erro ao criar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Verificar E-mail", "Confirmar Código", "Criar Senha"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #14141E 0%, #1a1a2e 100%)'}}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{background: '#F8B137'}}>
              <Shield className="w-8 h-8" style={{color: '#14141E'}} />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Cadastro de Gestor</CardTitle>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {stepLabels.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > i + 1 ? 'text-white' : step === i + 1 ? 'text-white' : 'bg-slate-200 text-slate-400'
                  }`} style={step >= i + 1 ? {background: '#F8B137', color: '#14141E'} : {}}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${step === i + 1 ? 'text-slate-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`h-0.5 w-8 mb-4 rounded ${step > i + 1 ? '' : 'bg-slate-200'}`} style={step > i + 1 ? {background: '#F8B137'} : {}} />}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* STEP 1 – E-mail */}
          {step === 1 && (
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
                  Use o email cadastrado no sistema pela sua empresa. Enviaremos um código de verificação.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                style={{background: '#F8B137', color: '#14141E'}}
              >
                {loading ? "Verificando..." : "Enviar Código de Verificação"}
              </Button>

              <div className="text-center">
                <a href="/gestorlogin" className="text-sm text-slate-500 hover:underline">
                  Já tem cadastro? Fazer login
                </a>
              </div>
            </form>
          )}

          {/* STEP 2 – Código */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Código enviado para:
                </p>
                <p className="text-sm text-blue-600 mt-1 font-mono">{gestorData?.email}</p>
                <p className="text-xs text-blue-500 mt-1">Verifique também sua pasta de spam. O código expira em 10 minutos.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-[0.5em] py-6"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                style={{background: '#F8B137', color: '#14141E'}}
              >
                {loading ? "Verificando..." : "Confirmar Código"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-slate-500 hover:underline flex items-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 – Senha */}
          {step === 3 && (
            <form onSubmit={handleCreatePassword} className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p className="text-sm text-green-800 font-medium">✅ Identidade verificada com sucesso!</p>
                <p className="text-sm text-green-600 mt-1">Olá, <strong>{gestorData?.full_name}</strong>. Agora crie sua senha.</p>
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