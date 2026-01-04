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
import { Category, CategoryFormData } from "../types/category";

const COLLECTION_NAME = "categories";

// Default categories to seed if none exist
const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Food & Dining", color: "#FF6B6B", icon: "restaurant" },
  { name: "Transportation", color: "#4ECDC4", icon: "directions_car" },
  { name: "Accommodation", color: "#45B7D1", icon: "hotel" },
  { name: "Entertainment", color: "#96CEB4", icon: "movie" },
  { name: "Shopping", color: "#FFEAA7", icon: "shopping_cart" },
  { name: "Health & Medical", color: "#DDA0DD", icon: "local_hospital" },
  { name: "Travel", color: "#98D8C8", icon: "flight" },
  { name: "Other", color: "#A8A8A8", icon: "category" },
];

export const getCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(categoriesRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);

    let categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    // If no categories exist, seed with defaults
    if (categories.length === 0) {
      categories = await seedDefaultCategories();
    }

    return categories;
  } catch (error) {
    console.error("Error getting categories:", error);
    // Fallback to localStorage
    return getCategoriesFromLocalStorage();
  }
};

export const addCategory = async (categoryData: CategoryFormData): Promise<Category> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...categoryData,
      createdAt: now,
      updatedAt: now,
    });

    const newCategory: Category = {
      id: docRef.id,
      ...categoryData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };

    // Update localStorage as backup
    updateLocalStorageCategories(newCategory, "add");

    return newCategory;
  } catch (error) {
    console.error("Error adding category:", error);
    throw new Error("Failed to add category");
  }
};

export const updateCategory = async (
  id: string,
  categoryData: Partial<CategoryFormData>
): Promise<void> => {
  try {
    const now = Timestamp.now();
    const categoryRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: now,
    });

    // Update localStorage as backup
    updateLocalStorageCategories({ id, ...categoryData, updatedAt: now.toDate() }, "update");
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));

    // Update localStorage as backup
    updateLocalStorageCategories({ id }, "delete");
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
};

const seedDefaultCategories = async (): Promise<Category[]> => {
  try {
    const categories: Category[] = [];

    for (const defaultCategory of DEFAULT_CATEGORIES) {
      const category = await addCategory(defaultCategory);
      categories.push(category);
    }

    return categories;
  } catch (error) {
    console.error("Error seeding default categories:", error);
    return [];
  }
};

// LocalStorage fallback functions
interface StoredCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

const getCategoriesFromLocalStorage = (): Category[] => {
  try {
    const stored = localStorage.getItem("budget-tracker-categories");
    if (stored) {
      const parsed: StoredCategory[] = JSON.parse(stored);
      return parsed.map((cat: StoredCategory) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
        updatedAt: new Date(cat.updatedAt),
      }));
    }
  } catch (error) {
    console.error("Error reading categories from localStorage:", error);
  }

  // Return default categories if nothing in localStorage
  return DEFAULT_CATEGORIES.map((cat, index) => ({
    ...cat,
    id: `default-${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

const updateLocalStorageCategories = (
  category: Partial<Category> & { id: string },
  action: "add" | "update" | "delete"
): void => {
  try {
    const current = getCategoriesFromLocalStorage();
    let updated: Category[];

    switch (action) {
      case "add":
        updated = [...current, category as Category];
        break;
      case "update":
        updated = current.map((cat) =>
          cat.id === category.id ? { ...cat, ...category } : cat
        );
        break;
      case "delete":
        updated = current.filter((cat) => cat.id !== category.id);
        break;
      default:
        return;
    }

    localStorage.setItem("budget-tracker-categories", JSON.stringify(updated));
  } catch (error) {
    console.error("Error updating localStorage categories:", error);
  }
};