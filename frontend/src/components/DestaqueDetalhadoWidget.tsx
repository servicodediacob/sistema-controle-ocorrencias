import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IPlantao } from '../services/api';
import Icon from './Icon';

interface DestaqueDetalhadoWidgetProps {
  destaques: IPlantao['ocorrenciasDestaque'];
}

const DetailRow: React.FC<{ label: string; value: string | number | null | undefined }> = ({
  label,
  value,
}) => (
  <tr>
    <td className="w-1/3 border border-gray-600 bg-blue-900/30 p-2 font-semibold">{label}</td>
    <td className="border border-gray-600 p-2" colSpan={2}>
      {value || 'Não informado'}
    </td>
  </tr>
);

const DestaqueDetalhadoWidget: React.FC<DestaqueDetalhadoWidgetProps> = ({ destaques }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [destaques]);

  const fadeDuration = 300;

  const navigate = useCallback(
    (dirOrIndex: 'next' | 'prev' | number) => {
      if (!destaques || destaques.length === 0 || isAnimating) return;

      const targetIndex = typeof dirOrIndex === 'number'
        ? dirOrIndex
        : dirOrIndex === 'next'
          ? currentIndex === destaques.length - 1
            ? 0
            : currentIndex + 1
          : currentIndex === 0
            ? destaques.length - 1
            : currentIndex - 1;

      if (targetIndex === currentIndex) return;

      setIsAnimating(true);
      setIsVisible(false);

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        setCurrentIndex(targetIndex);
        setIsVisible(true);

        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }

        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, fadeDuration);
      }, fadeDuration);
    },
    [currentIndex, destaques, isAnimating, fadeDuration],
  );

  useEffect(() => {
    if (!destaques || destaques.length <= 1) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate('prev');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [destaques, navigate]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = event.targetTouches[0].clientX;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    touchEndRef.current = event.targetTouches[0].clientX;
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
  const hasMultiple = destaques.length > 1;

  const formatarHorario = (valor?: string | null) => {
    if (!valor) return '--:--';

    const parsed = new Date(valor);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    const match = valor.match(/(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }

    return valor.slice(0, 5);
  };

  const fadeClass = isVisible ? 'opacity-100' : 'opacity-0';

  return (
    <div
      className="mt-6 overflow-hidden rounded-lg border border-red-500 bg-surface text-text-strong"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full overflow-hidden">
        <div className={`w-full transition-opacity duration-300 ease-in-out ${fadeClass}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th colSpan={3} className="relative bg-red-600 p-2 text-center font-bold uppercase text-white">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => navigate('prev')}
                      className={`rounded-full border border-white/40 bg-white/15 p-2 text-white shadow-md transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60 ${hasMultiple ? '' : 'pointer-events-none opacity-0'}`}
                      aria-label="Ocorrência anterior"
                    >
                      <Icon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" size={18} />
                    </button>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span>Ocorrências Detalhadas do Dia</span>
                      {hasMultiple && (
                        <span className="text-xs font-normal">
                          ({currentIndex + 1}/{destaques.length})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('next')}
                      className={`rounded-full border border-white/40 bg-white/15 p-2 text-white shadow-md transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60 ${hasMultiple ? '' : 'pointer-events-none opacity-0'}`}
                      aria-label="Próxima ocorrência"
                    >
                      <Icon path="M8.59 8.59L13.17 13l-4.58 4.59L10 19l6-6-6-6z" size={18} />
                    </button>
                  </div>
                  {hasMultiple && (
                    <div className="mt-1 text-xs font-medium text-white/80">
                      Use as setas ou deslize para navegar
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="w-1/3 border border-gray-600 bg-blue-900/30 p-2 font-semibold">NÚMERO DA OCORRÊNCIA</td>
                <td className="border border-gray-600 p-2" colSpan={2}>
                  <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                    <span className="col-span-1 sm:col-span-1">
                      {destaqueAtual.numero_ocorrencia || 'Não informado'}
                    </span>
                    <div className="col-span-1 flex items-center gap-2 border-t border-gray-700 pt-1 sm:border-t-0 sm:border-l sm:pl-2 sm:pt-0">
                      <span className="bg-gray-700 p-1 text-xs font-bold">HORÁRIO:</span>
                      <span>{formatarHorario(destaqueAtual.horario_ocorrencia)}</span>
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

      {hasMultiple && (
        <div className="flex items-center justify-center gap-2 bg-surface py-3">
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
    </div>
  );
};

export default DestaqueDetalhadoWidget;
