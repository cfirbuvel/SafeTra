import pg from "pg";
import fs from "fs";
import path from "path";

// List of SQL files to execute in sequential order
const sqlFiles = [
  "scripts/004_create_deals_table.sql",
  "scripts/005_create_auth_tables.sql",
  "scripts/006_fix_rls_policies.sql",
  "scripts/007_fix_otp_rls.sql",
  "scripts/008_add_vehicle_owner_fields.sql",
  "scripts/009_create_notifications_table.sql",
  "scripts/010_add_avatar_url_to_profiles.sql",
  "scripts/011_fix_otp_codes_foreign_key.sql",
  "add_lawyer_role.sql",
  "add_admin_role.sql",
  "add_buyer_id.sql",
  "create_profiles_trigger.sql",
  "fix_rls_policies.sql",
];

const connectionString = process.env.DATABASE_URL || process.argv[2];

if (!connectionString) {
  console.error("Error: Please provide a database connection string.");
  console.error("Usage: DATABASE_URL=your_connection_string node scripts/apply-sql-scripts.js");
  console.error("Or: node scripts/apply-sql-scripts.js \"postgres://user:pass@host:port/dbname?sslmode=require\"");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: connectionString.includes("supabase.co") || connectionString.includes("pooler.supabase.com")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log("Connecting to the database...");
    await client.connect();
    console.log("Connected successfully!");

    for (const relativePath of sqlFiles) {
      const fullPath = path.resolve(process.cwd(), relativePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Warning: File not found at ${fullPath}. Skipping...`);
        continue;
      }

      console.log(`\nExecuting: ${relativePath}...`);
      const sql = fs.readFileSync(fullPath, "utf8");

      // Split the script by semicolon, filtering out empty commands, to avoid syntax issues.
      // Note: This is a basic split. For complex PL/pgSQL functions containing semicolons, we can execute the whole file.
      // Since some files have triggers and functions, we'll try running the file as a single query block first.
      try {
        await client.query(sql);
        console.log(`Successfully executed ${relativePath}`);
      } catch (err) {
        console.error(`Error executing ${relativePath}:`, err.message);
        throw err;
      }
    }

    console.log("\nAll migrations applied successfully!");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
