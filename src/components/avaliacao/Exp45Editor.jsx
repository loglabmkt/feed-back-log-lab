import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const DEFAULT_ITEMS = [
  { id: "e1",  label: "1 – Assimilação / Rapidez",       description: "Velocidade de aprendizado das rotinas, processos e ferramentas da função" },
  { id: "e2",  label: "2 – Cooperação",                   description: "Disposição para colaborar com colegas, líderes e demais áreas" },
  { id: "e3",  label: "3 – Empenho / Entusiasmo",         description: "Motivação e energia aplicadas nas atividades do dia a dia" },
  { id: "e4",  label: "4 – Qualidade",                    description: "Padrão de qualidade das entregas e atenção aos detalhes" },
  { id: "e5",  label: "5 – Articulação / Equipe",         description: "Capacidade de se integrar e comunicar bem dentro da equipe" },
  { id: "e6",  label: "6 – Superação de Obstáculos",      description: "Resiliência e criatividade diante de dificuldades e imprevistos" },
  { id: "e7",  label: "7 – Conclusividade",               description: "Capacidade de concluir tarefas e entregar resultados completos" },
  { id: "e8",  label: "8 – Agregação de Valor",           description: "Contribuição efetiva para o time além do escopo básico da função" },
  { id: "e9",  label: "9 – Conhecimento Técnico",         description: "Domínio técnico exigido para a função no período de experiência" },
  { id: "e10", label: "10 – Geração de Soluções",         description: "Proatividade na identificação e proposição de soluções práticas" },
  { id: "e11", label: "11 – Organização / Gestão",        description: "Organização do trabalho, priorização e gestão do próprio tempo" },
  { id: "e12", label: "12 – Auto-motivação",              description: "Iniciativa e autonomia sem necessidade de supervisão constante" },
  { id: "e13", label: "13 – Pontualidade / Compromissos", description: "Cumprimento de horários, prazos e compromissos assumidos" },
];

export default function Exp45Editor({ template, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(template.title || "Avaliação de Experiência – 45 Dias");
  const [isActive, setIsActive] = useState(template.is_active ?? true);
  const [items, setItems] = useState(template.exp45_items_config?.length === 13 ? template.exp45_items_config : DEFAULT_ITEMS);

  const updateItem = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Configurações da Avaliação de Experiência 45 Dias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Status do Template</p>
              <p className="text-sm text-slate-500">{isActive ? 'Visível para gestores' : 'Oculto para gestores'}</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-800 mb-1">Escala: 4 / 3 / 2 / 1 / NO · 13 itens fixos</p>
            <p className="text-xs text-amber-700">Edite os rótulos e descrições de cada item. A escala e o motor de cálculo são fixos.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{background: "#F8B137", color: "#14141E"}}>13</div>
            <CardTitle className="text-base">Itens de Avaliação (13 itens)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono font-bold text-xs">{item.id.toUpperCase()}</Badge>
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                  className="font-semibold"
                  placeholder="Rótulo do item..."
                />
              </div>
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                placeholder="Descrição do item..."
                className="text-sm resize-none min-h-[60px]"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          onClick={() => onSave({ title, is_active: isActive, exp45_items_config: items })}
          disabled={saving}
          style={{background: '#F8B137', color: '#14141E'}}
          className="font-semibold"
        >
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}