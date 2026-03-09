import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X, CheckCheck } from "lucide-react";

export default function GuiaGestor45Dias({ open, onClose, onMarkAsRead, isFirstTime = false }) {
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
              <p className="text-sm font-bold text-slate-900 leading-tight">Avaliação de Qualidade de Serviço — 45 Dias</p>
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
                AVALIAÇÃO DE QUALIDADE DE SERVIÇO
              </h1>
              <p className="text-base font-black mt-1" style={{ color: "#2dd4bf" }}>
                PERÍODO INICIAL — 45 DIAS
              </p>
              <p className="text-sm text-slate-300 mt-1">
                Instrumento de Acompanhamento da Prestação de Serviços
              </p>
            </div>
          </div>

          {/* Seção 1 */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>1</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">Finalidade do Instrumento</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                Este instrumento acompanha a qualidade da entrega inicial dos serviços, identificando pontos fortes e oportunidades de melhoria ainda no início do contrato.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                A Avaliação de Qualidade (45 dias) é um instrumento de gestão contratual para:
              </p>
              <ul className="space-y-1.5">
                {[
                  { verb: "Monitorar", rest: "a integração operacional do prestador ao projeto" },
                  { verb: "Avaliar", rest: "o nível de assimilação do escopo contratado" },
                  { verb: "Identificar", rest: "dificuldades iniciais na execução dos serviços" },
                  { verb: "Corrigir", rest: "desvios de forma preventiva, preservando a qualidade das entregas" },
                  { verb: "Apoiar", rest: "o desenvolvimento técnico durante o período de adaptação" },
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0">►</span>
                    <span><u className="font-semibold">{item.verb}</u> {item.rest}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600 italic leading-relaxed">
                Este instrumento tem caráter preventivo e orientador, sendo aplicado no contexto da gestão de qualidade da prestação de serviços.
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>2</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">Quando Aplicar</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Este instrumento deve ser utilizado aproximadamente na metade do período inicial de contratação (45 dias). Seu objetivo é permitir alinhamentos antes da avaliação conclusiva de 90 dias, garantindo que o prestador compreenda as expectativas de qualidade e entrega.
              </p>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>3</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">Como Utilizar a Escala de Qualidade</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4 space-y-4">
              <p className="text-sm text-slate-700">
                O instrumento consiste de 13 critérios de avaliação de qualidade de serviço, pontuados de 1 a 4:
              </p>

              {/* Escala visual */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-sm font-bold">
                <div className="rounded-lg py-3 px-2 bg-red-100 border border-red-200">
                  <p className="text-xl font-black text-red-600">1</p>
                  <p className="text-xs text-red-600 font-semibold mt-0.5">Crítico</p>
                </div>
                <div className="rounded-lg py-3 px-2 bg-amber-100 border border-amber-200">
                  <p className="text-xl font-black text-amber-600">2</p>
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">Em desenvolvimento</p>
                </div>
                <div className="rounded-lg py-3 px-2 bg-green-100 border border-green-200">
                  <p className="text-xl font-black text-green-600">3</p>
                  <p className="text-xs text-green-600 font-semibold mt-0.5">Entrega o esperado</p>
                </div>
                <div className="rounded-lg py-3 px-2 bg-blue-100 border border-blue-200">
                  <p className="text-xl font-black text-blue-600">4</p>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">Referência / Supera</p>
                </div>
                <div className="rounded-lg py-3 px-2 bg-slate-100 border border-slate-200">
                  <p className="text-xl font-black text-slate-500">NO</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Não Observado</p>
                </div>
              </div>

              {/* Evite */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="font-bold text-red-600 text-sm mb-2">EVITE:</p>
                <ul className="space-y-1.5">
                  {[
                    "Marcar todos os critérios como 3 sem análise crítica das entregas",
                    "Utilizar a nota baseada em afinidade pessoal ou subjetividade",
                    "Avaliar com base em um único episódio isolado",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-red-500 flex-shrink-0 font-bold">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <div className="flex items-center gap-0 mb-0 rounded-lg overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: "#2d6a7a" }}>4</div>
              <div className="flex-1 px-4 py-2.5" style={{ background: "#2d6a7a" }}>
                <h2 className="text-sm font-black text-white">Responsabilidade da Contratante Antes de Aplicar</h2>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-b-lg px-5 py-4 space-y-3">
              <p className="text-sm text-slate-700">Antes de preencher, verifique:</p>
              <ul className="space-y-2">
                {[
                  "O prestador recebeu orientação adequada sobre o escopo dos serviços?",
                  "As atividades e entregas esperadas foram explicadas com clareza?",
                  "Houve acompanhamento nas primeiras semanas de execução?",
                  "O prestador teve espaço para esclarecer dúvidas sobre o projeto?",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-green-600 flex-shrink-0 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">
                Este instrumento também reflete a qualidade do alinhamento inicial conduzido pela gestão. Prestadores bem orientados entregam melhores resultados.
              </p>
            </div>
          </section>

        </div>

        {/* Footer fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white gap-3 flex-shrink-0">
          {isFirstTime ? (
            <>
              <p className="text-xs text-slate-500">Leia com atenção antes de iniciar a avaliação.</p>
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