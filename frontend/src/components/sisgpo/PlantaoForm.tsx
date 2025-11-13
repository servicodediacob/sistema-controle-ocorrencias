import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { Trash2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { sisgpoApi } from '../../services/api';
import { GuarnicaoMembro, PlantaoDetalhado, Viatura } from '../../types/sisgpo';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';

interface MilitarOption {
  value: number;
  label: string;
  militar?: {
    id?: number;
    posto_graduacao?: string | null;
    nome_exibicao?: string | null;
    nome_completo?: string | null;
    nome_guerra?: string | null;
    telefone?: string | null;
  };
}

export interface PlantaoFormPayload {
  id?: number;
  data_plantao: string;
  viatura_id: number;
  obm_id: number | null;
  observacoes: string;
  guarnicao: {
    militar_id: number | null;
    funcao: string;
    telefone?: string | null;
  }[];
}

interface PlantaoFormProps {
  viaturas: Viatura[];
  initialData?: PlantaoDetalhado | null;
  isSaving: boolean;
  onSave: (payload: PlantaoFormPayload) => void;
  onCancel: () => void;
}

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const createEmptyMember = (): GuarnicaoMembro => ({
  militar_id: null,
  nome_completo: '',
  nome_exibicao: '',
  posto_graduacao: '',
  funcao: '',
  telefone: '',
});

const selectStyles = {
  control: (provided: any) => ({
    ...provided,
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
    minHeight: '2.75rem',
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: 'var(--color-surface)',
  }),
  option: (provided: any, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'rgba(59,130,246,0.2)'
      : state.isFocused
        ? 'rgba(59,130,246,0.1)'
        : 'var(--color-surface)',
    color: 'var(--color-text-strong)',
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: 'var(--color-text)',
  }),
  input: (provided: any) => ({
    ...provided,
    color: 'var(--color-text)',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: 'var(--color-text)',
    opacity: 0.6,
  }),
};

