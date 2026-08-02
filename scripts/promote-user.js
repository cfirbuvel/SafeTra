import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env.development
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.development");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node scripts/promote-user.js <email_or_phone> <role: admin|lawyer|user>");
  process.exit(1);
}

const contact = args[0];
const targetRole = args[1].toLowerCase();

if (!["admin", "lawyer", "user"].includes(targetRole)) {
  console.error("Error: Role must be admin, lawyer, or user");
  process.exit(1);
}

async function run() {
  console.log(`Searching for profile with contact: "${contact}"...`);
  
  // Find profile by email or phone
  const { data: profiles, error: findError } = await supabase
    .from("profiles")
    .select("id, email, phone, full_name, role");

  if (findError) {
    console.error("Error fetching profiles:", findError);
    process.exit(1);
  }

  const profile = profiles.find(
    (p) => 
      (p.email && p.email.toLowerCase() === contact.toLowerCase()) || 
      (p.phone && p.phone === contact)
  );

  if (!profile) {
    console.error(`Profile not found for: "${contact}"`);
    console.log("Available profiles:");
    profiles.forEach((p) => {
      console.log(`- Name: ${p.full_name}, Email: ${p.email}, Phone: ${p.phone}, Current Role: ${p.role}`);
    });
    process.exit(1);
  }

  console.log(`Found user: ${profile.full_name} (${profile.email || "No Email"})`);
  console.log(`Updating role from "${profile.role}" to "${targetRole}"...`);

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ role: targetRole })
    .eq("id", profile.id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating role:", updateError);
    console.log("\nNOTE: If you get a 'new row violates row-level security' or 'invalid input value for enum user_role' error, please make sure you ran the SQL commands in add_admin_role.sql inside the Supabase SQL editor first.");
    process.exit(1);
  }

  console.log("SUCCESS! Profile updated:");
  console.log(updatedProfile);
}

run();
