import { NextResponse } from "next/server";
import { qontoFetch } from "@/lib/qonto/client";

interface QontoQuoteResponse {
  quote?: {
    attachment_id?: unknown;
    number?: unknown;
  };
}

interface QontoAttachmentResponse {
  attachment?: {
    url?: unknown;
    file_name?: unknown;
    file_content_type?: unknown;
  };
}

/**
 * Safely converts an unknown value to a non-empty string.
 */
function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Builds a safe filename to avoid invalid Content-Disposition values.
 */
function toSafeFilename(base: string): string {
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * GET /api/qonto/quotes/[id]/pdf
 * Downloads a quote attachment from Qonto and streams it as a PDF file.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const login = process.env.QONTO_LOGIN;
  const secretKey = process.env.QONTO_SECRET_KEY;
  if (!login || !secretKey) {
    return NextResponse.json({ error: "Qonto not configured" }, { status: 500 });
  }

  const { id } = await params;
  const quoteId = id.trim();
  if (!quoteId) {
    return NextResponse.json({ error: "Quote id is required" }, { status: 400 });
  }

  try {
    const quoteResponse = await qontoFetch<QontoQuoteResponse>(
      `/v2/quotes/${encodeURIComponent(quoteId)}`,
      { login, secretKey }
    );

    const quote = quoteResponse.quote;
    const attachmentId = toStringOrNull(quote?.attachment_id);
    if (!attachmentId) {
      return NextResponse.json(
        { error: "No attachment found for this quote" },
        { status: 404 }
      );
    }

    const attachmentResponse = await qontoFetch<QontoAttachmentResponse>(
      `/v2/attachments/${encodeURIComponent(attachmentId)}`,
      { login, secretKey }
    );
    const attachment = attachmentResponse.attachment;
    const attachmentUrl = toStringOrNull(attachment?.url);
    if (!attachmentUrl) {
      return NextResponse.json(
        { error: "Could not retrieve attachment URL" },
        { status: 404 }
      );
    }

    const fileResponse = await fetch(attachmentUrl);
    if (!fileResponse.ok) {
      const payload = await fileResponse.text();
      return NextResponse.json(
        { error: `Failed to download attachment: ${fileResponse.status} ${payload}` },
        { status: 502 }
      );
    }

    const quoteNumber = toStringOrNull(quote?.number);
    const qontoFileName = toStringOrNull(attachment?.file_name);
    const rawFilename = qontoFileName ?? quoteNumber ?? `quote-${quoteId}.pdf`;
    const safeFilename = toSafeFilename(
      rawFilename.toLowerCase().endsWith(".pdf") ? rawFilename : `${rawFilename}.pdf`
    );
    const contentType =
      toStringOrNull(attachment?.file_content_type) ?? "application/pdf";

    return new Response(fileResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download quote PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
