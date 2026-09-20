import { notFound } from "next/navigation";
import { getLinkAnalytics } from "@/lib/actions";
import { getAppBaseUrl } from "@/lib/utils";
import AnalyticsView from "./AnalyticsView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const { id } = await params;
  const analytics = await getLinkAnalytics(id);

  if (!analytics) {
    notFound();
  }

  const baseUrl = getAppBaseUrl();

  return <AnalyticsView data={analytics} baseUrl={baseUrl} />;
}
