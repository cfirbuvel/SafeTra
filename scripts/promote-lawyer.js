/**
 * ====================================================================
 * SafeTra - User Lawyer Promotion Script
 * ====================================================================
 * 
 * DESCRIPTION:
 * This CLI tool promotes any registered SafeTra user account to the 'lawyer' role.
 * Once promoted, the user gains access to the Lawyer Escrow Portal at `/lawyer`.
 * 
 * HOW TO RUN:
 * 
 * Option 1: Using npm shortcut (Recommended)
 *   npm run promote-lawyer <email_or_phone_or_name>
 * 
 * Option 2: Using Node directly
 *   node scripts/promote-lawyer.js <email_or_phone_or_name>
 * 
 * EXAMPLES:
 *   - Promote by Email:       npm run promote-lawyer cfirbuvel@gmail.com
 *   - Promote by Phone:       npm run promote-lawyer 0546999623
 *   - Promote by Full Name:   npm run promote-lawyer "יהודה מטרסו"
 *   - List all users:         npm run promote-lawyer
 * 
 * HOW IT WORKS:
 *   1. Reads Supabase URL and Service Role Key from .env.local or .env.development.
 *   2. Queries `public.profiles` to locate the user matching the given identifier.
 *   3. Updates `public.profiles.role` to 'lawyer'.
 *   4. Synchronizes `auth.users.user_metadata.role` to 'lawyer' via Supabase Admin API.
 * ====================================================================
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

/**
 * Helper function: Loads Supabase environment variables (.env.local, .env.development, .env)
 */
function loadEnv() {
  const envFiles = [".env.local", ".env.development", ".env"];
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
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

// 1. Initialize Supabase Admin Client using Service Role Key (bypasses RLS)
const { supabaseUrl, serviceRoleKey } = loadEnv();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env files");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 2. Parse command-line argument for user identifier
const args = process.argv.slice(2);
const contact = args[0]?.trim();

async function run() {
  console.log("⚖️ SafeTra Lawyer Promotion Tool");
  console.log("================================");

  // 3. Fetch all registered user profiles
  const { data: profiles, error: findError } = await supabase
    .from("profiles")
    .select("id, email, phone, full_name, role");

  if (findError) {
    console.error("❌ Error fetching profiles:", findError.message);
    process.exit(1);
  }

  // If no search argument was provided, display usage guide and current user roster
  if (!contact) {
    console.log("Usage: node scripts/promote-lawyer.js <email_or_phone_or_name>\n");
    console.log("📋 Current Registered Users:");
    if (!profiles || profiles.length === 0) {
      console.log("   (No profiles found in database)");
    } else {
      profiles.forEach((p, idx) => {
        console.log(`  ${idx + 1}. [${p.role.toUpperCase()}] ${p.full_name || "No Name"} | Email: ${p.email || "N/A"} | Phone: ${p.phone || "N/A"}`);
      });
    }
    console.log("\nExample: node scripts/promote-lawyer.js cfirbuvel@gmail.com");
    return;
  }

  // 4. Find matching user by ID, email, phone number, or full name
  const cleanContact = contact.toLowerCase().replace(/[\-\s]/g, "");
  const target = profiles.find((p) => {
    if (p.id === contact) return true;
    if (p.email && p.email.toLowerCase() === contact.toLowerCase()) return true;
    if (p.phone && p.phone.replace(/[\-\s]/g, "").includes(cleanContact)) return true;
    if (p.full_name && p.full_name.toLowerCase().includes(contact.toLowerCase())) return true;
    return false;
  });

  if (!target) {
    console.error(`❌ User not found matching: "${contact}"\n`);
    console.log("Available profiles:");
    profiles.forEach((p) => {
      console.log(` - ${p.full_name || "No Name"} (Email: ${p.email || "N/A"}, Phone: ${p.phone || "N/A"}) [Current Role: ${p.role}]`);
    });
    return;
  }

  console.log(`👤 Found user: ${target.full_name || "User"} (${target.email || target.phone || target.id})`);
  console.log(`🔄 Updating role from "${target.role}" -> "lawyer"...`);

  // 5. Update public.profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "lawyer" })
    .eq("id", target.id);

  if (profileError) {
    console.error("❌ Error updating profiles table:", profileError.message);
    process.exit(1);
  }

  // 6. Synchronize Supabase Auth user_metadata (ensures server session instantly sees new role)
  try {
    const { data: userRes } = await supabase.auth.admin.getUserById(target.id);
    const existingMeta = userRes?.user?.user_metadata || {};
    await supabase.auth.admin.updateUserById(target.id, {
      user_metadata: {
        ...existingMeta,
        role: "lawyer",
      },
    });
  } catch (metaErr) {
    console.warn("⚠️ Warning: Could not update Auth user_metadata:", metaErr.message);
  }

  // 7. Output success report
  console.log("\n🎉 SUCCESS! User has been promoted to lawyer role:");
  console.log(`   - Name: ${target.full_name || "User"}`);
  console.log(`   - Email: ${target.email || "N/A"}`);
  console.log(`   - Phone: ${target.phone || "N/A"}`);
  console.log(`   - Role: LAWYER ⚖️`);
  console.log("\nThe lawyer dashboard can now be accessed at: /lawyer");
}

run();
