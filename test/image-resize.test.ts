import { describe, it, expect } from "vitest";
import sharp from "sharp";

/**
 * Exercises the same resize logic used in api/analyze-face.js:
 *   sharp(buffer).resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
 *     .toFormat('jpeg', { quality: 85 })
 *     .toBuffer()
 */
async function resizeForApi(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2048, 2048, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat("jpeg", { quality: 85 })
    .toBuffer();
}

async function createTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 150, b: 100 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
}

describe("image resizing (api/analyze-face.js resize behavior)", () => {
  const testCases = [
    { name: "small (500x500)", width: 500, height: 500 },
    { name: "medium (1024x1024)", width: 1024, height: 1024 },
    { name: "large (4000x3000)", width: 4000, height: 3000 },
    { name: "extra large (8000x6000)", width: 8000, height: 6000 },
  ];

  for (const { name, width, height } of testCases) {
    it(`resizes ${name} to fit within 2048x2048 while preserving aspect ratio`, async () => {
      const original = await createTestImage(width, height);
      const resized = await resizeForApi(original);
      const metadata = await sharp(resized).metadata();

      expect(metadata.width).toBeLessThanOrEqual(2048);
      expect(metadata.height).toBeLessThanOrEqual(2048);

      const originalAspect = width / height;
      const resizedAspect = (metadata.width ?? 0) / (metadata.height ?? 1);
      expect(resizedAspect).toBeCloseTo(originalAspect, 2);
    });
  }

  it("does not enlarge images smaller than the target box", async () => {
    const original = await createTestImage(500, 500);
    const resized = await resizeForApi(original);
    const metadata = await sharp(resized).metadata();

    expect(metadata.width).toBe(500);
    expect(metadata.height).toBe(500);
  });

  it("downscales large images so the longest edge is exactly 2048", async () => {
    const original = await createTestImage(4000, 3000);
    const resized = await resizeForApi(original);
    const metadata = await sharp(resized).metadata();

    expect(metadata.width).toBe(2048);
    expect(metadata.height).toBe(1536);
  });

  it("produces a decodable, non-empty JPEG buffer", async () => {
    const original = await createTestImage(4000, 3000);
    const resized = await resizeForApi(original);

    expect(resized.length).toBeGreaterThan(0);

    const metadata = await sharp(resized).metadata();
    expect(metadata.format).toBe("jpeg");
  });

  it("reduces output size for large images compared to the original", async () => {
    const original = await createTestImage(8000, 6000);
    const resized = await resizeForApi(original);

    expect(resized.length).toBeLessThan(original.length);
  });

  it("produces a base64-encodable buffer matching the resized bytes", async () => {
    const original = await createTestImage(1024, 1024);
    const resized = await resizeForApi(original);
    const base64 = resized.toString("base64");

    expect(base64.length).toBeGreaterThan(0);
    expect(Buffer.from(base64, "base64").equals(resized)).toBe(true);
  });
});
