import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import { useNotification } from '../../contexts/NotificationContext';
import { sisgpoApi } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';

interface AeronaveOption {
  value: number;
  label: string;
}

interface MilitarOption {
  value: number;
  label: string;
}

export interface EscalaAeronavePayload {
  data: string;
  status: string;
  aeronave_id: number | null;
  primeiro_piloto_id: number | null;
  segundo_piloto_id: number | null;
}

interface EscalaAeronaveFormProps {
  isSaving: boolean;
  onSave: (payload: EscalaAeronavePayload) => void;
  onCancel: () => void;
}

export const EscalaAeronaveForm = ({ isSaving, onSave, onCancel }: EscalaAeronaveFormProps) => {
  const { addNotification } = useNotification();
  const [aeronaves, setAeronaves] = useState<AeronaveOption[]>([]);
  const [formData, setFormData] = useState<EscalaAeronavePayload>({
    data: new Date().toISOString().split('T')[0],
    status: 'Em servico',
    aeronave_id: null,
    primeiro_piloto_id: null,
    segundo_piloto_id: null,
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

  useEffect(() => {
    const fetchAeronaves = async () => {
      try {
        const response = await sisgpoApi.get<{ data: { id: number; prefixo: string }[] }>(
          '/admin/viaturas/aeronaves'
        );
        const options =
          response.data?.map((item) => ({ value: item.id, label: item.prefixo })) ?? [];
        setAeronaves(options);
      } catch {
        addNotification('Nao foi possivel carregar as aeronaves disponiveis.', 'error');
        setAeronaves([]);
      }
    };
    fetchAeronaves();
  }, [addNotification]);

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

  const handleSubmit = () => {
    if (!formData.aeronave_id) {
      addNotification('Selecione a aeronave para registrar a escala.', 'error');
      return;
    }
    if (!formData.primeiro_piloto_id) {
      addNotification('Selecione o comandante da aeronave.', 'error');
      return;
    }
    onSave(formData);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <Label htmlFor="dataEscala">Data da Escala</Label>
        <Input
          id="dataEscala"
          type="date"
          value={formData.data}
          onChange={(event) => setFormData((prev) => ({ ...prev, data: event.target.value }))}
          required
        />
      </div>

      <div>
        <Label>Aeronave</Label>
        <Select
          options={aeronaves}
          value={aeronaves.find((option) => option.value === formData.aeronave_id) ?? null}
          onChange={(option) =>
            setFormData((prev) => ({ ...prev, aeronave_id: (option as AeronaveOption | null)?.value ?? null }))
          }
          placeholder="Selecione o prefixo"
          className="text-text"
          styles={customStyles}
        />
      </div>

      <div>
        <Label>Comandante (1o Piloto)</Label>
        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadMilitares}
          placeholder="Digite para buscar"
          styles={customStyles}
          onChange={(option) =>
            setFormData((prev) => ({
              ...prev,
              primeiro_piloto_id: (option as MilitarOption | null)?.value ?? null,
            }))
          }
        />
      </div>

      <div>
        <Label>Copiloto (2o Piloto)</Label>
        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadMilitares}
          placeholder="Digite para buscar"
          styles={customStyles}
          onChange={(option) =>
            setFormData((prev) => ({
              ...prev,
              segundo_piloto_id: (option as MilitarOption | null)?.value ?? null,
            }))
          }
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none"
          value={formData.status}
          onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="Em servico">Em servico</option>
          <option value="Reserva">Reserva</option>
          <option value="Em manutencao">Em manutencao</option>
        </select>
      </div>

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

export default EscalaAeronaveForm;
