
import { api, ICrbm, IUser } from './api';
import { supabase } from '../lib/supabase';

// Mock do módulo supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            updateUser: jest.fn(),
            getUser: jest.fn()
        }
    },
}));

describe('API Service (Supabase Integration)', () => {
    const mockSelect = jest.fn();
    const mockOrder = jest.fn();
    const mockInsert = jest.fn();
    const mockUpdate = jest.fn();
    const mockDelete = jest.fn();
    const mockSingle = jest.fn();
    const mockEq = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup da cadeia de chamadas básica do Supabase
        (supabase.from as jest.Mock).mockReturnValue({
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
            then: jest.fn().mockResolvedValue({ data: [], error: null })
        });
    });

    it('getCrbms deve chamar supabase.from("crbms")', async () => {
        const mockData: ICrbm[] = [{ id: 1, nome: 'CRBM I' }];

        // Configurando o retorno da cadeia
        mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

        // Reconstruindo a cadeia específica usada em getCrbms
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
