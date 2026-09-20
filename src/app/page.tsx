import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdminEmail, DEFAULT_REDIRECT_URL } from "@/lib/auth";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    if (isAuthorizedAdminEmail(user.email)) {
      redirect("/admin");
    }

    try {
      const { data: adminRecord } = await supabase
        .from("admin_users")
        .select("email")
        .ilike("email", user.email.trim().toLowerCase())
        .maybeSingle();

      if (adminRecord) {
        redirect("/admin");
      }
    } catch {
      // ignore db error
    }
  }

  // Not logged in or unauthorized: redirect to official GDG CRCE website
  redirect(DEFAULT_REDIRECT_URL);
}
