export interface Transaction {
  id?: string;
  amount: number;
  description: string;
  category: string; // Will be category ID or name
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionFormData = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;

// Legacy categories - keeping for backward compatibility
export const LEGACY_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Accommodation",
  "Entertainment",
  "Shopping",
  "Health & Medical",
  "Travel",
  "Other",
] as const;

export type LegacyCategory = (typeof LEGACY_CATEGORIES)[number];
