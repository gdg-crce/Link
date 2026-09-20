import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase credentials are not configured yet, allow viewing login page or home page
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const DEFAULT_REDIRECT_URL = process.env.DEFAULT_REDIRECT_URL || "https://gdgcrce.com";

  // Function to check if user email is authorized
  const checkAdminAuthorized = async (userEmail?: string | null): Promise<boolean> => {
    if (!userEmail) return false;

    const normalized = userEmail.trim().toLowerCase();

    // 1. Check ADMIN_EMAILS environment variable or built-in defaults
    const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
    const allowed = (adminEmailsEnv ? adminEmailsEnv.split(",") : [
      "varadaj47@gmail.com",
      "gdgcrce@gmail.com",
    ])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowed.includes(normalized)) {
      return true;
    }

    // 2. Check admin_users database table
    try {
      const { data: adminRecord } = await supabase
        .from("admin_users")
        .select("email")
        .ilike("email", normalized)
        .maybeSingle();

      if (adminRecord) {
        return true;
      }
    } catch {
      // In case table does not exist or connection fails
    }

    return false;
  };

  // 1. Root route protection (link.gdgcrce.com/)
  // Only authorized admins can access; everyone else is redirected to the main chapter website
  if (pathname === "/") {
    if (user) {
      const isAuthorized = await checkAdminAuthorized(user.email);
      if (isAuthorized) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.redirect(DEFAULT_REDIRECT_URL);
  }

  // 2. Convenience redirect: /login -> /admin/login
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // 3. Protect all /admin routes (except the login portal)
  // If not logged in or not authorized, redirect directly to gdgcrce.com
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      return NextResponse.redirect(DEFAULT_REDIRECT_URL);
    }

    const isAuthorized = await checkAdminAuthorized(user.email);
    if (!isAuthorized) {
      return NextResponse.redirect(DEFAULT_REDIRECT_URL);
    }
  }

  // 4. If already logged in on login page
  if (pathname === "/admin/login" && user) {
    const isAuthorized = await checkAdminAuthorized(user.email);
    if (isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    } else {
      return NextResponse.redirect(DEFAULT_REDIRECT_URL);
    }
  }

  // 5. All other routes (e.g., /apply, /discord, /bitnbuild) remain open to the public
  return response;
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with common extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
