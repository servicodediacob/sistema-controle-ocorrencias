// Caminho: frontend/src/components/DestaqueDetalhadoWidget.tsx

import React, { useState, useEffect, useRef } from 'react';
import { IPlantao } from '../services/api';
import Icon from './Icon';

interface DestaqueDetalhadoWidgetProps {
  destaques: IPlantao['ocorrenciasDestaque'];
}

const DetailRow: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
  <tr>
    <td className="w-1/3 border border-gray-600 bg-blue-900/30 p-2 font-semibold">{label}</td>
    <td className="border border-gray-600 p-2" colSpan={2}>{value || 'Não informado'}</td>
  </tr>
);

const DestaqueDetalhadoWidget: React.FC<DestaqueDetalhadoWidgetProps> = ({ destaques }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev' | 'none'>('none');
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [destaques]);

  // ======================= INÍCIO DA CORREÇÃO =======================
  // 1. A função de navegação agora pode pular para um índice específico.
  const navigate = (dirOrIndex: 'next' | 'prev' | number) => {
    if (isAnimating) return;

    const newIndex = typeof dirOrIndex === 'number'
      ? dirOrIndex
      : (dirOrIndex === 'next'
        ? (currentIndex === destaques.length - 1 ? 0 : currentIndex + 1)
        : (currentIndex === 0 ? destaques.length - 1 : currentIndex - 1));

    // Determina a direção da animação para o efeito de slide
    const animationDirection = newIndex > currentIndex ? 'next' : 'prev';

    setDirection(animationDirection);
    setIsAnimating(true);
    setCurrentIndex(newIndex);

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setDirection('none');
    }, 300);
  };
  // ======================= FIM DA CORREÇÃO =======================

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    
    if (distance > minSwipeDistance) {
      navigate('next');
    } else if (distance < -minSwipeDistance) {
      navigate('prev');
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  if (!destaques || destaques.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface p-6 text-center text-text">
        <h3 className="text-lg font-semibold text-text-strong">Ocorrências Detalhadas do Dia</h3>
        <p className="mt-4">Nenhuma ocorrência detalhada registrada para hoje.</p>
      </div>
    );
  }

  const destaqueAtual = destaques[currentIndex];

  const animationClass = isAnimating 
    ? (direction === 'next' ? '-translate-x-full' : 'translate-x-full')
    : 'translate-x-0';

  return (
    <div 
      className="mt-6 overflow-hidden rounded-lg border border-red-500 bg-surface text-text-strong"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full overflow-hidden">
        <div className={`w-full transform transition-transform duration-300 ease-in-out ${animationClass}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th colSpan={3} className="relative bg-red-600 p-2 text-center font-bold uppercase text-white">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => navigate('prev')} 
                      className={`rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white ${destaques.length <= 1 ? 'invisible' : ''}`}
                      aria-label="Ocorrência anterior"
                    >
                      <Icon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" size={24} />
                    </button>
                    
                    <div className="flex flex-col items-center">
                      <span>Ocorrências Detalhadas do Dia</span>
                      {destaques.length > 1 && (
                        <span className="text-xs font-normal">
                          ({currentIndex + 1}/{destaques.length})
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate('next')} 
                      className={`rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white ${destaques.length <= 1 ? 'invisible' : ''}`}
                      aria-label="Próxima ocorrência"
                    >
                      <Icon path="M8.59 8.59L13.17 13l-4.58 4.59L10 19l6-6-6-6z" size={24} />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="w-1/3 border border-gray-600 bg-blue-900/30 p-2 font-semibold">NÚMERO DA OCORRÊNCIA</td>
                <td className="border border-gray-600 p-2" colSpan={2}>
                  <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                    <span className="col-span-1 sm:col-span-1">{destaqueAtual.numero_ocorrencia || 'Não informado'}</span>
                    <div className="col-span-1 flex items-center gap-2 border-t border-gray-700 pt-1 sm:border-t-0 sm:border-l sm:pl-2 sm:pt-0">
                      <span className="bg-gray-700 p-1 text-xs font-bold">HORÁRIO:</span>
                      <span>{destaqueAtual.horario_ocorrencia?.substring(0, 5) || '--:--'}</span>
                    </div>
                    <div className="col-span-1 flex items-center gap-2 border-t border-gray-700 pt-1 sm:border-t-0 sm:border-l sm:pl-2 sm:pt-0">
                      <span className="bg-gray-700 p-1 text-xs font-bold">DATA:</span>
                      <span>{new Date(destaqueAtual.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                  </div>
                </td>
              </tr>
              
              <DetailRow label="GRUPO DA NATUREZA" value={destaqueAtual.natureza_grupo} />
              <DetailRow label="NATUREZA" value={destaqueAtual.natureza_nome} />
              <DetailRow label="ENDEREÇO" value={destaqueAtual.endereco} />
              <DetailRow label="BAIRRO" value={destaqueAtual.bairro} />
              <DetailRow label="CIDADE" value={destaqueAtual.cidade_nome} />
              <DetailRow label="VIATURA(S)" value={destaqueAtual.viaturas} />
              <DetailRow label="VEÍCULO(S)" value={destaqueAtual.veiculos_envolvidos} />
              <DetailRow label="DADOS DA(S) VÍTIMA(S)" value={destaqueAtual.dados_vitimas} />
              <DetailRow label="RESUMO DA OCORRÊNCIA" value={destaqueAtual.resumo_ocorrencia} />
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
      {/* 2. Renderiza os indicadores de navegação se houver mais de uma ocorrência */}
      {destaques.length > 1 && (
        <div className="flex justify-center items-center gap-2 py-3 bg-surface">
          {destaques.map((_, index) => (
            <button
              key={index}
              onClick={() => navigate(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                currentIndex === index ? 'w-6 bg-teal-400' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Ir para ocorrência ${index + 1}`}
            />
          ))}
        </div>
      )}
      {/* ======================= FIM DA CORREÇÃO ======================= */}
    </div>
  );
};

export default DestaqueDetalhadoWidget;
