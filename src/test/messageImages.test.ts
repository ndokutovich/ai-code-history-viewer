/**
 * Image detection must only fire on a whole value. Prose that names a file,
 * code that contains a URL, and a data URL inside a sentence all stay text
 * (upstream #720).
 */
import { describe, it, expect } from "vitest";
import { isImageUrl, isBase64Image } from "../utils/messageUtils";

describe("isImageUrl", () => {
  it("accepts a complete http(s) URL whose path ends in an image extension", () => {
    expect(isImageUrl("https://example.com/a.png")).toBe(true);
    expect(isImageUrl("http://example.com/b.JPG")).toBe(true);
    expect(isImageUrl("https://example.com/a.png?w=200")).toBe(true);
    expect(isImageUrl("  https://example.com/a.webp  ")).toBe(true);
  });

  it("leaves prose and bare filenames as text", () => {
    expect(isImageUrl("Please update logo.png")).toBe(false);
    expect(isImageUrl("logo.png")).toBe(false);
    expect(isImageUrl("/tmp/logo.png")).toBe(false);
    expect(isImageUrl("see https://example.com/a.png here")).toBe(false);
    expect(isImageUrl("https://example.com/image.png/notes")).toBe(false);
  });

  it("does not treat data URLs as urls", () => {
    expect(isImageUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
  });
});

describe("isBase64Image", () => {
  it("accepts a whole image data URL", () => {
    expect(isBase64Image("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    // Unpadded Base64 is valid in browsers.
    expect(isBase64Image("data:image/jpeg;base64,iVBORw0KGgo")).toBe(true);
    // MIME parameters may precede ;base64.
    expect(isBase64Image("data:image/svg+xml;charset=utf-8;base64,PHN2Zz4=")).toBe(true);
  });

  it("rejects malformed encodings", () => {
    // A single leftover character cannot encode a byte.
    expect(isBase64Image("data:image/png;base64,abcde")).toBe(false);
    // Padded payload must fill complete quartets.
    expect(isBase64Image("data:image/png;base64,abc=")).toBe(true);
    expect(isBase64Image("data:image/png;base64,ab=")).toBe(false);
    expect(isBase64Image("data:image/png;base64,")).toBe(false);
  });

  it("does not fire inside a sentence", () => {
    expect(
      isBase64Image("look: data:image/png;base64,iVBORw0KGgo= please")
    ).toBe(false);
  });
});
