/**
 * Gemini API Integration Client & Schema for DocuSmart AI
 *
 * This module defines the structured extraction schema, prompt templates,
 * and client helper ready to be connected with Google Gemini API
 * (gemini-2.0-flash / gemini-1.5-pro) for Intelligent Document Processing.
 */

import type { ExtractedFields, ValidationWarning } from './types';

export interface GeminiExtractionResponse {
  success: boolean;
  confidence: number;
  extractedFields: ExtractedFields;
  validationWarnings: ValidationWarning[];
  rawText?: string;
  error?: string;
}

export const GEMINI_SYSTEM_INSTRUCTION = `
You are DocuSmart AI's enterprise Intelligent Document Processing (IDP) engine.
Your role is to analyze invoices, receipts, and commercial documents from PDFs and images.
Extract all key header fields, line items, totals, dates, and vendor information with high precision.
If a field is missing, ambiguous, or mathematically conflicting, flag it in validationWarnings.
Return output strictly in structured JSON matching this schema:
{
  "vendorName": string,
  "vendorAddress"?: string,
  "invoiceNumber": string,
  "poNumber"?: string,
  "invoiceDate": string (YYYY-MM-DD),
  "dueDate"?: string (YYYY-MM-DD),
  "paymentTerms"?: string,
  "subtotal"?: number,
  "tax"?: number,
  "total": number,
  "currency": string (ISO 3-letter, e.g. USD),
  "confidence": number (integer 0-100),
  "lineItems"?: [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "validationWarnings"?: [
    {
      "field": string,
      "message": string,
      "severity": "low" | "medium" | "high"
    }
  ]
}
`;

export const GEMINI_EXTRACTION_PROMPT = `
Analyze the attached document and extract the following invoice data into JSON:
1. Vendor details: vendorName, vendorAddress
2. Invoice identification: invoiceNumber, poNumber, paymentTerms
3. Key dates: invoiceDate (YYYY-MM-DD), dueDate (YYYY-MM-DD)
4. Financials: currency (ISO-4217), subtotal, tax, total
5. Detailed line items: description, quantity, unitPrice, total
6. Validation warnings: list any missing required fields, illegible items, or tax/subtotal calculation discrepancies.

Ensure confidence is estimated as an integer between 0 and 100 based on OCR clarity and document consistency.
Return valid JSON only.
`;

/**
 * Validates whether the Gemini API key is configured.
 */
export function isGeminiConfigured(overrideKey?: string): boolean {
  const key = overrideKey || process.env.GEMINI_API_KEY;
  return Boolean(key && key !== 'your_gemini_api_key_here' && key.trim().length > 10);
}

/**
 * Executes multimodal document extraction with Google Gemini 2.0 Flash.
 * If no key is supplied, returns a descriptive error guiding the user to configure their key.
 */
export async function extractDocumentWithGemini(
  fileBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
  apiKeyOverride?: string
): Promise<GeminiExtractionResponse> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim().length < 10) {
    return {
      success: false,
      confidence: 0,
      extractedFields: {
        vendorName: fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        invoiceNumber: `INV-${new Date().getFullYear()}-0000`,
        invoiceDate: new Date().toISOString().split('T')[0],
        total: 0,
        currency: 'USD',
      },
      validationWarnings: [
        {
          field: 'apiKey',
          message: 'GEMINI_API_KEY is not configured yet. Set GEMINI_API_KEY in .env.local or in Settings > Integrations to activate live AI processing.',
          severity: 'medium',
        },
      ],
      error: 'GEMINI_API_KEY_MISSING',
    };
  }

  try {
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;

    const promptText = `${GEMINI_SYSTEM_INSTRUCTION}\n\n${GEMINI_EXTRACTION_PROMPT}\n\nFile: ${fileName}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorMsg = errorJson.error?.message || `Gemini API returned HTTP status ${res.status}`;
      return {
        success: false,
        confidence: 0,
        extractedFields: {
          vendorName: fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
          invoiceNumber: `INV-${new Date().getFullYear()}-0000`,
          invoiceDate: new Date().toISOString().split('T')[0],
          total: 0,
          currency: 'USD',
        },
        validationWarnings: [
          {
            field: 'gemini',
            message: errorMsg,
            severity: 'high',
          },
        ],
        error: errorMsg,
      };
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No candidate content received from Gemini model.');
    }

    // Clean JSON response (strip markdown fences if present)
    const jsonStr = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 94,
      extractedFields: {
        vendorName: parsed.vendorName || parsed.vendor || 'Extracted Vendor',
        vendorAddress: parsed.vendorAddress,
        invoiceNumber: parsed.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: parsed.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: parsed.dueDate,
        subtotal: parsed.subtotal != null ? Number(parsed.subtotal) : undefined,
        tax: parsed.tax != null ? Number(parsed.tax) : undefined,
        total: Number(parsed.total) || 0,
        currency: parsed.currency || 'USD',
        paymentTerms: parsed.paymentTerms || 'Net 30',
        poNumber: parsed.poNumber,
        lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      },
      validationWarnings: Array.isArray(parsed.validationWarnings) ? parsed.validationWarnings : [],
      rawText: candidateText,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during Gemini document extraction';
    return {
      success: false,
      confidence: 0,
      extractedFields: {
        vendorName: fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        invoiceNumber: `INV-${new Date().getFullYear()}-0000`,
        invoiceDate: new Date().toISOString().split('T')[0],
        total: 0,
        currency: 'USD',
      },
      validationWarnings: [
        { field: 'extraction', message, severity: 'high' },
      ],
      error: message,
    };
  }
}
