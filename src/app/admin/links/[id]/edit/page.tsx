import { notFound } from "next/navigation";
import { getLinkById } from "@/lib/actions";
import EditLinkForm from "./EditLinkForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLinkPage({ params }: Props) {
  const { id } = await params;
  const link = await getLinkById(id);

  if (!link) {
    notFound();
  }

  return <EditLinkForm link={link} />;
}
