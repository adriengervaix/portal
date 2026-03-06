import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const dbUrl = url.startsWith("file:")
  ? `file:${path.resolve(process.cwd(), url.replace("file:", ""))}`
  : url;

const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
