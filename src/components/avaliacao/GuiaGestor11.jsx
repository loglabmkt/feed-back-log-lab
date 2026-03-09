import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X, CheckCheck, Calendar, Clock, MapPin, MessageCircle, ClipboardCheck, Lock } from "lucide-react";

export default function GuiaGestor11({ open, onClose, onMarkAsRead, isFirstTime = false }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F8B137" }}>
              <BookOpen className="w-4 h-4" style={{ color: "#14141E" }} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Guia do Gestor</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">Registro de 1:1 — Conversa de Alinhamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8 bg-slate-50">

          {/* Título principal */}
          <div className="text-center rounded-xl overflow-hidden" style={{ background: "#1e3a5f" }}>
            <div className="px-6 py-5">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                GUIA DE CONVERSAS 1:1
              </h1>
              <p className="text-base font-black mt-1" style={{ color: "#2dd4bf" }}>
                MANUAL DO CONTRATANTE
              </p>
              <p className="text-sm text-slate-300 mt-1">
                Rotinas de Gestão Contratual — 2026/27
              </p>
            </div>
          </div>

          {/* Seção A */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>A</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">O que é o 1:1 e por que não é Avaliação de Qualidade de Serviço?</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Muitos contratantes erram ao transformar o 1:1 em uma mini-avaliação de serviço. Na Log Lab, o 1:1 é um
                espaço de conexão e remoção de barreiras à boa execução contratual.
              </p>

              {/* Tabela comparativa */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#1e3a5f" }}>
                      <th className="text-left px-4 py-3 text-white font-bold">Característica</th>
                      <th className="text-left px-4 py-3 text-white font-bold">1:1 (Conversa de Alinhamento)</th>
                      <th className="text-left px-4 py-3 font-bold" style={{ color: "#F8B137" }}>Avaliação de Qualidade de Serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { char: "Foco", one: "O prestador (contexto e desenvolvimento)", eval: "O serviço (resultados e qualidade das entregas)" },
                      { char: "Direção", one: "O prestador fala 80% do tempo", eval: "O contratante traz insumos e análises" },
                      { char: "Objetivo", one: "Estreitar confiança e identificar impedimentos à boa execução", eval: "Alinhar rota e reconhecer avanços técnicos" },
                      { char: "Periodicidade", one: "Frequente e orientativo (Bimestral)", eval: "Ciclos definidos (45/90 dias ou ksemestral)" },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-4 py-3 font-semibold text-slate-800 border-b border-slate-100">{row.char}</td>
                        <td className="px-4 py-3 text-slate-700 border-b border-slate-100">{row.one}</td>
                        <td className="px-4 py-3 text-slate-700 border-b border-slate-100" style={{ background: "rgba(248,177,55,0.05)" }}>{row.eval}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Seção B */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>B</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">Cardápio de Perguntas por Tema de Investigação</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Não use todas. Escolha o tema da conversa baseado no que você tem observado na execução dos serviços.
                Essas são perguntas orientativas — adapte conforme o contexto.
              </p>

              {/* Tema 1 */}
              <div>
                <div className="px-4 py-2.5 rounded-lg mb-3" style={{ background: "#1e3a5f" }}>
                  <p className="text-xs font-black text-white uppercase tracking-wide">1. Investigação de Queda na Qualidade de Entrega</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">Para quando o prestador era consistente e começou a apresentar oscilações ou menor qualidade nos resultados:</p>
                <div className="space-y-2">
                  {[
                    '"Como está sua energia e foco para execução dos serviços ultimamente?"',
                    '"Tem algo no seu contexto atual que está dificultando sua concentração nas entregas?"',
                    '"Se eu pudesse remover um obstáculo seu hoje para melhorar suas entregas, qual seria?"',
                  ].map((q, i) => (
                    <div key={i} className="border-l-4 border-slate-300 pl-4 py-2 bg-slate-50 rounded-r-lg">
                      <p className="text-sm text-slate-700 italic">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tema 2 */}
              <div>
                <div className="px-4 py-2.5 rounded-lg mb-3" style={{ background: "#1e3a5f" }}>
                  <p className="text-xs font-black text-white uppercase tracking-wide">2. Investigação de Engajamento e Desenvolvimento</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">Para entender se o prestador está sendo bem aproveitado em seu potencial ou planeja encerrar a parceria:</p>
                <div className="space-y-2">
                  {[
                    '"O que você tem estudado ou aprendido fora da Log Lab que poderia agregar ao projeto?"',
                    '"Qual parte do escopo atual parece um \'fardo\' e qual parece um \'desafio motivador\'?"',
                    '"Onde você sente que seus talentos não estão sendo utilizados no projeto?"',
                  ].map((q, i) => (
                    <div key={i} className="border-l-4 border-slate-300 pl-4 py-2 bg-slate-50 rounded-r-lg">
                      <p className="text-sm text-slate-700 italic">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tema 3 */}
              <div>
                <div className="px-4 py-2.5 rounded-lg mb-3" style={{ background: "#1e3a5f" }}>
                  <p className="text-xs font-black text-white uppercase tracking-wide">3. Investigação de Obstáculos Operacionais</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">Foco direto em produtividade e remoção de impedimentos à boa execução:</p>
                <div className="space-y-2">
                  {[
                    '"O que te impediu de ter uma semana de entregas 10/10?"',
                    '"Existe algum processo ou comunicação na nossa equipe que está travando sua execução hoje?"',
                    '"Se você fosse o contratante por 90 dias, o que você mudaria logo na primeira semana e por quê?"',
                  ].map((q, i) => (
                    <div key={i} className="border-l-4 border-slate-300 pl-4 py-2 bg-slate-50 rounded-r-lg">
                      <p className="text-sm text-slate-700 italic">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Seção C */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>C</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">Ritual e Operação — O Como Fazer</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                Para garantir a meta de 100% de execução, o ritual deve ser enxuto e sem fricção.
              </p>
              <div className="space-y-2">
                {[
                  {
                    icon: <Calendar className="w-5 h-5 text-white" />,
                    title: "Agendamento",
                    desc: "Deve partir do contratante via calendário.",
                  },
                  {
                    icon: <Clock className="w-5 h-5 text-white" />,
                    title: "Duração",
                    desc: "15 minutos cronometrados. Por que pouco tempo? Para evitar que se torne uma sessão de terapia ou reunião de projeto. O foco é a análise de impedimentos e orientado à execução.",
                  },
                  {
                    icon: <MapPin className="w-5 h-5 text-white" />,
                    title: "Local",
                    desc: "Se presencial em local reservado e alinhado entre ambas as partes. Se remoto, câmera ligada.",
                  },
                  {
                    icon: <MessageCircle className="w-5 h-5 text-white" />,
                    title: "Início da conversa",
                    desc: 'Comece sempre com uma pergunta aberta: "Bom dia! Além das entregas em andamento, como você está?" Crie uns segundos iniciais de rapport genuíno.',
                  },
                  {
                    icon: <ClipboardCheck className="w-5 h-5 text-white" />,
                    title: "Registro na plataforma",
                    desc: "Após o 1:1, o contratante registra a realização e os pontos levantados. Essas informações não aparecerão para o prestador. Se houver impedimento crítico à execução, registrar como 'impedimento' para acompanhamento ou sinalizar à gestão.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 border border-slate-100 rounded-xl bg-white">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#2d9a8a" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* LGPD */}
          <div className="rounded-xl border-2 border-teal-300 bg-teal-50 px-5 py-4">
            <p className="text-xs font-black text-teal-800 uppercase mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              LGPD — Proteção de Dados:
            </p>
            <p className="text-xs text-teal-700 leading-relaxed">
              As informações registradas neste instrumento têm caráter confidencial e de uso exclusivo da gestão contratual interna. O registro de impedimentos ou contextos pessoais do prestador deve obedecer à Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), sendo vedado o compartilhamento não autorizado dessas informações. Recomenda-se que os dados coletados sejam utilizados exclusivamente para fins de gestão da qualidade da prestação de serviços.
            </p>
          </div>

          {/* Rodapé do documento */}
          <p className="text-center text-xs text-slate-400">
            Log Lab Digital — Instrumento de Gestão Contratual | Uso interno restrito
          </p>
        </div>

        {/* Footer fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white gap-3 flex-shrink-0">
          {isFirstTime ? (
            <>
              <p className="text-xs text-slate-500">Leia com atenção antes de iniciar o registro.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="text-sm">Fechar</Button>
                <Button
                  onClick={onMarkAsRead}
                  className="text-sm font-bold gap-2"
                  style={{ background: "#F8B137", color: "#14141E" }}
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar como lido
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <Button onClick={onClose} className="text-sm font-bold" style={{ background: "#F8B137", color: "#14141E" }}>
                Fechar Guia
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}