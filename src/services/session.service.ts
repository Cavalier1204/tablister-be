import prisma from "@/config/prisma.js";

const findSession = async (sessionId: string) => {
  return await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
};

export default { findSession };
