# Medicine Tracker Feature Documentation

## Overview

The Medicine Tracker is a new feature that allows users to manage their medicine inventory. Users can track their medicine stock, including name, quantity, type, expiration dates, and opening status. This feature is particularly useful for managing medications that have different storage requirements and expiration timelines.

## Requirements

### Functional Requirements

- **Medicine List Page**: Display all medicines in inventory
- **Add Medicine**: Modal form to add new medicines
- **Medicine Types**: Support for tablet, pill, syrup, and compounded medication
- **Expiration Tracking**: Track original expiration date
- **Opening Tracking**: For syrups, track when opened and new expiration date
- **Mark as Opened**: Ability to mark medicines as opened with new expiration date
- **Quantity Management**: Track current quantity of each medicine

### Technical Requirements

- Firebase Firestore integration for medicine storage
- Modal components for adding and editing medicines
- Date picker for expiration dates
- Responsive design for mobile and desktop
- TypeScript interfaces for type safety

## Database Schema Changes

### New Collection: `medicines`

```typescript
interface Medicine {
  id: string;
  name: string;
  quantity: number;
  type: MedicineType;
  originalExpDate: Date;
  openedDate?: Date;
  openedExpDate?: Date;
  isOpened: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type MedicineType = 'tablet' | 'pill' | 'syrup' | 'compounded_medication';
```

Each medicine entry contains:
- `name`: Name of the medicine
- `quantity`: Current quantity available
- `type`: Type of medicine (tablet, pill, syrup, compounded medication)
- `originalExpDate`: Original expiration date from packaging
- `openedDate`: Date when medicine was first opened (for syrups)
- `openedExpDate`: New expiration date after opening (for syrups)
- `isOpened`: Whether the medicine has been opened
- `createdAt`: When the medicine was added to inventory
- `updatedAt`: When the medicine was last updated

## Implementation Steps

### 1. Create Medicine Types

Create `types/medicine.ts` with the following interfaces:

```typescript
export type MedicineType = 'tablet' | 'pill' | 'syrup' | 'compounded_medication';

export interface Medicine {
  id: string;
  name: string;
  quantity: number;
  type: MedicineType;
  originalExpDate: Date;
  openedDate?: Date;
  openedExpDate?: Date;
  isOpened: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicineFormData {
  name: string;
  quantity: number;
  type: MedicineType;
  originalExpDate: Date;
}
```

### 2. Create Medicine Service

Create `services/medicineService.ts` with the following functions:

```typescript
// Add new medicine
export const addMedicine = async (medicineData: MedicineFormData): Promise<string>

// Get all medicines
export const getMedicines = async (): Promise<Medicine[]>

// Update medicine
export const updateMedicine = async (id: string, medicineData: Partial<MedicineFormData>): Promise<void>

// Mark medicine as opened (for syrups)
export const markMedicineAsOpened = async (id: string, openedExpDate: Date): Promise<void>

// Delete medicine
export const deleteMedicine = async (id: string): Promise<void>
```

### 3. Create Medicine Components

#### Medicine List Page (`app/medicine/page.tsx`)
- Display list of all medicines
- Show medicine details (name, quantity, type, expiration)
- Add new medicine button
- Open medicine actions

#### Add Medicine Modal Component
```typescript
interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicineData: MedicineFormData) => Promise<void>;
}
```

#### Open Medicine Modal Component (for syrups)
```typescript
interface OpenMedicineModalProps {
  isOpen: boolean;
  medicine: Medicine;
  onClose: () => void;
  onSave: (openedExpDate: Date) => Promise<void>;
}
```

### 4. Update Navigation

Add "Medicine Tracker" button to the main navigation in `app/page.tsx`.

## Implementation Details

### Medicine Types and Expiration Rules

- **Tablet/Pill**: Usually don't need special opening tracking
- **Syrup**: Requires opening date and new expiration date (typically 30-60 days after opening)
- **Compounded Medication**: May have specific storage requirements

### Opening Medicine Flow

1. User clicks "Open" button on a syrup medicine
2. Modal opens with calendar picker for new expiration date
3. User selects when the medicine will expire after opening
4. System records opening date and new expiration date
5. Medicine is marked as opened

### UI Components

#### Medicine Card/List Item
- Medicine name and type badge
- Quantity indicator
- Expiration date (original or opened)
- Status indicators (opened/not opened)
- Action buttons (Open, Edit, Delete)

#### Add Medicine Form
- Name field (text input)
- Quantity field (number input)
- Type dropdown (tablet, pill, syrup, compounded medication)
- Expiration date picker

#### Open Medicine Form
- Calendar picker for new expiration date
- Information about typical expiration periods

## Error Handling

- Validation for required fields
- Date validation (expiration dates cannot be in the past)
- Network connectivity checks
- Error messages for failed operations

## Testing

### Unit Tests
- Medicine service functions
- Component rendering and interactions
- Form validation

### Integration Tests
- Add medicine flow
- Open medicine flow
- Medicine list display

### E2E Tests
- Complete medicine management workflows
- Data persistence verification

## Recommendations

### 1. **Medicine Type Specific Logic**
- Only show "Open" button for syrups
- Different expiration rules based on medicine type
- Visual indicators for medicine status

### 2. **Expiration Alerts**
- Highlight medicines nearing expiration
- Different colors for different urgency levels
- Notification system for expired medicines

### 3. **Quantity Management**
- Low quantity warnings
- Usage tracking (optional future feature)
- Automatic reorder suggestions

### 4. **User Experience**
- Clear visual hierarchy in medicine list
- Intuitive icons for different medicine types
- Easy access to frequently used actions

### 5. **Data Validation**
- Prevent adding medicines with past expiration dates
- Validate quantity is positive
- Ensure medicine names are unique

### 6. **Future Enhancements**
- Medicine usage logging
- Refill reminders
- Integration with pharmacy APIs
- Barcode scanning for medicine identification
- Photo storage for medicine packaging

## Implementation Priority

### Phase 1 (Current Implementation)
- Basic medicine CRUD operations
- Medicine types and expiration tracking
- Opening tracking for syrups
- Basic UI and navigation

### Phase 2 (Future)
- Expiration alerts and notifications
- Low quantity warnings
- Usage tracking
- Advanced search and filtering

### Phase 3 (Advanced)
- Barcode scanning
- Photo storage
- Pharmacy integration
- Advanced analytics

## Security Considerations

- Medicine data is personal health information
- Ensure proper data encryption in Firestore
- Consider data retention policies
- User authentication for medicine access

## Performance Considerations

- Efficient querying of medicine list
- Lazy loading for large medicine inventories
- Optimized re-renders for medicine updates
- Caching strategies for frequently accessed data</content>
<parameter name="filePath">c:\Users\kevin\SynologyDrive\Budget-Tracker\budget-tracker\documentation\medicine-tracker-feature.md