/**
 * The four substitution tokens the SD text-stamper replaces at generation time.
 * Must match the Prisma schema comment on Bubble.dialogue exactly.
 * When the backend worker is built, import this (or replicate) — mismatch = silent breakage.
 */
export const DIALOGUE_TOKENS = [
  "{name}",
  "{pronoun_subject}",
  "{pronoun_object}",
  "{pronoun_possessive}",
] as const;

export type DialogueToken = typeof DIALOGUE_TOKENS[number];

export const DIALOGUE_TOKEN_SET = new Set<string>(DIALOGUE_TOKENS);

export const DIALOGUE_TOKEN_LABELS: Record<DialogueToken, string> = {
  "{name}": "Name",
  "{pronoun_subject}": "Subject",
  "{pronoun_object}": "Object",
  "{pronoun_possessive}": "Possessive",
};

/** Sample substitution values for preview. */
export const SAMPLE_NAMES = {
  short: "Aarav",
  long: "Christopher",
};

export const SAMPLE_PRONOUNS: Record<string, string> = {
  "{pronoun_subject}": "he",
  "{pronoun_object}": "him",
  "{pronoun_possessive}": "his",
};

/**
 * Finds any `{...}` string that is not a valid token.
 */
export function findInvalidTokens(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\{[^}]*\}/g);
  if (!matches) return [];
  return matches.filter((token) => !DIALOGUE_TOKEN_SET.has(token));
}

/**
 * Replaces tokens with sample values for preview.
 */
export function substituteTokens(
  text: string,
  name: string,
  pronouns: Record<string, string>
): string {
  if (!text) return "";
  let result = text.replace(/\{name\}/g, name);
  for (const [token, value] of Object.entries(pronouns)) {
    result = result.replace(new RegExp(token, "g"), value);
  }
  return result;
}