export const PlantaoForm = ({
  viaturas,
  initialData,
  isSaving,
  onSave,
  onCancel,
}: PlantaoFormProps) => {
  const { addNotification } = useNotification();
  const [dataPlantao, setDataPlantao] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [viaturaId, setViaturaId] = useState<number | ''>('');
  const [obmId, setObmId] = useState<number | null | ''>('');
  const [observacoes, setObservacoes] = useState('');
  const [guarnicao, setGuarnicao] = useState<GuarnicaoMembro[]>([createEmptyMember()]);

  useEffect(() => {
    if (!initialData) {
      setDataPlantao(new Date().toISOString().split('T')[0]);
      setViaturaId('');
      setObmId('');
      setObservacoes('');
      setGuarnicao([createEmptyMember()]);
      return;
    }

    setDataPlantao(new Date(initialData.data_plantao).toISOString().split('T')[0]);
    setViaturaId(initialData.viatura_id);
    setObmId(initialData.obm_id ?? null);
    setObservacoes(initialData.observacoes ?? '');
    setGuarnicao(
      (initialData.guarnicao || []).map((m) => ({
        ...m,
        funcao: m.funcao || '',
        telefone: m.telefone ? formatPhone(m.telefone) : '',
      }))
    );
  }, [initialData]);

  const viaturasById = useMemo(
    () =>
      viaturas.reduce<Record<number, Viatura>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [viaturas]
  );

  const loadMilitares = async (inputValue: string): Promise<MilitarOption[]> => {
    if (!inputValue || inputValue.trim().length < 2) {
      return [];
    }
    try {
      const data = await sisgpoApi.get<MilitarOption[]>('/admin/militares/search', {
        term: inputValue.trim(),
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const handleSelectMilitar = (index: number, option: MilitarOption | null) => {
    setGuarnicao((prev) => {
      const updated = [...prev];
      if (!option) {
        updated[index] = createEmptyMember();
        return updated;
      }

      const displayName =
        option.label ||
        option.militar?.nome_exibicao ||
        option.militar?.nome_completo ||
        option.militar?.nome_guerra ||
        '';

      updated[index] = {
        ...updated[index],
        militar_id: option.value,
        nome_exibicao: displayName.trim(),
        nome_completo: displayName.trim(),
        posto_graduacao: option.militar?.posto_graduacao ?? '',
        telefone: option.militar?.telefone ? formatPhone(option.militar.telefone) : '',
      };
      return updated;
    });
  };

  const handleMemberChange = (index: number, field: 'telefone' | 'funcao', value: string) => {
    setGuarnicao((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'telefone' ? formatPhone(value) : value,
      };
      return updated;
    });
  };

  const addMember = () => setGuarnicao((prev) => [...prev, createEmptyMember()]);
  const removeMember = (index: number) =>
    setGuarnicao((prev) => prev.filter((_, idx) => idx !== index));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!viaturaId) {
      addNotification('Selecione uma viatura antes de salvar o plantao.', 'error');
      return;
    }

    const viatura = viaturasById[viaturaId];
    const resolvedObmId = viatura?.obm_id ?? (typeof obmId === 'number' ? obmId : null);

    if (!resolvedObmId) {
      addNotification(
        'A viatura selecionada nao possui OBM vinculada. Atualize o cadastro ou selecione outra viatura.',
        'error'
      );
      return;
    }

    const guarnicaoValida = guarnicao.every((membro) => membro.militar_id && membro.funcao);
    if (!guarnicaoValida) {
      addNotification(
        'Todos os integrantes da guarnicao precisam ter militar selecionado e funcao preenchida.',
        'error'
      );
      return;
    }

    const payload: PlantaoFormPayload = {
      id: initialData?.id,
      data_plantao: dataPlantao,
      viatura_id: Number(viaturaId),
      obm_id: resolvedObmId,
      observacoes,
      guarnicao: guarnicao.map(({ militar_id, funcao, telefone }) => ({
        militar_id,
        funcao,
        telefone: telefone ? telefone.replace(/\D/g, '') : '',
      })),
    };

    onSave(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dataPlantao">Data do Plantao</Label>
          <Input
            id="dataPlantao"
            type="date"
            value={dataPlantao}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDataPlantao(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="viatura">Viatura</Label>
          <select
            id="viatura"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none"
            value={viaturaId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const selected = event.target.value;
              if (!selected) {
                setViaturaId('');
                setObmId('');
                return;
              }
              const numeric = Number(selected);
              setViaturaId(numeric);
              setObmId(viaturasById[numeric]?.obm_id ?? null);
            }}
            required
          >
            <option value="">Selecione uma viatura</option>
            {viaturas.map((viatura) => (
              <option key={viatura.id} value={viatura.id}>
                {viatura.prefixo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label>Guarnicao</Label>
        <div className="space-y-4">
          {guarnicao.map((membro, index) => (
            <div key={index} className="relative rounded-lg border border-border bg-surface p-4">
              {guarnicao.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="absolute right-2 top-2 text-red-500 hover:text-red-400"
                  title="Remover militar"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <div className="space-y-4">
                <div>
                  <Label>Militar</Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadMilitares}
                    value={
                      membro.militar_id
                        ? { value: membro.militar_id, label: membro.nome_exibicao }
                        : null
                    }
                    onChange={(option) => handleSelectMilitar(index, option as MilitarOption | null)}
                    placeholder="Digite para buscar..."
                    noOptionsMessage={({ inputValue }) =>
                      inputValue.length < 2
                        ? 'Digite ao menos 2 caracteres'
                        : 'Nenhum militar encontrado'
                    }
                    styles={selectStyles}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`telefone-${index}`}>Telefone</Label>
                    <Input
                      id={`telefone-${index}`}
                      type="text"
                      value={membro.telefone ?? ''}
                      placeholder="(00) 00000-0000"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handleMemberChange(index, 'telefone', event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`funcao-${index}`}>Funcao</Label>
                    <Input
                      id={`funcao-${index}`}
                      type="text"
                      value={membro.funcao}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handleMemberChange(index, 'funcao', event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-3" onClick={addMember}>
          Adicionar militar
        </Button>
      </div>

      <div>
        <Label htmlFor="observacoes">Observacoes</Label>
        <textarea
          id="observacoes"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none"
          rows={3}
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : initialData ? 'Atualizar Plantao' : 'Salvar Plantao'}
        </Button>
      </div>
    </form>
  );
};

export default PlantaoForm;
