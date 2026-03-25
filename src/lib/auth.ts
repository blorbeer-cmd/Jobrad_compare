import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Admin email can always sign in
      if (user.email === process.env.ADMIN_EMAIL) return true;

      // Check if user has a valid (non-expired, unused) invite
      const invite = await db.invite.findUnique({
        where: { email: user.email },
      });

      if (!invite) return false;
      if (invite.usedAt) return true; // Already accepted invite
      if (invite.expiresAt < new Date()) return false; // Expired

      // Mark invite as used
      await db.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-assign ADMIN role to the configured admin email
      if (user.email === process.env.ADMIN_EMAIL) {
        await db.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
};
