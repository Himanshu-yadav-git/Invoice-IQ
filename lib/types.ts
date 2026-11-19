// Shared TypeScript types for DocuSmart AI

export type DocumentStatus =
  | "processed"
  | "pending"
  | "review"
  | "rejected"
  | "duplicate"
  | "processing";

export interface Document {
  id: string;
  fileName: string;
  vendor: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: DocumentStatus;
  uploadedAt: string;
  pages: number;
  confidence: number; // 0-100
  fileType: "pdf" | "jpg" | "png";
  fileSize: number; // bytes
  category?: string;
  extractedFields?: ExtractedFields;
  validationWarnings?: ValidationWarning[];
}

export interface ExtractedFields {
  vendorName: string;
  vendorAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;
  lineItems?: LineItem[];
  paymentTerms?: string;
  poNumber?: string;
  bankDetails?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface ActivityItem {
  id: string;
  type: "upload" | "processed" | "approved" | "rejected" | "review";
  documentName: string;
  timestamp: string;
  user?: string;
  details?: string;
}

export interface DashboardStats {
  totalProcessed: number;
  successfulExtractions: number;
  pendingReviews: number;
  duplicates: number;
  processingToday: number;
  successRate: number;
}
