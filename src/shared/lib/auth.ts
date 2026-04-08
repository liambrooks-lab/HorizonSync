import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type NextAuthOptions, getServerSession } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import { z } from "zod";

import { db } from "@/shared/lib/db";
import { slugify } from "@/shared/lib/utils";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function resolveOAuthProviders() {
  const providers = [];

  // Providers are added only when the required credentials are present.
  // This keeps local builds and preview environments from crashing.
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    providers.push(
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        version: "2.0",
      }),
    );
  }

  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    providers.push(
      AzureADProvider({
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
      }),
    );
  }

  providers.push(
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@horizonsync.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(rawCredentials) {
        const parsedCredentials = credentialsSchema.safeParse(rawCredentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsedCredentials.data.email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsedCredentials.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return user;
      },
    }),
  );

  return providers;
}

async function generateUniqueUsername(candidate: string | null | undefined) {
  const baseCandidate = slugify(candidate || "horizonsync-user") || "horizonsync-user";
  let suffix = 0;

  while (true) {
    const nextCandidate = suffix === 0 ? baseCandidate : `${baseCandidate}-${suffix}`;
    const existingUser = await db.user.findUnique({
      where: { username: nextCandidate },
      select: { id: true },
    });

    if (!existingUser) {
      return nextCandidate;
    }

    suffix += 1;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: resolveOAuthProviders(),
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist a small profile snapshot in the token so middleware and the
      // app shell can read the essentials without extra database work.
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.username = (user as typeof user & { username?: string | null }).username ?? null;
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.username =
          typeof token.username === "string" ? token.username : null;
        session.user.image = typeof token.picture === "string" ? token.picture : null;
      }

      return session;
    },
    async signIn({ user, account }) {
      // Credentials-based users already have their local profile seeded.
      if (!user.id || account?.provider === "credentials") {
        return true;
      }

      const existingUser = await db.user.findUnique({
        where: { id: user.id },
        select: { username: true, socialLinks: true },
      });

      if (!existingUser) {
        return true;
      }

      if (!existingUser.username || existingUser.socialLinks.length !== 4) {
        await db.user.update({
          where: { id: user.id },
          data: {
            username: existingUser.username ?? (await generateUniqueUsername(user.name ?? user.email)),
            socialLinks:
              existingUser.socialLinks.length === 4
                ? existingUser.socialLinks
                : ["", "", "", ""],
          },
        });
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // OAuth signups arrive without our custom profile defaults, so we patch
      // them immediately after adapter creation.
      await db.user.update({
        where: { id: user.id },
        data: {
          username: await generateUniqueUsername(user.name ?? user.email),
          socialLinks: ["", "", "", ""],
        },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  return db.user.findUnique({
    where: { id: session.user.id },
  });
}
