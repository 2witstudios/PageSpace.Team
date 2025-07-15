import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from ".";
import path from "path";
import { config } from "dotenv";

// Load environment variables from the root .env file
config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  console.log("Running migrations...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations finished.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});