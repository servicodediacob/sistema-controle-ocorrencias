import { FormEvent, useEffect, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Select from '../ui/Select';
import FormError from '../ui/FormError';
import { Militar, Obm, ValidationError } from '../../types/sisgpo';

export interface MilitarFormPayload {
  id?: number;
  matricula: string;
  nome_completo: string;
  nome_guerra?: string | null;
  posto_graduacao: string;
  obm_id?: number | null;
  ativo: boolean;
  telefone?: string | null;
}

interface MilitarFormProps {
  initialData?: Militar | null;
  obms: Obm[];
  isSaving: boolean;
  errors?: ValidationError[];
  onSubmit: (payload: MilitarFormPayload) => void;
  onCancel: () => void;
}

const TELEFONE_PATTERN_ATTR = '^\\(\\d{2}\\)\\s?\\d{4,5}-\\d{4}$';

const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  const ddd = digits.slice(0, 2);
  const restante = digits.slice(2);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${ddd}) ${restante}`;
  if (digits.length <= 10) {
    const parte1 = restante.slice(0, 4);
    const parte2 = restante.slice(4);
    return `(${ddd}) ${parte1}${parte2 ? `-${parte2}` : ''}`;
  }
  const parte1 = restante.slice(0, 5);
  const parte2 = restante.slice(5);
  return `(${ddd}) ${parte1}-${parte2}`;
};

const MilitarForm = ({
  initialData,
  obms,
  isSaving,
  errors = [],
  onSubmit,
  onCancel,
}: MilitarFormProps) => {
  const [formData, setFormData] = useState<MilitarFormPayload>({
    matricula: '',
    nome_completo: '',
    nome_guerra: '',
    posto_graduacao: '',
    obm_id: null,
    ativo: true,
    telefone: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        matricula: initialData.matricula,
        nome_completo: initialData.nome_completo,
        nome_guerra: initialData.nome_guerra ?? '',
        posto_graduacao: initialData.posto_graduacao,
        obm_id: initialData.obm_id ?? null,
        ativo: initialData.ativo,
        telefone: initialData.telefone ?? '',
      });
    } else {
      setFormData({
        matricula: '',
        nome_completo: '',
        nome_guerra: '',
        posto_graduacao: '',
        obm_id: null,
        ativo: true,
        telefone: '',
      });
    }
  }, [initialData]);

  const errorFor = (field: string) => errors.find((item) => item.field === field)?.message;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === 'telefone') {
      setFormData((prev) => ({ ...prev, telefone: formatTelefone(value) }));
      return;
    }
    if (name === 'obm_id') {
      setFormData((prev) => ({ ...prev, obm_id: value ? Number(value) : null }));
      return;
    }
    if (name === 'ativo') {
      setFormData((prev) => ({ ...prev, ativo: value === 'ativo' }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="matricula">Matricula</Label>
          <Input
            id="matricula"
            name="matricula"
            value={formData.matricula}
            onChange={handleChange}
            required
            className={errorFor('matricula') ? 'border-red-500' : undefined}
          />
          <FormError message={errorFor('matricula')} />
        </div>
        <div>
          <Label htmlFor="posto_graduacao">Posto/Graduacao</Label>
          <Input
            id="posto_graduacao"
            name="posto_graduacao"
            value={formData.posto_graduacao}
            onChange={handleChange}
            required
            className={errorFor('posto_graduacao') ? 'border-red-500' : undefined}
          />
          <FormError message={errorFor('posto_graduacao')} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="nome_completo">Nome completo</Label>
          <Input
            id="nome_completo"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            required
            className={errorFor('nome_completo') ? 'border-red-500' : undefined}
          />
          <FormError message={errorFor('nome_completo')} />
        </div>
        <div>
          <Label htmlFor="nome_guerra">Nome de guerra</Label>
          <Input
            id="nome_guerra"
            name="nome_guerra"
            value={formData.nome_guerra ?? ''}
            onChange={handleChange}
            className={errorFor('nome_guerra') ? 'border-red-500' : undefined}
          />
          <FormError message={errorFor('nome_guerra')} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="obm_id">Lotacao (OBM)</Label>
          <Select
            id="obm_id"
            name="obm_id"
            value={formData.obm_id ? String(formData.obm_id) : ''}
            onChange={handleChange}
            hasError={!!errorFor('obm_id')}
          >
            <option value="">Nenhuma</option>
            {obms.map((obm) => (
              <option key={obm.id} value={obm.id}>
                {obm.abreviatura} - {obm.nome}
              </option>
            ))}
          </Select>
          <FormError message={errorFor('obm_id')} />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            inputMode="numeric"
            pattern={TELEFONE_PATTERN_ATTR}
            maxLength={15}
            title="Informe no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX"
            value={formData.telefone ?? ''}
            onChange={handleChange}
            className={errorFor('telefone') ? 'border-red-500' : undefined}
          />
          <FormError message={errorFor('telefone')} />
        </div>
      </div>

      <div>
        <Label htmlFor="ativo">Status</Label>
        <Select
          id="ativo"
          name="ativo"
          value={formData.ativo ? 'ativo' : 'inativo'}
          onChange={handleChange}
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
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

export default MilitarForm;
