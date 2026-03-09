import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X, CheckCheck } from "lucide-react";

export default function GuiaGestorTrimestral({ open, onClose, onMarkAsRead, isFirstTime = false }) {
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
              <p className="text-sm font-bold text-slate-900 leading-tight">Instrumento de Avaliação de Nível de Serviço</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8 bg-slate-50">

          {/* Título principal */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              AVALIAÇÃO PERIÓDICA DE NÍVEL DE SERVIÇO
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Guia do Gestor de Contrato · Instrumento de Avaliação · Regras de Negócio
            </p>
          </div>

          {/* Seção 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#1e3a5f" }}>1</div>
              <h2 className="text-base font-black text-slate-900 uppercase">POR QUE FAZEMOS ISSO? <span className="font-normal normal-case text-slate-700">(e por que importa para 2026)</span></h2>
            </div>
            <div className="border-t-2 border-slate-200 pt-4 space-y-3">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                <p className="font-bold text-blue-900 text-sm mb-2">Governança madura começa com rotinas consistentes.</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  A partir de 2026, a Loglab Digital inicia um processo intencional de maturidade na gestão de prestadores de serviço: tornar as rotinas de acompanhamento de contratos obrigatórias até que se tornem parte genuína da nossa cultura de resultado. Isso garante nossa perenidade, reduz retrabalho e débito técnico, alinha expectativas e cria a base para parcerias de alta performance.
                </p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="font-bold text-blue-700 text-sm mb-1">Num mundo onde tecnologia é cada vez mais uma commodity...</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  ... gerir bem os prestadores de serviço será o principal diferencial competitivo da Loglab. Isso não é opcional: é inegociável para todos os gestores.
                </p>
              </div>
              <div className="pt-2">
                <p className="font-bold text-slate-800 text-sm mb-3">A avaliação periódica de nível de serviço existe para três objetivos concretos:</p>
                <div className="space-y-2">
                  {[
                    "Dar ao prestador uma visão clara sobre suas entregas, com direcionamento e apoio concreto para o desenvolvimento dos pontos de melhoria identificados.",
                    "Dar ao gestor e à área responsável dados estruturados para tomada de decisões — renovação, reposicionamento, capacitação ou encerramento de contrato.",
                    "Dar à empresa um termômetro real da qualidade dos serviços contratados, antes que problemas silenciosos virem crises.",
                  ].map((text, i) => (
                    <div key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-slate-400 flex-shrink-0 font-bold">→</span>
                      <span className="leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#1e3a5f" }}>2</div>
              <h2 className="text-base font-black text-slate-900 uppercase">ANTES DE AVALIAR: PREPARE-SE <span className="font-normal normal-case text-slate-700">(15 min que valem o trimestre)</span></h2>
            </div>
            <div className="border-t-2 border-slate-200 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coluna Verde */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-1">
                    <span className="text-green-600">✓</span> REVISE antes de preencher
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Histórico de 1:1s e avaliações do trimestre",
                      "KPIs e metas acordadas no início do período",
                      "Incidents, PRs, entregas, bugs, elogios de cliente",
                      "Situações marcantes (positivas e negativas)",
                    ].map((item, i) => (
                      <li key={i} className="text-sm text-slate-700 flex gap-2">
                        <span className="text-slate-400 flex-shrink-0">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Coluna Vermelha */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-bold text-red-700 text-sm mb-3 flex items-center gap-1">
                    <span className="text-red-500">✕</span> EVITE estes vieses
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Efeito halo: um acerto recente que inflaciona tudo",
                      "Efeito recência: avaliar só as últimas semanas",
                      "Tendência central: colocar 3 em tudo sem pensar",
                      "Avaliação por impressão, não por fatos observáveis",
                    ].map((item, i) => (
                      <li key={i} className="text-sm text-slate-700 flex gap-2">
                        <span className="text-slate-400 flex-shrink-0">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#1e3a5f" }}>3</div>
              <h2 className="text-base font-black text-slate-900 uppercase">COMO LER A ESCALA</h2>
            </div>
            <div className="border-t-2 border-slate-200 pt-4">
              <table className="w-full text-sm border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr style={{ background: "#1e3a5f" }}>
                    <th className="text-white text-center font-bold py-2.5 px-3 w-14">Nota</th>
                    <th className="text-white text-left font-bold py-2.5 px-3 w-32">Rótulo</th>
                    <th className="text-white text-left font-bold py-2.5 px-3">O que significa na prática</th>
                    <th className="text-white text-left font-bold py-2.5 px-3 w-36">Ação do Gestor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-red-50 border-b border-red-100">
                    <td className="text-center font-black text-2xl text-red-600 py-3 px-3">1</td>
                    <td className="font-bold text-red-600 py-3 px-3">Crítico</td>
                    <td className="text-slate-700 py-3 px-3 leading-relaxed">Nível de serviço muito abaixo do contratado. Erros recorrentes, ausência de entregas ou comportamento que impacta negativamente a operação.</td>
                    <td className="font-bold text-red-600 py-3 px-3 text-xs leading-snug">Plano de melhoria (PIP) imediato</td>
                  </tr>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <td className="text-center font-black text-2xl text-amber-600 py-3 px-3">2</td>
                    <td className="font-bold text-amber-600 py-3 px-3 leading-snug">Em Desenvolvimento</td>
                    <td className="text-slate-700 py-3 px-3 leading-relaxed">Entrega abaixo do padrão contratado. Há esforço, mas resultado ainda inconsistente. Precisa de suporte ativo.</td>
                    <td className="font-bold text-amber-600 py-3 px-3 text-xs leading-snug">Plano de ação com acompanhamento próximo</td>
                  </tr>
                  <tr className="bg-green-50 border-b border-green-100">
                    <td className="text-center font-black text-2xl text-green-600 py-3 px-3">3</td>
                    <td className="font-bold text-green-600 py-3 px-3 leading-snug">Entrega o Esperado</td>
                    <td className="text-slate-700 py-3 px-3 leading-relaxed">Nível de serviço consistente dentro dos padrões acordados. É o padrão mínimo aceitável para o prestador.</td>
                    <td className="font-bold text-green-600 py-3 px-3 text-xs leading-snug">Manter e identificar oportunidade de evolução</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="text-center font-black text-2xl text-blue-700 py-3 px-3">4</td>
                    <td className="font-bold text-blue-700 py-3 px-3 leading-snug">Referência / Supera</td>
                    <td className="text-slate-700 py-3 px-3 leading-relaxed">Consistentemente supera os padrões acordados. Gera impacto além do escopo contratado. Deve ser exceção, não regra.</td>
                    <td className="font-bold text-blue-700 py-3 px-3 text-xs leading-snug">Reconhecer, desafiar com escopo ampliado e renovação estratégica</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-4">
                <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="text-amber-600">■</span> A nota 3 não é 'mediocre' — é a entrega esperada.
                </p>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                  A nota 4 deve ser reservada para quem genuinamente superou o acordado no trimestre. Se você está colocando 4 em todo mundo, ou ninguém está entregando 4 — ambos são sinais de que a régua precisa ser recalibrada.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#1e3a5f" }}>4</div>
              <h2 className="text-base font-black text-slate-900 uppercase">COMO CONDUZIR O FEEDBACK</h2>
            </div>
            <div className="border-t-2 border-slate-200 pt-4">
              <table className="w-full text-sm border-collapse rounded-lg overflow-hidden">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="font-black text-white text-xs py-4 px-4 text-center align-top w-20" style={{ background: "#1e3a5f" }}>ANTES</td>
                    <td className="py-4 px-4 text-slate-700 leading-relaxed bg-white">
                      Preencha o instrumento com calma antes da reunião. Compartilhe a pauta com o prestador — ele não deve ser surpreendido. Reserve 45–60 min em local reservado.
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="font-black text-white text-xs py-4 px-4 text-center align-top" style={{ background: "#2d6a7a" }}>DURANTE</td>
                    <td className="py-4 px-4 text-slate-700 leading-relaxed bg-white">
                      Conduza uma conversa honesta, educada e empática — mas que transmita a mensagem correta e de forma clara. Evite o modelo 'sanduíche' (elogio → crítica → elogio), que dilui a mensagem e confunde o prestador. A mensagem precisa chegar com clareza:<br />
                      <span className="block mt-2 text-slate-600">→ "Você está mandando muito bem — continue assim, quero te desafiar ainda mais."</span>
                      <span className="block mt-1 text-slate-600">→ "Você entrega o esperado, mas temos pontos de desenvolvimento importantes para trabalharmos juntos."</span>
                      <span className="block mt-1 text-slate-600">→ "Suas entregas não têm atendido os padrões do contrato. Se não houver melhora, a continuidade do contrato pode estar em risco."</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-black text-white text-xs py-4 px-4 text-center align-top" style={{ background: "#1a5c4a" }}>DEPOIS</td>
                    <td className="py-4 px-4 text-slate-700 leading-relaxed bg-white">
                      Saia da reunião com o Plano de Ação (2 a 3 ações práticas) preenchido e acordado entre as partes. Registre na plataforma interna. Acompanhe a realização e a evolução ao longo do próximo trimestre — não espere a próxima avaliação para retomar o assunto.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Footer fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white gap-3 flex-shrink-0">
          {isFirstTime ? (
            <>
              <p className="text-xs text-slate-500">Leia com atenção antes de iniciar a avaliação.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="text-sm">
                  Fechar
                </Button>
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
              <Button
                onClick={onClose}
                className="text-sm font-bold"
                style={{ background: "#F8B137", color: "#14141E" }}
              >
                Fechar Guia
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}