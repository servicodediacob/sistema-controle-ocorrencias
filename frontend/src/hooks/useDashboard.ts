
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getPlantao, IDashboardStats, IPlantao } from '../services/api';
import { getPlantaoRange } from '../utils/date';

// Keys for caching
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    plantao: () => [...dashboardKeys.all, 'plantao'] as const,
};

export function useDashboardStats() {
    const { inicioISO, fimISO } = getPlantaoRange();

    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: () => getDashboardStats(inicioISO, fimISO),
        staleTime: 1000 * 60, // 1 minute stale time for stats
    });
}

export function usePlantaoData() {
    const { inicioISO, fimISO } = getPlantaoRange();

    return useQuery({
        queryKey: dashboardKeys.plantao(),
        queryFn: () => getPlantao(inicioISO, fimISO),
        staleTime: 1000 * 60, // 1 minute stale time for plantao
    });
}
