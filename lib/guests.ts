import guestData from "@/data/guests.json";

export type Guest = {
  slug: string;
  name: string;
  partySize: number;
};

const slugs = new Set<string>();

export const guests: Guest[] = guestData.map((guest) => {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guest.slug) ||
    slugs.has(guest.slug) ||
    !guest.name.trim() ||
    !Number.isSafeInteger(guest.partySize) ||
    guest.partySize < 1
  ) {
    throw new Error(
      `Invalid guest entry: ${guest.slug}. Use a unique lowercase slug, a nonempty name, and a positive integer partySize.`,
    );
  }
  slugs.add(guest.slug);
  return guest;
});
