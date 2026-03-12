import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * DateInput - Campo de data com auto-avanço entre DD → MM → AAAA
 * Corrige bug de reset durante digitação do ano
 */
export function DateInput({ value, onChange, disabled, className, ...props }) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Sincroniza estado interno com valor externo (formato ISO: YYYY-MM-DD)
  useEffect(() => {
    if (value && value.length === 10) {
      const [y, m, d] = value.split('-');
      setYear(y || "");
      setMonth(m || "");
      setDay(d || "");
    } else if (!value) {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  // Emite valor para o pai apenas quando a data está completa e válida
  const emitValue = (d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);
      
      // Validação básica
      if (dayNum >= 1 && dayNum <= 31 && 
          monthNum >= 1 && monthNum <= 12 && 
          yearNum >= 1900 && yearNum <= 2100) {
        const isoDate = `${y}-${m}-${d}`;
        onChange?.(isoDate);
      }
    } else if (!d && !m && !y) {
      onChange?.("");
    }
  };

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    
    // Auto-avança para mês quando DD completo
    if (val.length === 2) {
      monthRef.current?.focus();
    }
    
    emitValue(val, month, year);
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    
    // Auto-avança para ano quando MM completo
    if (val.length === 2) {
      yearRef.current?.focus();
    }
    
    emitValue(day, val, year);
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    emitValue(day, month, val);
  };

  const handleDayKeyDown = (e) => {
    if (e.key === 'Backspace' && !day) {
      // Não faz nada, já está vazio
    } else if (e.key === 'ArrowRight' && day.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleMonthKeyDown = (e) => {
    if (e.key === 'Backspace' && !month) {
      dayRef.current?.focus();
    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      dayRef.current?.focus();
    } else if (e.key === 'ArrowRight' && month.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearKeyDown = (e) => {
    if (e.key === 'Backspace' && !year) {
      monthRef.current?.focus();
    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      monthRef.current?.focus();
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        placeholder="DD"
        value={day}
        onChange={handleDayChange}
        onKeyDown={handleDayKeyDown}
        disabled={disabled}
        className="w-12 text-center px-1"
        maxLength={2}
        {...props}
      />
      <span className="text-slate-400">/</span>
      <Input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={handleMonthKeyDown}
        disabled={disabled}
        className="w-12 text-center px-1"
        maxLength={2}
      />
      <span className="text-slate-400">/</span>
      <Input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="AAAA"
        value={year}
        onChange={handleYearChange}
        onKeyDown={handleYearKeyDown}
        disabled={disabled}
        className="w-16 text-center px-1"
        maxLength={4}
      />
    </div>
  );
}