import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const SETTINGS_DOC = "app_settings";
const SETTINGS_ID = "global";

export const getApiKey = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, SETTINGS_DOC, SETTINGS_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().siliconflow_api_key || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting API key:", error);
    return null;
  }
};

export const saveApiKey = async (apiKey: string): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_DOC, SETTINGS_ID);
    await setDoc(docRef, { siliconflow_api_key: apiKey }, { merge: true });
  } catch (error) {
    console.error("Error saving API key:", error);
    throw new Error("Failed to save API key");
  }
};
