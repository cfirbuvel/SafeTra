import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env or .env.development
function getEnvVars() {
  const envFiles = [".env.development", ".env", ".env.local"];
  let supabaseUrl = "";
  let serviceRoleKey = "";

  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const parts = line.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
          if (key === "NEXT_PUBLIC_SUPABASE_URL" && !supabaseUrl) supabaseUrl = val;
          if (key === "SUPABASE_SERVICE_ROLE_KEY" && !serviceRoleKey) serviceRoleKey = val;
        }
      });
    }
  }

  return { supabaseUrl, serviceRoleKey };
}

const { supabaseUrl, serviceRoleKey } = getEnvVars();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env files");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...\n");

  // 1. Delete rows from custom tables
  const tables = ["notifications", "deals", "otp_codes", "sessions", "profiles", "users"];

  for (const table of tables) {
    console.log(`Deleting rows from table: '${table}'...`);
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.warn(`  ⚠️ Could not delete from '${table}':`, error.message);
    } else {
      console.log(`  ✅ Cleaned '${table}' table.`);
    }
  }

  // 2. Delete auth users from Supabase Auth
  console.log("\nFetching Supabase Auth users...");
  const { data: authUsersData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Error listing auth users:", listError.message);
  } else if (authUsersData && authUsersData.users) {
    console.log(`Found ${authUsersData.users.length} auth user(s). Deleting...`);
    for (const user of authUsersData.users) {
      const { error: deleteErr } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteErr) {
        console.error(`  ❌ Failed to delete user ${user.id} (${user.email}):`, deleteErr.message);
      } else {
        console.log(`  ✅ Deleted user ${user.email || user.phone || user.id}`);
      }
    }
  }

  console.log("\n🎉 Database cleanup finished successfully!");
}

cleanDatabase().catch((err) => {
  console.error("Fatal error during database cleanup:", err);
  process.exit(1);
});
