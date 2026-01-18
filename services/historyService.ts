import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Transaction, TransactionFormData } from "../types/transaction";
import { HistoryEntry } from "../types/history";
import { getTransactions } from "./transactionService";

const COLLECTION_NAME = "history";

const isOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

// Type for transaction data stored in Firestore
interface FirestoreTransaction {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: Timestamp;
  title?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Save current transactions as history entry
export const saveBudgetToHistory = async (title: string): Promise<string> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot save budget to history: No internet connection. Please check your connection and try again."
    );
  }

  if (!title.trim()) {
    throw new Error("Title is required");
  }

  try {
    // Get all current transactions
    const transactions = await getTransactions();

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      title: title.trim(),
      transactions: transactions.map((t) => ({
        ...t,
        date: Timestamp.fromDate(t.date),
        createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : null,
        updatedAt: t.updatedAt ? Timestamp.fromDate(t.updatedAt) : null,
      })),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error saving budget to history:", error);
    throw new Error("Failed to save budget to history. Please try again.");
  }
};

// Get all history entries
export const getHistoryEntries = async (): Promise<HistoryEntry[]> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot load history: No internet connection. Please check your connection and try again."
    );
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        transactions:
          (data.transactions as FirestoreTransaction[])?.map(
            (t: FirestoreTransaction) => ({
              ...t,
              date: t.date?.toDate() || new Date(),
              createdAt: t.createdAt?.toDate(),
              updatedAt: t.updatedAt?.toDate(),
            })
          ) || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }) as HistoryEntry[];
  } catch (error) {
    console.error("Error getting history entries:", error);
    throw new Error("Failed to load history. Please try again.");
  }
};

// Get specific history entry by ID
export const getHistoryEntry = async (id: string): Promise<HistoryEntry> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot load history entry: No internet connection. Please check your connection and try again."
    );
  }

  if (!id) {
    throw new Error("Invalid history ID");
  }

  try {
    const historyEntries = await getHistoryEntries();
    const entry = historyEntries.find((h) => h.id === id);

    if (!entry) {
      throw new Error("History entry not found");
    }

    return entry;
  } catch (error) {
    console.error("Error getting history entry:", error);
    throw new Error("Failed to load history entry. Please try again.");
  }
};

// Update transactions in a history entry
export const updateHistoryTransaction = async (
  historyId: string,
  transactionId: string,
  transactionData: Partial<TransactionFormData>
): Promise<void> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot update transaction: No internet connection. Please check your connection and try again."
    );
  }

  if (!historyId || !transactionId) {
    throw new Error("Invalid history ID or transaction ID");
  }

  try {
    const historyEntry = await getHistoryEntry(historyId);
    const transactionIndex = historyEntry.transactions.findIndex(
      (t) => t.id === transactionId
    );

    if (transactionIndex === -1) {
      throw new Error("Transaction not found in history");
    }

    const updatedTransaction = {
      ...historyEntry.transactions[transactionIndex],
      ...transactionData,
      date:
        transactionData.date ||
        historyEntry.transactions[transactionIndex].date,
      updatedAt: new Date(),
    };

    // Update the entire transactions array
    const updatedTransactions = [...historyEntry.transactions];
    updatedTransactions[transactionIndex] = updatedTransaction;

    const docRef = doc(db, COLLECTION_NAME, historyId);
    await updateDoc(docRef, {
      transactions: updatedTransactions.map((t) => ({
        ...t,
        date: Timestamp.fromDate(t.date),
        createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : null,
        updatedAt: t.updatedAt ? Timestamp.fromDate(t.updatedAt) : null,
      })),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating history transaction:", error);
    throw new Error("Failed to update transaction. Please try again.");
  }
};

// Add transaction to history entry
export const addTransactionToHistory = async (
  historyId: string,
  transactionData: TransactionFormData
): Promise<string> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot add transaction: No internet connection. Please check your connection and try again."
    );
  }

  if (!historyId) {
    throw new Error("Invalid history ID");
  }

  try {
    const historyEntry = await getHistoryEntry(historyId);
    const newTransactionId = `history_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newTransaction: Transaction = {
      id: newTransactionId,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTransactions = [...historyEntry.transactions, newTransaction];

    const docRef = doc(db, COLLECTION_NAME, historyId);
    await updateDoc(docRef, {
      transactions: updatedTransactions.map((t) => ({
        ...t,
        date: Timestamp.fromDate(t.date),
        createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : null,
        updatedAt: t.updatedAt ? Timestamp.fromDate(t.updatedAt) : null,
      })),
      updatedAt: Timestamp.now(),
    });

    return newTransactionId;
  } catch (error) {
    console.error("Error adding transaction to history:", error);
    throw new Error("Failed to add transaction. Please try again.");
  }
};

// Delete transaction from history entry
export const deleteTransactionFromHistory = async (
  historyId: string,
  transactionId: string
): Promise<void> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot delete transaction: No internet connection. Please check your connection and try again."
    );
  }

  if (!historyId || !transactionId) {
    throw new Error("Invalid history ID or transaction ID");
  }

  try {
    const historyEntry = await getHistoryEntry(historyId);
    const updatedTransactions = historyEntry.transactions.filter(
      (t) => t.id !== transactionId
    );

    const docRef = doc(db, COLLECTION_NAME, historyId);
    await updateDoc(docRef, {
      transactions: updatedTransactions.map((t) => ({
        ...t,
        date: Timestamp.fromDate(t.date),
        createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : null,
        updatedAt: t.updatedAt ? Timestamp.fromDate(t.updatedAt) : null,
      })),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error deleting transaction from history:", error);
    throw new Error("Failed to delete transaction. Please try again.");
  }
};
