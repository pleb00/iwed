import { validateGuestMessage, type GuestMessage } from "./guest-messages";

export const GUEST_MESSAGES_PAGE_SIZE = 20;
export type GuestMessageCursor = Pick<GuestMessage, "id" | "createdAt">;
export type GuestMessagePage = {
  messages: GuestMessage[];
  nextCursor: GuestMessageCursor | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const LOAD_ERROR = "Ucapan belum dapat dimuat. Silakan coba lagi.";
const SAVE_ERROR = "Ucapan belum terkirim. Silakan coba lagi.";

function connection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key?.startsWith("sb_publishable_")) {
    throw new Error("Ucapan belum tersedia. Silakan hubungi pemilik undangan.");
  }

  return {
    endpoint: new URL(`${url.replace(/\/$/, "")}/rest/v1/guest_messages`),
    // Publishable keys belong in apikey, not an Authorization Bearer header.
    headers: { apikey: key },
  };
}

function validCursor(value: GuestMessageCursor) {
  return UUID.test(value.id) && TIMESTAMP.test(value.createdAt) && Number.isFinite(Date.parse(value.createdAt));
}

function parseMessage(value: unknown): GuestMessage {
  if (!value || typeof value !== "object") throw new Error(LOAD_ERROR);
  const row = value as Record<string, unknown>;
  const input = validateGuestMessage(row);
  if (
    !input ||
    typeof row.id !== "string" ||
    typeof row.created_at !== "string" ||
    !validCursor({ id: row.id, createdAt: row.created_at })
  ) {
    throw new Error(LOAD_ERROR);
  }
  return { id: row.id, ...input, createdAt: row.created_at };
}

export async function readGuestMessages({
  before,
  signal,
}: {
  before?: GuestMessageCursor;
  signal?: AbortSignal;
} = {}): Promise<GuestMessagePage> {
  const { endpoint, headers } = connection();
  endpoint.searchParams.set("select", "id,name,message,created_at");
  endpoint.searchParams.set("order", "created_at.desc,id.desc");
  endpoint.searchParams.set("limit", String(GUEST_MESSAGES_PAGE_SIZE + 1));
  if (before) {
    if (!validCursor(before)) throw new Error(LOAD_ERROR);
    // A timestamp and ID cursor keeps older pages stable while guests submit.
    endpoint.searchParams.set(
      "or",
      `(created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id}))`,
    );
  }

  const response = await fetch(endpoint, { headers, cache: "no-store", signal });
  if (!response.ok) throw new Error(LOAD_ERROR);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error(LOAD_ERROR);
  const messages = rows.slice(0, GUEST_MESSAGES_PAGE_SIZE).map(parseMessage);
  return {
    messages,
    nextCursor: rows.length > GUEST_MESSAGES_PAGE_SIZE ? messages[messages.length - 1] : null,
  };
}

export async function saveGuestMessage(value: {
  name: string;
  message: string;
}): Promise<GuestMessage> {
  const input = validateGuestMessage(value);
  if (!input) throw new Error("Isi nama (maks. 80 karakter) dan ucapan (maks. 1000 karakter).");
  const { endpoint, headers } = connection();
  endpoint.searchParams.set("select", "id,name,message,created_at");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    // IDs and timestamps are assigned by Postgres. Guests can insert only these fields.
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(SAVE_ERROR);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error(SAVE_ERROR);
  return parseMessage(rows[0]);
}
