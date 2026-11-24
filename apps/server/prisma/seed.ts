import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultRooms = [
    { name: "geral", description: "Sala principal para conversas gerais" },
    { name: "tech", description: "Discussões sobre desenvolvimento, Node, React e WebSockets" },
    { name: "random", description: "Assuntos aleatórios e descontração" },
  ];

  for (const room of defaultRooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
  }

  console.log("[seed] Default rooms ensured:", defaultRooms.map((r) => `#${r.name}`).join(", "));
}

main()
  .catch((err) => {
    console.error("[seed] Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
