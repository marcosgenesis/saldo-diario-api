import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "./db/client";

export const auth = betterAuth({
  plugins: [bearer(), expo()],
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  trustedOrigins: [
    process.env.CLIENT_ORIGIN || "https://app.saldodiario.com.br",
    "saldodiario://",
  ],
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});
