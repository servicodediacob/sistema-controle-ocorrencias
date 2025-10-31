// frontend/src/utils/date.ts

export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid time';
  }
}

export const getPlantaoRange = () => {
  const formatToISO = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const now = new Date();
  const inicioData = new Date(now);

  // Define o horário de início do plantão para 06:30
  inicioData.setHours(6, 30, 0, 0);

  // Se o horário atual for antes das 06:30, o plantão é do dia anterior
  if (now.getHours() < 6 || (now.getHours() === 6 && now.getMinutes() < 30)) {
    inicioData.setDate(inicioData.getDate() - 1);
  }

  const fimData = new Date(inicioData);
  fimData.setDate(fimData.getDate() + 1);
  fimData.setMinutes(fimData.getMinutes() - 1); // Termina às 06:29

  return {
    inicioISO: formatToISO(inicioData),
    fimISO: formatToISO(fimData),
    inicioData,
    fimData,
  };
};