export type MedicineType = "tablet" | "pill" | "syrup" | "compounded_medication";

export interface Medicine {
  id?: string;
  name: string;
  quantity: number;
  type: MedicineType;
  originalExpDate: Date;
  openedDate?: Date;
  openedExpDate?: Date;
  isOpened: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MedicineFormData {
  name: string;
  quantity: number;
  type: MedicineType;
  originalExpDate: Date;
}
