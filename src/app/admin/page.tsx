import { getLinks, getDashboardStats } from "@/lib/actions";
import { getAppBaseUrl } from "@/lib/utils";
import AdminDashboardView from "@/components/AdminDashboardView";

export const revalidate = 0; // Dynamic server rendering

export default async function AdminPage() {
  const links = await getLinks();
  const stats = await getDashboardStats();
  const baseUrl = getAppBaseUrl();

  return <AdminDashboardView links={links} stats={stats} baseUrl={baseUrl} />;
}
