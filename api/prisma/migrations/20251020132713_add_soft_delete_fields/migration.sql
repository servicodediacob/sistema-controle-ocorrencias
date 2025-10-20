-- AlterTable
ALTER TABLE "estatisticas_diarias" ADD COLUMN     "deletado_em" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "obitos_registros" ADD COLUMN     "deletado_em" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ocorrencias_detalhadas" ADD COLUMN     "deletado_em" TIMESTAMPTZ;
