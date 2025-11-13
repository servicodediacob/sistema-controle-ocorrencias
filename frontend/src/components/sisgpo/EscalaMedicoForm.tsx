import { ChangeEvent, FormEvent, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { useNotification } from '../../contexts/NotificationContext';
import { sisgpoApi } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';

interface MedicoOption {
  value: number;
  label: string;
}

export interface EscalaMedicoPayload {
  civil_id: number | null;
  entrada_servico: string;
  saida_servico: string;
  status_servico: 'Presente' | 'Ausente';
  observacoes: string;
}

interface EscalaMedicoFormProps {
  isSaving: boolean;
  onSave: (payload: EscalaMedicoPayload) => void;
  onCancel: () => void;
}

const EscalaMedicoForm = ({ isSaving, onSave, onCancel }: EscalaMedicoFormProps) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<EscalaMedicoPayload>({
    civil_id: null,
    entrada_servico: '',
    saida_servico: '',
    status_servico: 'Presente',
    observacoes: '',
  });

  const loadMedicos = async (inputValue: string): Promise<MedicoOption[]> => {
    if (!inputValue || inputValue.trim().length < 2) {
      return [];
    }
    try {
      const response = await sisgpoApi.get<MedicoOption[]>('/admin/civis/search', {
        term: inputValue.trim(),
      });
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.civil_id) {
      addNotification('Selecione o medico antes de salvar.', 'error');
      return;
    }
    onSave(formData);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label>Medico</Label>
        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadMedicos}
          placeholder="Digite para buscar um medico"
          onChange={(option) =>
            setFormData((prev) => ({
              ...prev,
              civil_id: (option as MedicoOption | null)?.value ?? null,
            }))
          }
          noOptionsMessage={() => 'Nenhum registro encontrado'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="entrada_servico">Entrada do servico</Label>
          <Input
            id="entrada_servico"
            name="entrada_servico"
            type="datetime-local"
            value={formData.entrada_servico}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="saida_servico">Saida do servico</Label>
          <Input
            id="saida_servico"
            name="saida_servico"
            type="datetime-local"
            value={formData.saida_servico}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status_servico">Status</Label>
        <select
          id="status_servico"
          name="status_servico"
          value={formData.status_servico}
          onChange={handleChange}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none"
        >
          <option value="Presente">Presente</option>
          <option value="Ausente">Ausente</option>
        </select>
      </div>

      <div>
        <Label htmlFor="observacoes">Observacoes</Label>
        <textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none"
        />
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

export default EscalaMedicoForm;
