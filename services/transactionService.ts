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
const LOCAL_STORAGE_KEY = "budget-tracker-transactions";

// Type for stored transaction data (with string dates)
interface StoredTransaction {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

// Local storage helpers
const getLocalTransactions = (): Transaction[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored
      ? JSON.parse(stored).map((t: StoredTransaction) => ({
          ...t,
          date: new Date(t.date),
          createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
        }))
      : [];
  } catch (error) {
    console.error("Error reading from local storage:", error);
    return [];
  }
};

const saveLocalTransactions = (transactions: Transaction[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving to local storage:", error);
  }
};

const isOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

export const addTransaction = async (
  transactionData: TransactionFormData
): Promise<string> => {
  const newTransaction: Transaction = {
    ...transactionData,
    id: Date.now().toString(), // Generate local ID
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isOnline()) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...transactionData,
        date: Timestamp.fromDate(transactionData.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      newTransaction.id = docRef.id;
    } catch (error) {
      console.error("Error adding to Firebase, saving locally:", error);
    }
  }

  // Always save to local storage
  const localTransactions = getLocalTransactions();
  localTransactions.push(newTransaction);
  saveLocalTransactions(localTransactions);

  return newTransaction.id!;
};

export const updateTransaction = async (
  id: string,
  transactionData: Partial<TransactionFormData>
): Promise<void> => {
  const localTransactions = getLocalTransactions();
  const transactionIndex = localTransactions.findIndex((t) => t.id === id);

  if (transactionIndex !== -1) {
    localTransactions[transactionIndex] = {
      ...localTransactions[transactionIndex],
      ...transactionData,
      updatedAt: new Date(),
    };
    saveLocalTransactions(localTransactions);
  }

  if (isOnline()) {
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

      if (transactionData.date) {
        updateData.date = Timestamp.fromDate(transactionData.date);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating Firebase transaction:", error);
    }
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const localTransactions = getLocalTransactions();
  const filteredTransactions = localTransactions.filter((t) => t.id !== id);
  saveLocalTransactions(filteredTransactions);

  if (isOnline()) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting Firebase transaction:", error);
    }
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  let firebaseTransactions: Transaction[] = [];
  const localTransactions = getLocalTransactions();

  if (isOnline()) {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      firebaseTransactions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Transaction[];

      // Sync local transactions to Firebase if they don't exist
      for (const localTransaction of localTransactions) {
        const existsInFirebase = firebaseTransactions.some(
          (ft) => ft.id === localTransaction.id
        );
        if (!existsInFirebase && localTransaction.id) {
          try {
            await addDoc(collection(db, COLLECTION_NAME), {
              amount: localTransaction.amount,
              description: localTransaction.description,
              category: localTransaction.category,
              date: Timestamp.fromDate(localTransaction.date),
              createdAt: Timestamp.fromDate(
                localTransaction.createdAt || new Date()
              ),
              updatedAt: Timestamp.fromDate(
                localTransaction.updatedAt || new Date()
              ),
            });
            firebaseTransactions.push(localTransaction);
          } catch (error) {
            console.error(
              "Error syncing local transaction to Firebase:",
              error
            );
          }
        }
      }

      // Update local storage with Firebase data
      saveLocalTransactions(firebaseTransactions);
      return firebaseTransactions;
    } catch (error) {
      console.error(
        "Error getting transactions from Firebase, using local data:",
        error
      );
    }
  }

  return localTransactions;
};

export const getTransactionsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> => {
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
    throw error;
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
    return 0;
  }
};
