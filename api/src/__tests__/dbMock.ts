export const dbMock = {
    query: jest.fn(),
    pool: {
        on: jest.fn(),
        end: jest.fn(),
    },
};

jest.mock('../db', () => ({
    __esModule: true,
    default: dbMock,
}));
