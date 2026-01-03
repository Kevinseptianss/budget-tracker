export interface Transaction {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionFormData = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;

export const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Accommodation",
  "Entertainment",
  "Shopping",
  "Health & Medical",
  "Travel",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
