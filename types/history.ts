import { Transaction } from "./transaction";

export interface HistoryEntry {
  id: string;
  title: string;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryFormData {
  title: string;
}
