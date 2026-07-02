import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Medicine, MedicineFormData, MedicineType } from "../types/medicine";

const COLLECTION_NAME = "medicines";

const isOnline = (): boolean => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
};

export const addMedicine = async (
    medicineData: MedicineFormData
): Promise<string> => {
    if (!isOnline()) {
        throw new Error(
            "Cannot add medicine: No internet connection. Please check your connection and try again."
        );
    }

    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            name: medicineData.name,
            quantity: medicineData.quantity,
            type: medicineData.type,
            originalExpDate: Timestamp.fromDate(medicineData.originalExpDate),
            isOpened: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding medicine to Firebase:", error);
        throw new Error("Failed to add medicine. Please try again.");
    }
};

export const updateMedicine = async (
    id: string,
    medicineData: Partial<MedicineFormData>
): Promise<void> => {
    if (!isOnline()) {
        throw new Error(
            "Cannot update medicine: No internet connection. Please check your connection and try again."
        );
    }

    if (!id) {
        throw new Error("Invalid medicine ID");
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: {
            name?: string;
            quantity?: number;
            type?: MedicineType;
            originalExpDate?: Timestamp;
            updatedAt: Timestamp;
        } = {
            updatedAt: Timestamp.now(),
        };

        if (medicineData.name !== undefined) updateData.name = medicineData.name;
        if (medicineData.quantity !== undefined)
            updateData.quantity = medicineData.quantity;
        if (medicineData.type !== undefined) updateData.type = medicineData.type;
        if (medicineData.originalExpDate) {
            updateData.originalExpDate = Timestamp.fromDate(
                medicineData.originalExpDate
            );
        }

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error("Error updating Firebase medicine:", error);
        throw new Error("Failed to update medicine. Please try again.");
    }
};

export const markMedicineAsOpened = async (
    id: string,
    openedExpDate: Date
): Promise<void> => {
    if (!isOnline()) {
        throw new Error(
            "Cannot update medicine: No internet connection. Please check your connection and try again."
        );
    }

    if (!id) {
        throw new Error("Invalid medicine ID");
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData = {
            isOpened: true,
            openedDate: Timestamp.now(),
            openedExpDate: Timestamp.fromDate(openedExpDate),
            updatedAt: Timestamp.now(),
        };

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error("Error marking medicine as opened:", error);
        throw new Error("Failed to update medicine. Please try again.");
    }
};

export const deleteMedicine = async (id: string): Promise<void> => {
    if (!isOnline()) {
        throw new Error(
            "Cannot delete medicine: No internet connection. Please check your connection and try again."
        );
    }

    if (!id) {
        throw new Error("Invalid medicine ID");
    }

    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting medicine from Firebase:", error);
        throw new Error("Failed to delete medicine. Please try again.");
    }
};

export const getMedicines = async (): Promise<Medicine[]> => {
    if (!isOnline()) {
        throw new Error(
            "Cannot load medicines: No internet connection. Please check your connection and try again."
        );
    }

    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                originalExpDate: data.originalExpDate?.toDate() || new Date(),
                openedDate: data.openedDate?.toDate(),
                openedExpDate: data.openedExpDate?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            };
        }) as Medicine[];
    } catch (error) {
        console.error("Error getting medicines from Firebase:", error);
        throw new Error("Failed to load medicines. Please try again.");
    }
};
