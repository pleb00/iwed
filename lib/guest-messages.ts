export const MAX_GUEST_NAME_LENGTH = 80;
export const MAX_GUEST_MESSAGE_LENGTH = 1000;

export type GuestMessage = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

export function validateGuestMessage(value: unknown): {
  name: string;
  message: string;
} | null {
  if (!value || typeof value !== "object") return null;

  const { name, message } = value as Record<string, unknown>;
  if (typeof name !== "string" || typeof message !== "string") return null;

  const trimmedName = name.trim();
  const trimmedMessage = message.trim();
  if (
    !trimmedName ||
    trimmedName.length > MAX_GUEST_NAME_LENGTH ||
    !trimmedMessage ||
    trimmedMessage.length > MAX_GUEST_MESSAGE_LENGTH
  ) {
    return null;
  }

  return { name: trimmedName, message: trimmedMessage };
}
