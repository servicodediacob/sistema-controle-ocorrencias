import { FormEvent, useEffect, useMemo, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import FormError from '../ui/FormError';
import { Obm, ValidationError } from '../../types/sisgpo';

export interface ObmFormPayload {
  id?: number;
  nome: string;
  abreviatura: string;
  cidade?: string | null;
  telefone?: string | null;
  crbm?: string | null;
}

interface ObmFormProps {
  initialData?: Obm | null;
  options: Obm[];
  isSaving: boolean;
  errors?: ValidationError[];
  onSubmit: (payload: ObmFormPayload) => void;
  onCancel: () => void;
}

const ObmForm = ({
  initialData,
  options,
  isSaving,
  errors = [],
  onSubmit,
  onCancel,
}: ObmFormProps) => {
  const [formData, setFormData] = useState<ObmFormPayload>({
    nome: '',
    abreviatura: '',
    cidade: '',
    telefone: '',
    crbm: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nome: initialData.nome,
        abreviatura: initialData.abreviatura,
        cidade: initialData.cidade ?? '',
        telefone: initialData.telefone ?? '',
        crbm: initialData.crbm ?? '',
      });
    } else {
      setFormData({
        nome: '',
        abreviatura: '',
        cidade: '',
        telefone: '',
        crbm: '',
      });
    }
  }, [initialData]);

  const creatableOptions = useMemo(
    () => options.map((item) => ({ value: item.nome, label: item.nome, cidade: item.cidade ?? '' })),
    [options]
  );

  const errorFor = (field: string) => errors.find((item) => item.field === field)?.message;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="obmNome">Nome da OBM</Label>
        <CreatableSelect
          inputId="obmNome"
          isClearable
          isDisabled={Boolean(initialData)}
          options={creatableOptions}
          value={
            formData.nome
              ? { value: formData.nome, label: formData.nome, cidade: formData.cidade ?? '' }
              : null
          }
          onChange={(option) =>
            setFormData((prev) => ({
              ...prev,
              nome: option ? String(option.value) : '',
              cidade: (option as any)?.cidade ?? prev.cidade,
            }))
          }
          onCreateOption={(inputValue) =>
            setFormData((prev) => ({
              ...prev,
              nome: inputValue,
            }))
          }
          placeholder="Selecione ou digite para criar uma nova OBM"
        />
        <FormError message={errorFor('nome')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="abreviatura">Abreviatura</Label>
          <Input
            id="abreviatura"
            value={formData.abreviatura}
            onChange={(event) => setFormData((prev) => ({ ...prev, abreviatura: event.target.value }))}
            required
            className={errorFor('abreviatura') ? 'border-red-500' : undefined}
          />
          <FormError message={errorFor('abreviatura')} />
        </div>
        <div>
          <Label htmlFor="crbm">CRBM</Label>
          <Input
            id="crbm"
            value={formData.crbm ?? ''}
            onChange={(event) => setFormData((prev) => ({ ...prev, crbm: event.target.value }))}
          />
          <FormError message={errorFor('crbm')} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade ?? ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, cidade: event.target.value }))}
            />
            <FormError message={errorFor('cidade')} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone ?? ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, telefone: event.target.value }))}
            />
            <FormError message={errorFor('telefone')} />
          </div>
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

export default ObmForm;
