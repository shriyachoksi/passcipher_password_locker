import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          // NextResponse handles cookie serialization
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options?: any) {
          supabaseResponse.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      request.nextUrl.pathname !== "/" &&
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth") &&
      !request.nextUrl.pathname.startsWith("/sign-up")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("[v0] Middleware auth check failed:", error);
  }

  return supabaseResponse;
}
