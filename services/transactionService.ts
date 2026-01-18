import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Transaction, TransactionFormData } from "../types/transaction";

const COLLECTION_NAME = "transactions";

const isOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

export const addTransaction = async (
  transactionData: TransactionFormData
): Promise<string> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot add transaction: No internet connection. Please check your connection and try again."
    );
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...transactionData,
      date: Timestamp.fromDate(transactionData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction to Firebase:", error);
    throw new Error("Failed to add transaction. Please try again.");
  }
};

export const updateTransaction = async (
  id: string,
  transactionData: Partial<TransactionFormData>
): Promise<void> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot update transaction: No internet connection. Please check your connection and try again."
    );
  }

  if (!id) {
    throw new Error("Invalid transaction ID");
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: {
      amount?: number;
      description?: string;
      category?: string;
      date?: Timestamp;
      updatedAt: Timestamp;
    } = {
      updatedAt: Timestamp.now(),
    };

    if (transactionData.amount !== undefined)
      updateData.amount = transactionData.amount;
    if (transactionData.description !== undefined)
      updateData.description = transactionData.description;
    if (transactionData.category !== undefined)
      updateData.category = transactionData.category;
    if (transactionData.date)
      updateData.date = Timestamp.fromDate(transactionData.date);

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating Firebase transaction:", error);
    throw new Error("Failed to update transaction. Please try again.");
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot delete transaction: No internet connection. Please check your connection and try again."
    );
  }

  if (!id) {
    throw new Error("Invalid transaction ID");
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting transaction from Firebase:", error);
    throw new Error("Failed to delete transaction. Please try again.");
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot load transactions: No internet connection. Please check your connection and try again."
    );
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Transaction[];
  } catch (error) {
    console.error("Error getting transactions from Firebase:", error);
    throw new Error("Failed to load transactions. Please try again.");
  }
};

export const getTransactionsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> => {
  if (!isOnline()) {
    throw new Error(
      "Cannot load transactions: No internet connection. Please check your connection and try again."
    );
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Transaction[];
  } catch (error) {
    console.error("Error getting transactions by date range:", error);
    throw new Error("Failed to load transactions. Please try again.");
  }
};

export const getTotalSpent = async (): Promise<number> => {
  try {
    const transactions = await getTransactions();
    return transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  } catch (error) {
    console.error("Error calculating total spent:", error);
    throw new Error("Failed to calculate total spent. Please try again.");
  }
};
