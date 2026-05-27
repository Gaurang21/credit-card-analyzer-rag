import "server-only";

/**
 * Extract text from an uploaded PDF buffer. We avoid the top-level `pdf-parse`
 * import because it auto-runs a self-test against a missing fixture in some
 * bundlers; importing the inner module directly side-steps that.
 */
export async function parsePdfBuffer(buf: ArrayBuffer | Uint8Array): Promise<string> {
  const data = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (
    data: Buffer,
  ) => Promise<{ text: string }>;
  const result = await pdfParse(Buffer.from(data));
  return (result.text ?? "").trim();
}
