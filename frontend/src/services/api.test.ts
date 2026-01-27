import { vi } from 'vitest';
import * as api from './api';
import { ICrbm } from './api';
import { supabase } from '../lib/supabase';

// Mock do módulo supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            updateUser: vi.fn(),
            getUser: vi.fn()
        }
    },
}));

describe('API Service (Supabase Integration)', () => {
    const mockSelect = vi.fn();
    const mockOrder = vi.fn();
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockDelete = vi.fn();
    const mockEq = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup da cadeia de chamadas básica do Supabase
        (supabase.from as any).mockReturnValue({
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete,
        });

        // Default returns
        mockSelect.mockReturnThis();
        mockOrder.mockReturnThis();
        mockEq.mockReturnThis();
        mockSelect.mockReturnValue({
            order: mockOrder,
            eq: mockEq,
            select: mockSelect,
            // Mock data response
            then: vi.fn().mockResolvedValue({ data: [], error: null })
        });
    });

    it('getCrbms deve chamar supabase.from("crbms")', async () => {
        const mockData: ICrbm[] = [{ id: 1, nome: 'CRBM I' }];

        // Configurando o retorno da cadeia
        mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

        // .from('crbms').select('*').order('nome')
        const chainSelect = { order: mockOrder };
        mockSelect.mockReturnValue(chainSelect);

        const result = await api.getCrbms();

        expect(supabase.from).toHaveBeenCalledWith('crbms');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockOrder).toHaveBeenCalledWith('nome');
        expect(result).toEqual(mockData);
    });

    it('getUsuarios deve mapear obm_nome corretamente', async () => {
        const mockUsersDB = [
            { id: 1, nome: 'User A', email: 'a@c.com', perfil: 'admin', obm: { nome: 'OBM Alpha' } }
        ];

        // .from('usuarios').select('*, obm:obms(nome)').order('nome')
        const chainSelect = { order: mockOrder };
        mockSelect.mockReturnValue(chainSelect);
        mockOrder.mockResolvedValueOnce({ data: mockUsersDB, error: null });

        const result = await api.getUsuarios();

        expect(supabase.from).toHaveBeenCalledWith('usuarios');
        expect(mockSelect).toHaveBeenCalledWith('*, obm:obms(nome)');
        expect(result[0].obm_nome).toBe('OBM Alpha');
    });
});
