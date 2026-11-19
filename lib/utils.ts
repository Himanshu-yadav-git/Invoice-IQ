import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "processed":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "pending":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "review":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "rejected":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "duplicate":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "processing":
      return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    default:
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "processed":
      return "Processed";
    case "pending":
      return "Pending";
    case "review":
      return "In Review";
    case "rejected":
      return "Rejected";
    case "duplicate":
      return "Duplicate";
    case "processing":
      return "Processing";
    default:
      return status;
  }
}
