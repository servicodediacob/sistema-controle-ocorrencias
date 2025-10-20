const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  try {
    const crbms = await prisma.cRBM.findMany({ include: { obms: true } });
    console.log(JSON.stringify(crbms, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
