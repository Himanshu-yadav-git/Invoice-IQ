import { NextRequest, NextResponse } from 'next/server';
import { extractDocumentWithGemini, isGeminiConfigured } from '@/lib/gemini';

/**
 * POST /api/extract
 * Multimodal document processing endpoint.
 * Accepts multipart/form-data with a `file` field (PDF, JPG, PNG).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please attach a PDF, JPG, or PNG document.' },
        { status: 400 }
      );
    }

    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const fileName = file.name.toLowerCase();
    const isValidExt = fileName.endsWith('.pdf') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');

    if (!validMimes.includes(file.type) && !isValidExt) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}". Supported formats are PDF, JPG, and PNG.` },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const apiKeyHeader = req.headers.get('x-gemini-api-key') || undefined;
    const result = await extractDocumentWithGemini(buffer, file.type, file.name, apiKeyHeader);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error during document extraction';
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extract
 * Health and configuration status endpoint.
 */
export async function GET(req: NextRequest) {
  const apiKeyHeader = req.headers.get('x-gemini-api-key') || undefined;
  return NextResponse.json({
    status: 'healthy',
    service: 'DocuSmart AI Document Intelligence API',
    geminiConfigured: isGeminiConfigured(apiKeyHeader),
    supportedFormats: ['PDF', 'JPG', 'PNG'],
    maxFileSizeMb: 50,
    timestamp: new Date().toISOString(),
  });
}
