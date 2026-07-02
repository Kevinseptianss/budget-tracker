import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { ChatMessage } from "../types/chat";

const SESSIONS_COLLECTION = "chat_sessions";
const MESSAGES_COLLECTION = "chat_messages";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export const archiveCurrentChat = async (
  messages: ChatMessage[]
): Promise<string> => {
  if (messages.length === 0) throw new Error("No messages to archive");

  const title =
    messages.find((m) => m.role === "user")?.content.slice(0, 40) || "Chat";

  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
    title,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};

export const getArchivedSessions = async (): Promise<ChatSession[]> => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Untitled",
        messages: (data.messages || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any, i: number) => ({
            id: `${doc.id}-${i}`,
            role: m.role as "user" | "assistant",
            content: m.content as string,
          })
        ),
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error("Error getting archived sessions:", error);
    return [];
  }
};

export const deleteArchivedSession = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, SESSIONS_COLLECTION, id));
};

export const clearCurrentMessages = async (): Promise<void> => {
  const q = query(collection(db, MESSAGES_COLLECTION));
  const snapshot = await getDocs(q);
  const deletes = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
};
