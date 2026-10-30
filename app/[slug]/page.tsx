import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Invitation from "../invitation";
import { guests } from "@/lib/guests";
import wedding from "@/data/wedding.json";

export const metadata: Metadata = {
  title: `${wedding.couple.bride.name} & ${wedding.couple.groom.name} — The Wedding`,
  description: wedding.copy.invitation,
};

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
