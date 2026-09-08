import { prisma } from "@/lib/db";
import type { User, UserRole } from "@prisma/client";

export type OperatorSession = {
  user: User;
  role: UserRole;
  demo: boolean;
};

export async function getOperatorSession(): Promise<OperatorSession> {
  const email = process.env.DEMO_OPERATOR_EMAIL ?? "maya.chen@example.com";
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Operator session is not seeded. Run `npm run db:seed`.");
  }

  return {
    user,
    role: user.role,
    demo: process.env.DEMO_MODE !== "false",
  };
}

export function assertRole(session: OperatorSession, allowed: UserRole[]) {
  if (!allowed.includes(session.role)) {
    const error = new Error("You do not have permission to perform this action.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
}
