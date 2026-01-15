import { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { PlusCircle, XCircle } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { sisgpoApi } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';

interface MilitarOption {
  value: number;
  label: string;
}

interface Plantonista {
  militar_id: number | null;
  ordem: number;
  label?: string | null;
}

export interface EscalaCodecPayload {
  data: string;
  diurno: Plantonista[];
  noturno: Plantonista[];
}

interface EscalaCodecFormProps {
  isSaving: boolean;
  onSave: (payload: EscalaCodecPayload) => void;
  onCancel: () => void;
}

export const EscalaCodecForm = ({ isSaving, onSave, onCancel }: EscalaCodecFormProps) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<EscalaCodecPayload>({
    data: new Date().toISOString().split('T')[0],
    diurno: [{ militar_id: null, ordem: 1 }],
    noturno: [{ militar_id: null, ordem: 1 }],
  });

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#2D3748',
      borderColor: '#4A5568',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#2D3748',
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#F7FAFC',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#A0AEC0',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#F7FAFC',
    }),
    option: (provided: any, state: { isFocused: any; }) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#4A5568' : '#2D3748',
      color: '#F7FAFC',
    }),
  };

  const loadMilitares = async (inputValue: string): Promise<MilitarOption[]> => {
    if (!inputValue || inputValue.trim().length < 2) {
      return [];
    }
    try {
      const result = await sisgpoApi.get<MilitarOption[]>('/admin/militares/search', {
        term: inputValue.trim(),
      });
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  };

  const updateTurno = (
    turno: 'diurno' | 'noturno',
    updater: (lista: Plantonista[]) => Plantonista[]
  ) => {
    setFormData((prev) => ({ ...prev, [turno]: updater(prev[turno]) }));
  };

  const handleSubmit = () => {
    const valido = [...formData.diurno, ...formData.noturno].every(
      (p) => p.militar_id !== null
    );
    if (!valido) {
      addNotification('Todos os plantonistas precisam ser selecionados.', 'error');
      return;
    }
    onSave(formData);
  };

  const renderTurno = (turno: 'diurno' | 'noturno', titulo: string) => (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-text-strong">{titulo}</h4>
        <Button
          type="button"
          variant="primary"
          className="flex items-center gap-2 px-3 py-1 text-xs"
          onClick={() =>
            updateTurno(turno, (lista) => [
              ...lista,
                      { militar_id: null, ordem: lista.length + 1 },
            ])
          }
        >
          <PlusCircle size={14} /> Adicionar
        </Button>
      </div>
      <div className="space-y-3">
        {formData[turno].map((plantonista, index) => (
          <div key={`${turno}-${index}`} className="flex items-center gap-2">
            <div className="flex-grow">
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadMilitares}
                placeholder={`Buscar plantonista ${index + 1}`}
                styles={customStyles}
                    value={
                      plantonista.militar_id
                        ? {
                            value: plantonista.militar_id,
                            label: plantonista.label ?? `Plantonista ${plantonista.ordem}`,
                          }
                        : null
                    }
                    onChange={(option) =>
                      updateTurno(turno, (lista) => {
                        const updated = [...lista];
                        updated[index] = {
                          ...updated[index],
                          militar_id: (option as MilitarOption | null)?.value ?? null,
                          label: (option as MilitarOption | null)?.label ?? null,
                        };
                        return updated;
                      })
                    }
              />
            </div>
            {formData[turno].length > 1 && (
              <button
                type="button"
                className="text-red-500 hover:text-red-400"
                onClick={() =>
                  updateTurno(turno, (lista) => lista.filter((_, idx) => idx !== index))
                }
              >
                <XCircle size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <Label htmlFor="dataCodec">Data da Escala</Label>
        <Input
          id="dataCodec"
          type="date"
          value={formData.data}
          onChange={(event) => setFormData((prev) => ({ ...prev, data: event.target.value }))}
          required
        />
      </div>

      {renderTurno('diurno', 'Turno Diurno (07h as 19h)')}
      {renderTurno('noturno', 'Turno Noturno (19h as 07h)')}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default EscalaCodecForm;
