import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import FormError from '../ui/FormError';
import { Obm, ValidationError, Viatura } from '../../types/sisgpo';

export interface ViaturaFormPayload {
  id?: number;
  prefixo: string;
  cidade?: string;
  obm?: string;
  obm_abreviatura?: string;
  ativa: boolean;
}

interface ViaturaFormProps {
  initialData?: Viatura | null;
  obms: Obm[];
  isSaving: boolean;
  errors?: ValidationError[];
  onSubmit: (payload: ViaturaFormPayload) => void;
  onCancel: () => void;
}

const ViaturaForm = ({
  initialData,
  obms,
  isSaving,
  errors = [],
  onSubmit,
  onCancel,
}: ViaturaFormProps) => {
  const [formData, setFormData] = useState<ViaturaFormPayload>({
    prefixo: '',
    cidade: '',
    obm: '',
    obm_abreviatura: '',
    ativa: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        prefixo: initialData.prefixo,
        cidade: initialData.cidade ?? '',
        obm: initialData.obm ?? '',
        obm_abreviatura: initialData.obm_abreviatura ?? '',
        ativa: initialData.ativa ?? true,
      });
    } else {
      setFormData({
        prefixo: '',
        cidade: '',
        obm: '',
        obm_abreviatura: '',
        ativa: true,
      });
    }
  }, [initialData]);

  const errorFor = (field: string) => errors.find((item) => item.field === field)?.message;

  const obmOptions = useMemo(
    () =>
      obms.map((obm) => ({
        id: obm.id,
        label: obm.abreviatura ? `${obm.abreviatura} - ${obm.nome}` : obm.nome,
        nome: obm.nome,
        abreviatura: obm.abreviatura,
      })),
    [obms]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleObmSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const option = obmOptions.find((item) => String(item.id) === event.target.value);
    setFormData((prev) => ({
      ...prev,
      obm: option?.nome ?? '',
      obm_abreviatura: option?.abreviatura ?? '',
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="prefixo">Prefixo</Label>
        <Input
          id="prefixo"
          name="prefixo"
          value={formData.prefixo}
          onChange={handleChange}
          required
          className={errorFor('prefixo') ? 'border-red-500' : undefined}
        />
        <FormError message={errorFor('prefixo')} />
      </div>

      <div>
        <Label htmlFor="obmSelect">OBM cadastrada</Label>
        <select
          id="obmSelect"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none"
          onChange={handleObmSelect}
          value={
            formData.obm && obmOptions.find((item) => item.nome === formData.obm)
              ? String(obmOptions.find((item) => item.nome === formData.obm)!.id)
              : ''
          }
        >
          <option value="">Escolha uma OBM</option>
          {obmOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="obm">OBM (nome por extenso)</Label>
        <Input
          id="obm"
          name="obm"
          value={formData.obm ?? ''}
          onChange={handleChange}
          className={errorFor('obm') ? 'border-red-500' : undefined}
        />
        <FormError message={errorFor('obm')} />
      </div>

      <div>
        <Label htmlFor="obm_abreviatura">Sigla da OBM</Label>
        <Input
          id="obm_abreviatura"
          name="obm_abreviatura"
          value={formData.obm_abreviatura ?? ''}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input
          id="cidade"
          name="cidade"
          value={formData.cidade ?? ''}
          onChange={handleChange}
          className={errorFor('cidade') ? 'border-red-500' : undefined}
        />
        <FormError message={errorFor('cidade')} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          id="ativa"
          name="ativa"
          type="checkbox"
          checked={formData.ativa}
          onChange={handleChange}
          className="h-4 w-4 rounded border border-border text-blue-600 focus:ring-blue-400"
        />
        <Label htmlFor="ativa" className="mb-0">
          Viatura ativa
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
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

export default ViaturaForm;
