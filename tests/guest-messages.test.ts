import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { validateGuestMessage } from "../lib/guest-messages";
import { GUEST_MESSAGES_PAGE_SIZE, readGuestMessages, saveGuestMessage } from "../lib/guest-message-store";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const row = (index = 1) => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  name: "Tamu",
  message: "Selamat!\n<script>text only</script>",
  created_at: "2026-10-27T10:20:30.123456+00:00",
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co/";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
});
afterEach(() => {
  mock.restoreAll();
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

test("validates names, multiline text and character boundaries", () => {
  assert.deepEqual(validateGuestMessage({ name: "  Tamu\t", message: "\nSelamat!\nDoa kami.  " }), {
    name: "Tamu", message: "Selamat!\nDoa kami.",
  });
  assert.ok(validateGuestMessage({ name: "x".repeat(80), message: "x".repeat(1000) }));
  for (const invalid of [null, [], {}, { name: 123, message: "Hi" }, { name: "\n\t ", message: "Hi" }, { name: "Guest", message: "\n\t " }, { name: "x".repeat(81), message: "Hi" }, { name: "Guest", message: "x".repeat(1001) }]) {
    assert.equal(validateGuestMessage(invalid), null);
  }
});

test("loads uncached public messages, maps database fields and forwards cancellation", async () => {
  const signal = new AbortController().signal;
  const request = mock.method(globalThis, "fetch", async () => Response.json([row()]));
  const result = await readGuestMessages({ signal });
  assert.deepEqual(result, {
    messages: [{ id: row().id, name: row().name, message: row().message, createdAt: row().created_at }],
    nextCursor: null,
  });
  const [endpoint, options] = request.mock.calls[0].arguments as [URL, RequestInit];
  assert.equal(endpoint.origin, "https://example.supabase.co");
  assert.equal(endpoint.pathname, "/rest/v1/guest_messages");
  assert.equal(endpoint.searchParams.get("order"), "created_at.desc,id.desc");
  assert.equal(options.cache, "no-store");
  assert.equal(options.signal, signal);
  assert.deepEqual(options.headers, { apikey: "sb_publishable_test" });
});

test("paginates using both timestamp and ID without losing microsecond precision", async () => {
  const request = mock.method(globalThis, "fetch", async () => Response.json(
    Array.from({ length: GUEST_MESSAGES_PAGE_SIZE + 1 }, (_, index) => row(30 - index)),
  ));
  const first = await readGuestMessages();
  assert.equal(first.messages.length, GUEST_MESSAGES_PAGE_SIZE);
  assert.equal(first.nextCursor?.id, row(11).id);
  await readGuestMessages({ before: first.nextCursor! });
  const [endpoint] = request.mock.calls[1].arguments as [URL];
  assert.equal(endpoint.searchParams.get("limit"), String(GUEST_MESSAGES_PAGE_SIZE + 1));
  assert.equal(endpoint.searchParams.get("or"), `(created_at.lt.${row().created_at},and(created_at.eq.${row().created_at},id.lt.${row(11).id}))`);
});

test("rejects unsafe cursors before making a request", async () => {
  const request = mock.method(globalThis, "fetch", async () => Response.json([]));
  await assert.rejects(readGuestMessages({ before: { id: "bad),id.gt.0", createdAt: row().created_at } }));
  await assert.rejects(readGuestMessages({ before: { id: row().id, createdAt: "bad),id.gt.0" } }));
  assert.equal(request.mock.callCount(), 0);
});

test("saves only trimmed guest fields and uses the database ID and date", async () => {
  const request = mock.method(globalThis, "fetch", async () => Response.json([row()], { status: 201 }));
  const saved = await saveGuestMessage({ name: "  Tamu  ", message: `  ${row().message}  `, id: "forged" } as Parameters<typeof saveGuestMessage>[0]);
  const [, options] = request.mock.calls[0].arguments as [URL, RequestInit];
  assert.equal(options.method, "POST");
  assert.deepEqual(JSON.parse(String(options.body)), { name: "Tamu", message: row().message });
  assert.deepEqual(options.headers, {
    apikey: "sb_publishable_test", "Content-Type": "application/json", Prefer: "return=representation",
  });
  assert.equal(saved.id, row().id);
  assert.equal(saved.createdAt, row().created_at);
});

test("invalid submissions never reach Supabase", async () => {
  const request = mock.method(globalThis, "fetch", async () => Response.json([]));
  await assert.rejects(saveGuestMessage({ name: "Guest", message: "\t\n" }));
  await assert.rejects(saveGuestMessage({ name: "Guest", message: "x".repeat(1001) }));
  assert.equal(request.mock.callCount(), 0);
});

test("database errors produce readable feedback without exposing database details", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: "private database detail" }, { status: 403 }));
  await assert.rejects(readGuestMessages(), { message: "Ucapan belum dapat dimuat. Silakan coba lagi." });
  await assert.rejects(saveGuestMessage({ name: "Guest", message: "Hello" }), { message: "Ucapan belum terkirim. Silakan coba lagi." });
});

test("rejects malformed responses and missing or secret credentials", async () => {
  const request = mock.method(globalThis, "fetch", async () => Response.json([{ ...row(), created_at: "invalid" }]));
  await assert.rejects(readGuestMessages());
  request.mock.mockImplementation(async () => Response.json({ messages: [] }));
  await assert.rejects(readGuestMessages());
  request.mock.mockImplementation(async () => Response.json([]));
  await assert.rejects(saveGuestMessage({ name: "Guest", message: "Hello" }));
  const calls = request.mock.callCount();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await assert.rejects(readGuestMessages(), /Ucapan belum tersedia/);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_do_not_use";
  await assert.rejects(readGuestMessages(), /Ucapan belum tersedia/);
  assert.equal(request.mock.callCount(), calls);
});
