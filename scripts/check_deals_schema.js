import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.development");
let supabaseUrl = "";
let serviceRoleKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
      if (key === "SUPABASE_SERVICE_ROLE_KEY") serviceRoleKey = val;
    }
  });
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Select a single row to see columns
  const { data, error } = await supabase.from("deals").select("*").limit(1);
  if (error) {
    console.error("Error fetching deal:", error);
    // If it fails, let's list column names from postgres
    const { data: cols, error: colError } = await supabase.rpc("get_columns", { table_name: "deals" });
    console.log("Cols via RPC:", cols, colError);
  } else {
    console.log("Deals row columns:", Object.keys(data[0] || {}));
  }
}

run();
