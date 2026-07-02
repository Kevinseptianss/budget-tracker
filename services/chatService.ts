import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { ChatMessage } from "../types/chat";

const COLLECTION_NAME = "chat_messages";

export const saveChatMessage = async (
  message: Omit<ChatMessage, "id" | "createdAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...message,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving chat message:", error);
    throw new Error("Failed to save chat message");
  }
};

export const getChatMessages = async (): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "asc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as ChatMessage[];
  } catch (error) {
    console.error("Error loading chat messages:", error);
    return [];
  }
};
