export interface SisgpoPagination {
  currentPage: number;
  totalPages: number;
  perPage?: number;
  totalRecords?: number;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination?: SisgpoPagination | null;
}

export interface Viatura {
  id: number;
  prefixo: string;
  cidade?: string | null;
  obm?: string | null;
  obm_abreviatura?: string | null;
  obm_id?: number | null;
  ativa?: boolean;
}

export interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
  cidade?: string | null;
  telefone?: string | null;
  crbm?: string | null;
}

export interface ObmOption {
  id: number;
  nome: string;
  abreviatura: string;
}

export interface Militar {
  id: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string | null;
  posto_graduacao: string;
  obm_nome: string | null;
  obm_id?: number | null;
  ativo: boolean;
  telefone: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface GuarnicaoMembro {
  militar_id: number | null;
  funcao: string;
  nome_completo?: string | null;
  nome_guerra?: string | null;
  nome_exibicao?: string | null;
  posto_graduacao?: string | null;
  telefone?: string | null;
}

export interface Plantao {
  id: number;
  data_plantao: string;
  horario_inicio?: string | null;
  horario_inicial?: string | null;
  horarioInicio?: string | null;
  horarioInicial?: string | null;
  hora_inicio?: string | null;
  hora_inicial?: string | null;
  horaInicio?: string | null;
  horaInicial?: string | null;
  horario_fim?: string | null;
  horario_final?: string | null;
  horarioFim?: string | null;
  horarioFinal?: string | null;
  hora_fim?: string | null;
  hora_final?: string | null;
  horaFim?: string | null;
  horaFinal?: string | null;
  viatura_prefixo: string;
  obm_abreviatura: string;
  guarnicao: GuarnicaoMembro[];
}

export interface PlantaoDetalhado {
  id: number;
  data_plantao: string;
  horario_inicio?: string | null;
  horario_inicial?: string | null;
  horarioInicio?: string | null;
  horarioInicial?: string | null;
  hora_inicio?: string | null;
  hora_inicial?: string | null;
  horaInicio?: string | null;
  horaInicial?: string | null;
  horario_fim?: string | null;
  horario_final?: string | null;
  horarioFim?: string | null;
  horarioFinal?: string | null;
  hora_fim?: string | null;
  hora_final?: string | null;
  horaFim?: string | null;
  horaFinal?: string | null;
  viatura_id: number;
  obm_id: number | null;
  observacoes: string;
  guarnicao: GuarnicaoMembro[];
}

export interface EscalaMedico {
  id: number;
  civil_id: number;
  nome_completo: string;
  funcao: string;
  entrada_servico: string;
  saida_servico: string;
  status_servico: string;
  observacoes?: string;
}

export interface EscalaAeronave {
  id: number;
  data: string;
  aeronave_prefixo: string;
  primeiro_piloto: string;
  segundo_piloto: string;
  status: string;
}

export interface EscalaCodec {
  id: number;
  data: string;
  turno: 'Diurno' | 'Noturno';
  ordem_plantonista: number;
  nome_plantonista: string;
}

export type ActiveTab = 'plantoes' | 'escalaMedicos' | 'escalaAeronaves' | 'escalaCodec';
