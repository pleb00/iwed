"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import {
  MAX_GUEST_MESSAGE_LENGTH,
  MAX_GUEST_NAME_LENGTH,
  validateGuestMessage,
  type GuestMessage,
} from "@/lib/guest-messages";
import {
  readGuestMessages,
  saveGuestMessage,
  type GuestMessageCursor,
} from "@/lib/guest-message-store";

export default function GuestMessages({
  initialName,
  timeZone,
}: {
  initialName: string;
  timeZone: string;
}) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [reload, setReload] = useState(0);
  const [nextCursor, setNextCursor] = useState<GuestMessageCursor | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const submitting = useRef(false);
  const fetchingMore = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    readGuestMessages({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setMessages(result.messages);
          setNextCursor(result.nextCursor);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || loading || loadError) return;

    const input = validateGuestMessage({ name, message });
    if (!input) {
      setSubmitError(true);
      setFeedback("Silakan isi nama dan ucapan Anda sesuai batas karakter.");
      return;
    }

    submitting.current = true;
    setSending(true);
    setSubmitError(false);
    setFeedback("");
    try {
      const savedMessage = await saveGuestMessage(input);
      setMessages((current) => [savedMessage, ...current]);
      setMessage("");
      setName(input.name);
      setFeedback("Terima kasih! Ucapan Anda sudah tersimpan.");
    } catch (error) {
      setSubmitError(true);
      setFeedback(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "Ucapan belum terkirim. Periksa koneksi Anda dan coba lagi.",
      );
    } finally {
      submitting.current = false;
      setSending(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor || fetchingMore.current) return;
    fetchingMore.current = true;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const result = await readGuestMessages({ before: nextCursor });
      setMessages((current) => {
        const knownIds = new Set(current.map((entry) => entry.id));
        return [...current, ...result.messages.filter((entry) => !knownIds.has(entry.id))];
      });
      setNextCursor(result.nextCursor);
    } catch {
      setMoreError(true);
    } finally {
      fetchingMore.current = false;
      setLoadingMore(false);
    }
  };

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });

  return (
    <section id="messages" className="section messages-section" aria-labelledby="messages-heading">
      <span className="eyebrow">SEPATAH KATA, SEJUTA MAKNA</span>
      <h2 id="messages-heading">Ucapan & doa</h2>
      <p className="section-intro">
        Tinggalkan ucapan dan doa untuk mengiringi awal perjalanan kami bersama.
      </p>
      <div className="guestbook">
        <form className="message-form" onSubmit={submit} aria-busy={sending}>
          <label htmlFor="message-name">Nama Anda</label>
          <input
            id="message-name"
            name="name"
            autoComplete="name"
            placeholder="Tulis nama Anda"
            required
            maxLength={MAX_GUEST_NAME_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={sending}
          />
          <div className="message-label">
            <label htmlFor="message-text">Ucapan & doa</label>
            <span id="message-limit">{message.length}/{MAX_GUEST_MESSAGE_LENGTH}</span>
          </div>
          <textarea
            id="message-text"
            name="message"
            placeholder="Selamat menempuh hidup baru..."
            rows={5}
            required
            maxLength={MAX_GUEST_MESSAGE_LENGTH}
            aria-describedby="message-limit message-public-note"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={sending}
          />
          <p id="message-public-note" className="message-note">
            Nama dan ucapan Anda akan ditampilkan di undangan ini.
          </p>
          <button className="button" type="submit" disabled={sending || loading || loadError}>
            <Send size={15} aria-hidden="true" />
            {sending ? "Mengirim..." : "Kirim ucapan"}
          </button>
          <p className={`message-feedback${submitError ? " is-error" : ""}`} role="status" aria-live="polite">
            {feedback}
          </p>
        </form>
        <div className="guestbook-messages" aria-busy={loading}>
          <h3><MessageCircle size={19} strokeWidth={1.5} aria-hidden="true" /> Doa dari orang terkasih</h3>
          {loading ? (
            <p className="message-empty" role="status">Memuat ucapan...</p>
          ) : loadError ? (
            <div className="message-empty" role="status">
              <p>Ucapan belum dapat dimuat. Silakan coba lagi.</p>
              <button className="copy-button" type="button" onClick={() => setReload((value) => value + 1)}>
                Coba lagi
              </button>
            </div>
          ) : messages.length === 0 ? (
            <p className="message-empty">Belum ada ucapan. Jadilah yang pertama mengirim doa untuk kami.</p>
          ) : (
            <ul className="message-list" tabIndex={0} aria-label="Ucapan tamu">
              {messages.map((entry) => (
                <li className="message-card" key={entry.id}>
                  <div className="message-card-heading">
                    <strong>{entry.name}</strong>
                    <time dateTime={entry.createdAt}>{dateFormatter.format(new Date(entry.createdAt))}</time>
                  </div>
                  <p>{entry.message}</p>
                </li>
              ))}
            </ul>
          )}
          {nextCursor && !loading && !loadError && (
            <div className="message-pagination">
              <button className="copy-button" type="button" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? "Memuat..." : "Muat ucapan lainnya"}
              </button>
              {moreError && <p className="message-feedback is-error" role="status">Ucapan lainnya belum dapat dimuat. Silakan coba lagi.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
