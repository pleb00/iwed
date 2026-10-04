import { notFound } from "next/navigation";
import Invitation from "../invitation";
import { guests } from "@/lib/guests";

export const dynamicParams = false;

export function generateStaticParams() {
  return guests.map(({ slug }) => ({ slug }));
}

export default async function GuestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guest = guests.find((entry) => entry.slug === slug);
  if (!guest) notFound();

  return <Invitation recipient={guest} />;
}
