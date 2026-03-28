import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

const providers: NextAuthOptions["providers"] = [
  EmailProvider({
    server: {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || "noreply@example.com",
  }),
];

// Dev login: email-only, no magic link required
// Enable with ALLOW_DEV_LOGIN=true in environment variables
if (process.env.ALLOW_DEV_LOGIN === "true") {
  providers.push(
    CredentialsProvider({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "E-Mail", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase().trim();

        try {
          // Find or create user — dev login allows any email
          let user = await db.user.findUnique({ where: { email } });
          if (!user) {
            const isAdmin = email === process.env.ADMIN_EMAIL?.toLowerCase();
            user = await db.user.create({
              data: {
                email,
                role: isAdmin ? "ADMIN" : "USER",
                consentGiven: true,
                consentAt: new Date(),
              },
            });
          }

          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (error) {
          console.error("Dev login error:", error);
          return null;
        }
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers,
  session: {
    // Credentials provider requires JWT strategy
    strategy: process.env.ALLOW_DEV_LOGIN === "true" ? "jwt" : "database",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Skip invite check for dev login and credentials
      if (account?.provider === "dev-login" || account?.type === "credentials") return true;

      if (!user.email) return false;

      // Admin email can always sign in
      if (user.email === process.env.ADMIN_EMAIL) return true;

      // Check if user has a valid (non-expired, unused) invite
      const invite = await db.invite.findUnique({
        where: { email: user.email },
      });

      if (!invite) return false;
      if (invite.usedAt) return true;
      if (invite.expiresAt < new Date()) return false;

      await db.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        if (token) {
          // JWT strategy (dev login)
          session.user.id = token.id as string;
          session.user.role = token.role as Role;
        } else if (user) {
          // Database strategy (email provider)
          session.user.id = user.id;
          session.user.role = user.role;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email === process.env.ADMIN_EMAIL) {
        await db.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
};
