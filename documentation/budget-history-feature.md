# Budget History Feature Documentation

## Overview

This feature allows users to save their current budget state (all transactions) as a "trip" or budget snapshot in a history collection. Users can create multiple such snapshots, view them in a history list, and interact with historical budgets (view, edit, add, delete transactions within them).

## Requirements

### Functional Requirements

- **Save Budget Button**: Add a button to save current budget state
- **Save Modal**: Modal dialog to input title for the budget snapshot
- **History Collection**: New Firebase collection "history" to store budget snapshots
- **History Menu Button**: Add "History" button to top navigation
- **History List View**: Display all saved budgets with date/time
- **History Detail View**: View transactions for a specific saved budget
- **Editable History**: Allow editing, adding, deleting transactions in history (non-permanent)
- **Multiple Trips**: Support creating multiple budget snapshots

### Technical Requirements

- Firebase Firestore integration
- Modal component for title input
- Navigation updates
- New service functions for history management
- UI components for history list and detail views

## Database Schema Changes

### New Collection: `history`

```typescript
interface HistoryEntry {
  id: string;
  title: string;
  transactions: Transaction[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Each history entry contains:

- `title`: User-provided title for the budget snapshot
- `transactions`: Array of all transactions at the time of saving
- `createdAt`: Timestamp when the history was created
- `updatedAt`: Timestamp when the history was last modified

## Implementation Steps

### 1. Create History Service

Create `services/historyService.ts` with the following functions:

```typescript
// Save current transactions as history entry
export const saveBudgetToHistory = async (title: string): Promise<string>

// Get all history entries
export const getHistoryEntries = async (): Promise<HistoryEntry[]>

// Get specific history entry by ID
export const getHistoryEntry = async (id: string): Promise<HistoryEntry>

// Update transactions in a history entry
export const updateHistoryTransaction = async (
  historyId: string,
  transactionId: string,
  transactionData: Partial<TransactionFormData>
): Promise<void>

// Add transaction to history entry
export const addTransactionToHistory = async (
  historyId: string,
  transactionData: TransactionFormData
): Promise<string>

// Delete transaction from history entry
export const deleteTransactionFromHistory = async (
  historyId: string,
  transactionId: string
): Promise<void>
```

### 2. Update Navigation

Add "History" button to the top navigation menu in `app/layout.tsx` or relevant navigation component.

### 3. Create History Components

#### History List Page (`app/history/page.tsx`)

- Display list of all saved budgets
- Show title, creation date/time
- Click to view details

#### History Detail Page (`app/history/[id]/page.tsx`)

- Display transactions for specific history entry
- Allow editing, adding, deleting transactions
- Show history title and metadata

### 4. Create Save Budget Modal

Create a modal component that:

- Prompts for budget title
- Calls `saveBudgetToHistory()` when confirmed
- Shows loading state during save operation

### 5. Update Main Budget Page

Add "Save Budget" button that opens the save modal.

## Code Changes Needed

### 1. Types (`types/history.ts`)

```typescript
import { Transaction } from "./transaction";

export interface HistoryEntry {
  id: string;
  title: string;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryFormData {
  title: string;
}
```

### 2. History Service Implementation

Key functions to implement:

- **saveBudgetToHistory**: Get all current transactions, create history entry
- **getHistoryEntries**: Fetch all history entries ordered by creation date
- **getHistoryEntry**: Fetch specific history entry with transactions
- CRUD operations for transactions within history entries

### 3. UI Components

#### SaveBudgetModal Component

```typescript
interface SaveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}
```

#### HistoryList Component

- List all history entries
- Navigation to detail view

#### HistoryDetail Component

- Display and manage transactions for specific history
- Transaction CRUD operations

### 4. Navigation Updates

Update navigation to include:

- History button linking to `/history`
- Dynamic routes for history details `/history/[id]`

## Implementation Details

### Saving Budget Flow

1. User clicks "Save Budget" button
2. Modal opens prompting for title
3. User enters title and confirms
4. System fetches all current transactions
5. Creates new history entry with title and transactions array
6. Saves to "history" collection
7. Shows success message

### History Management Flow

1. User clicks "History" in navigation
2. Loads all history entries
3. Displays list with titles and dates
4. User clicks on history entry
5. Loads specific history entry with transactions
6. User can view, edit, add, delete transactions in that history
7. Changes are saved back to the history entry

### Transaction Operations in History

- **Edit**: Update existing transaction in history entry's transactions array
- **Add**: Append new transaction to history entry's transactions array
- **Delete**: Remove transaction from history entry's transactions array
- All operations update the `updatedAt` timestamp

## Error Handling

- Network connectivity checks (similar to transaction service)
- Validation for required fields (title)
- Error messages for failed operations
- Loading states for async operations

## Testing

### Unit Tests

- History service functions
- Component rendering and interactions
- Form validation

### Integration Tests

- Save budget flow
- History navigation and viewing
- Transaction CRUD in history

### E2E Tests

- Complete user workflows
- Data persistence verification

## Future Enhancements

- Export history to CSV/PDF
- Compare different budget histories
- Budget templates based on history
- History search and filtering
- Bulk operations on history transactions
