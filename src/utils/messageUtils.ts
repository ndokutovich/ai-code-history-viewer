import type { UIMessage } from "../types";

// ============================================================================
// Message Type Guards
// ============================================================================

/**
 * Check if message is an assistant message
 */
export const isClaudeAssistantMessage = (msg: UIMessage): boolean =>
  msg.type === 'assistant';

/**
 * Check if message is a user message
 */
export const isClaudeUserMessage = (msg: UIMessage): boolean =>
  msg.type === 'user';

/**
 * Check if message is a system message
 */
export const isClaudeSystemMessage = (msg: UIMessage): boolean =>
  msg.type === 'system';

// ============================================================================
// Content Extraction
// ============================================================================

export const extractUIMessageContent = (
  message: UIMessage
): string | null => {
  // Direct string content
  if (typeof message.content === "string") {
    return message.content;
  }

  // Array content - extract text from first text block
  if (Array.isArray(message.content)) {
    const textBlock = message.content.find(
      (block): block is { type: "text"; text: string } => block.type === "text"
    );
    return textBlock?.text || null;
  }

  return null;
};

export const formatClaudeErrorOutput = (error: string) => {
  // Improve ESLint error formatting
  if (error.includes("eslint") && error.includes("error")) {
    return error
      .split("\n")
      .map((line) => {
        if (line.match(/^\s*\d+:\d+\s+error/)) {
          return `⚠️ ${line}`;
        }
        if (line.match(/^✖\s+\d+\s+problems/)) {
          return `\n${line}`;
        }
        return line;
      })
      .join("\n");
  }
  return error;
};

// Image-related utility functions
export const isImageUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;

  const value = url.trim();
  // Only a complete http(s) URL whose path ends in an image extension is an
  // image. A filename inside prose ("update logo.png") stays text; URL parsing
  // would normalize whitespace, so reject it first (upstream #720).
  if (!/^https?:\/\//i.test(value) || /\s/.test(value)) return false;

  try {
    const parsed = new URL(value);
    return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

export const isBase64Image = (data: string): boolean => {
  if (!data || typeof data !== "string") return false;

  // MIME parameters may precede ;base64. The whole value must be the data URL,
  // so prose and code containing one stay text.
  const match =
    /^data:image\/[a-z0-9.+-]+(?:;[a-z0-9!#$%&'*+.^_`|~-]+=[^;,\s]+)*;base64,([a-z0-9+/]+={0,2})$/i.exec(
      data.trim()
    );
  const payload = match?.[1];
  if (!payload) return false;

  // Browsers accept unpadded Base64, but a padded value must fill complete
  // quartets and a lone leftover character can never encode a byte.
  return payload.includes("=")
    ? payload.length % 4 === 0
    : payload.length % 4 !== 1;
};
