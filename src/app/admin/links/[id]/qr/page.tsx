import { notFound } from "next/navigation";
import { getLinkById } from "@/lib/actions";
import { getAppBaseUrl } from "@/lib/utils";
import QrCodeView from "./QrCodeView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QrPage({ params }: Props) {
  const { id } = await params;
  const link = await getLinkById(id);

  if (!link) {
    notFound();
  }

  const baseUrl = getAppBaseUrl();
  const shortUrl = `${baseUrl}/${link.slug}`;

  return <QrCodeView link={link} shortUrl={shortUrl} />;
}
