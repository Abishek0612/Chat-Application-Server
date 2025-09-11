import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "john@example.com",
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        password: hashedPassword,
        bio: "Software Developer",
      },
    }),
    prisma.user.create({
      data: {
        email: "jane@example.com",
        username: "jane_smith",
        firstName: "Jane",
        lastName: "Smith",
        password: hashedPassword,
        bio: "UI/UX Designer",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        username: "bob_wilson",
        firstName: "Bob",
        lastName: "Wilson",
        password: hashedPassword,
        bio: "Product Manager",
      },
    }),
  ]);

  console.log(
    "👥 Created users:",
    users.map((u) => u.username)
  );

  const chat = await prisma.chat.create({
    data: {
      name: "General Discussion",
      isGroup: true,
      description: "Welcome to the general discussion group!",
      creatorId: users[0].id,
      members: {
        create: [
          { userId: users[0].id, role: "ADMIN" },
          { userId: users[1].id, role: "MEMBER" },
          { userId: users[2].id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("💬 Created demo chat:", chat.name);

  await prisma.message.createMany({
    data: [
      {
        content: "Welcome everyone to our chat app!",
        senderId: users[0].id,
        chatId: chat.id,
      },
      {
        content: "Thanks for creating this! Looking forward to chatting.",
        senderId: users[1].id,
        chatId: chat.id,
      },
      {
        content: "This is amazing! Great work on the app.",
        senderId: users[2].id,
        chatId: chat.id,
      },
    ],
  });

  console.log("📝 Created demo messages");
  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
