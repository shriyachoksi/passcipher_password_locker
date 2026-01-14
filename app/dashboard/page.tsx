import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) redirect("/auth/login");

  // ✅ Render a synchronous wrapper, not async itself
  return <DashboardClientWrapper user={data.user} />;
}

// This wrapper is synchronous and safe to render Client Components
function DashboardClientWrapper({ user }: { user: any }) {
  return <DashboardClient user={user} />;
}
