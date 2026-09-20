import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.log("\n[WARNING] Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.log("------------------------------------------------------------------");
  console.log("1. Open Supabase: https://supabase.com/dashboard/project/zeqkprhqldmawidubcxh/settings/api");
  console.log("2. Copy your 'service_role' secret key.");
  console.log("3. Paste in .env.local: SUPABASE_SERVICE_ROLE_KEY=ey...");
  console.log("4. Run this script again: node scripts/create-users.mjs\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: "varadaj47@gmail.com", password: "GdgAdmin#Varad2026!" },
  { email: "gdgcrce@gmail.com", password: "GdgCrce#Official2026!" },
  { email: "abhishekjose780@gmail.com", password: "GdgAdmin#Abhishek2026!" },
];

console.log("\nSyncing Admin Users with Supabase Auth...\n");

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      // Find user and update password
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (existing) {
        const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
        });
        if (updateErr) {
          console.error(`[ERROR] Failed to update password for ${u.email}:`, updateErr.message);
        } else {
          console.log(`[SUCCESS] Set password for ${u.email}`);
        }
      }
    } else {
      console.error(`[ERROR] Error creating ${u.email}:`, error.message);
    }
  } else {
    console.log(`[SUCCESS] Created and confirmed user: ${u.email}`);
  }

  // Ensure also in admin_users table
  await supabase.from("admin_users").upsert(
    { email: u.email, role: "admin", notes: "Automated sync" },
    { onConflict: "email" }
  );
}

console.log("\nAll admin accounts are ready. You can now log in at http://localhost:3000/admin/login\n");
