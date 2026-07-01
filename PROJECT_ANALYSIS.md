# lenDenKhata - React Native Expo Project Analysis

## Project Overview

**lenDenKhata** (Hindi: लेन-देन खाता - Ledger/Accounting Book) is a React Native Expo application for managing business transactions, customers, suppliers, and bank accounts.

**Stack**: React Native 0.81.5 | Expo 54.0.33 | SQLite | NativeWind CSS | TypeScript

---

## Architecture

### Navigation Structure

```
Root Layout (_layout.tsx)
├── SQLiteProvider (Database initialization)
├── Stack Navigation
│   ├── index (Login/Home Screen)
│   └── (user) [Tab Navigation]
│       ├── Master Tab
│       │   ├── CustomerMaster
│       │   ├── SupplyMaster
│       │   └── BankMaster
│       ├── Transaction Tab
│       │   ├── Purchase
│       │   ├── Sales
│       │   ├── MoneyPaid
│       │   └── MoneyReceived
│       └── Report Tab
│           ├── SupplierWiseReport
│           ├── CustomerWiseReport
│           ├── SupplierLedgerReport
│           ├── CustomerLedgerReport
│           └── BankBookReport
```

### Navigation Implementation

- **Root**: Stack navigation (index → user group)
- **User Group**: Bottom Tab navigation with 3 tabs (Master, Transaction, Report)
- **Icons**: Ionicons, FontAwesome5, Foundation icons from @expo/vector-icons

---

## Database Schema

### SQLite Tables (Created in app/\_layout.tsx)

#### 1. **Customer**

```sql
CREATE TABLE Customer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerName TEXT NOT NULL,
  MBCountryCode TEXT DEFAULT '+91',
  mobileNumber INTEGER NOT NULL,
  email TEXT NOT NULL,
  creditLimit INTEGER NOT NULL,
  creditPeriod INTEGER NOT NULL
);
```

#### 2. **Supply** (Supplier)

```sql
CREATE TABLE Supply (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplyName TEXT NOT NULL,
  MBCountryCode TEXT DEFAULT '+91',
  mobileNumber INTEGER NOT NULL,
  email TEXT NOT NULL,
  creditLimit INTEGER NOT NULL,
  creditPeriod INTEGER NOT NULL
);
```

#### 3. **Bank**

```sql
CREATE TABLE Bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bankName TEXT NOT NULL,
  OpeningBalance INTEGER NOT NULL
);
```

#### 4. **Purchase**

```sql
CREATE TABLE Purchase (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceNo INTEGER NOT NULL,
  invoiceDate TEXT NOT NULL,
  supplyId INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  narration TEXT,
  FOREIGN KEY (supplyId) REFERENCES Supply(id)
);
```

#### 5. **MoneyPaid**

```sql
CREATE TABLE MoneyPaid (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceNo INTEGER NOT NULL,
  invoiceDate TEXT NOT NULL,
  supplyId INTEGER NOT NULL,
  bankId INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  narration TEXT,
  FOREIGN KEY (supplyId) REFERENCES Supply(id),
  FOREIGN KEY (bankId) REFERENCES Bank(id)
);
```

#### 6. **Sales**

```sql
CREATE TABLE Sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceNo INTEGER NOT NULL,
  invoiceDate TEXT NOT NULL,
  customerId INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  narration TEXT,
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);
```

#### 7. **MoneyReceived**

```sql
CREATE TABLE MoneyReceived (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceNo INTEGER NOT NULL,
  invoiceDate TEXT NOT NULL,
  customerId INTEGER NOT NULL,
  bankId INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  narration TEXT,
  FOREIGN KEY (customerId) REFERENCES Customer(id),
  FOREIGN KEY (bankId) REFERENCES Bank(id)
);
```

**Database Settings**:

- Foreign Keys: Enabled (`PRAGMA foreign_keys = ON`)
- Location: SQLite/lenDenKhata.db

---

## Screens & Features

### Master Tab (Data Management)

#### 1. **CustomerMaster** (app/Master/CustomerMaster.tsx)

**Purpose**: Manage customer records

**Features**:

- Create new customers
- View customer list
- Modify existing customers
- Delete customers (implied)

**Form Fields**:

- Customer Name
- Mobile Country Code (default: +91)
- Mobile Number (10-digit validation)
- Email (format validation)
- Credit Limit
- Credit Period

**Database Operations**:

- `INSERT INTO Customer` - Add new customer
- `SELECT * FROM Customer` - Load all customers
- `UPDATE Customer SET...WHERE id=?` - Modify customer
- Duplicate checking (case-insensitive trim)

**Custom Hooks/Patterns**:

- `useSQLiteContext()` - Access database
- `useState` - Form state management
- `useEffect` - Load data on mount/refresh
- Modal pattern for edit operations

---

#### 2. **SupplyMaster** (app/Master/SupplyMaster.tsx)

Similar to CustomerMaster but for suppliers/vendors

- Same field structure as customers
- Separate Supply table

---

#### 3. **BankMaster** (app/Master/BankMaster.tsx)

Manage bank accounts

- Bank Name
- Opening Balance

---

#### 4. **Show Forms** (app/Master/forms/)

- `showCustomers.tsx` - Display customer list
- `showSupplers.tsx` - Display supplier list
- `showBank.tsx` - Display bank list

---

### Transaction Tab (Financial Operations)

#### 1. **Sales** (app/Transaction/Sales.tsx)

**Purpose**: Record customer sales/invoices

**Form Fields**:

- Invoice Number
- Invoice Date (DateTimePicker)
- Customer Name (Picker dropdown)
- Amount (numeric)
- Narration (optional)

**Key Functions**:

```typescript
handleSubmit() - Insert new sales record
loadInvoicesByCustomer(customerId) - Get invoices for customer
loadSalesDetails(SalesId) - Load specific invoice details
handleUpdate() - Update existing sales record
```

**Database Operations**:

- `SELECT id, customerName FROM Customer` - Load customer dropdown
- `INSERT INTO Sales` - Add sale
- `UPDATE Sales SET...WHERE id=?` - Modify sale
- `SELECT * FROM Sales WHERE customerId=?` - Filter by customer

**State Management Pattern**:

```typescript
form: {
  (invoiceNo, invoiceDate, customerId, amount, narration);
}
showModifyModal: boolean;
filterCustomerId: number | null;
invoiceList: {
  (id, InvoiceNo);
}
[];
selectedInvoiceId: number | null;
```

---

#### 2. **Purchase** (app/Transaction/Purchase.tsx)

Similar to Sales but for supplier purchases

- Supplier Name instead of Customer
- Records purchase invoices

---

#### 3. **MoneyReceived** (app/Transaction/MoneyReceived.tsx)

Record payments from customers

- Link to Customer and Bank
- Tracks money received

---

#### 4. **MoneyPaid** (app/Transaction/MoneyPaid.tsx)

Record payments to suppliers

- Link to Supplier and Bank
- Tracks money paid

---

#### 5. **Show Forms** (app/Transaction/forms/)

- `showSales.tsx` - Display sales records
- `showPurchase.tsx` - Display purchase records
- `showMoneyReceived.tsx` - Display received payments
- `showMoneyPaid.tsx` - Display paid amounts

---

### Report Tab (Analytics & Statements)

#### 1. **CustomerWiseReport** (app/Report/CustomerWiseReport.tsx)

**Purpose**: Summary of customer transactions

**Query**:

```sql
SELECT
  C.id,
  C.customerName,
  COALESCE(S.totalSales, 0) as sales,
  COALESCE(M.totalReceived, 0) as received,
  (COALESCE(M.totalReceived, 0) - COALESCE(S.totalSales, 0)) as balance
FROM Customer C
LEFT JOIN (
  SELECT customerId, SUM(amount) as totalSales
  FROM Sales GROUP BY customerId
) S ON C.id = S.customerId
LEFT JOIN (
  SELECT customerId, SUM(amount) as totalReceived
  FROM MoneyReceived GROUP BY customerId
) M ON C.id = M.customerId
ORDER BY C.customerName
```

**Display**:

- Table with columns: Customer Name, Sales, Received, Balance
- Currency formatting: ₹ (Indian Rupee)

---

#### 2. **SupplierWiseReport**

Similar to CustomerWiseReport for suppliers

- Columns: Supplier, Purchase, Paid, Balance

---

#### 3. **CustomerLedgerReport**

Detailed customer transaction history

- Shows individual transactions
- Grouped by customer

---

#### 4. **SupplierLedgerReport**

Detailed supplier transaction history

---

#### 5. **BankBookReport**

Bank statement

- Shows all bank transactions
- Running balance

---

## Screens by File (25 Total)

| Screen               | Path                                        | Type       |
| -------------------- | ------------------------------------------- | ---------- |
| Login/Home           | app/index.tsx                               | Navigation |
| Master Hub           | app/(user)/index.tsx                        | Navigation |
| Transaction Hub      | app/(user)/transaction.tsx                  | Navigation |
| Report Hub           | app/(user)/report.tsx                       | Navigation |
| Customer Master      | app/Master/CustomerMaster.tsx               | Form       |
| Supplier Master      | app/Master/SupplyMaster.tsx                 | Form       |
| Bank Master          | app/Master/BankMaster.tsx                   | Form       |
| Show Customers       | app/Master/forms/showCustomers.tsx          | List       |
| Show Suppliers       | app/Master/forms/showSupplers.tsx           | List       |
| Show Banks           | app/Master/forms/showBank.tsx               | List       |
| Sales                | app/Transaction/Sales.tsx                   | Form       |
| Purchase             | app/Transaction/Purchase.tsx                | Form       |
| Money Received       | app/Transaction/MoneyReceived.tsx           | Form       |
| Money Paid           | app/Transaction/MoneyPaid.tsx               | Form       |
| Show Sales           | app/Transaction/forms/showSales.tsx         | List       |
| Show Purchase        | app/Transaction/forms/showPurchase.tsx      | List       |
| Show Money Received  | app/Transaction/forms/showMoneyReceived.tsx | List       |
| Show Money Paid      | app/Transaction/forms/showMoneyPaid.tsx     | List       |
| Supplier Wise Report | app/Report/SupplierWiseReport.tsx           | Report     |
| Customer Wise Report | app/Report/CustomerWiseReport.tsx           | Report     |
| Supplier Ledger      | app/Report/SupplierLedgerReport.tsx         | Report     |
| Customer Ledger      | app/Report/CustomerLedgerReport.tsx         | Report     |
| Bank Book            | app/Report/BankBookReport.tsx               | Report     |

---

## Core Hooks & Patterns

### Database Hooks

```typescript
// Access database context
const db = useSQLiteContext();

// Query operations
await db.getAllAsync(query, params); // Returns array
await db.getFirstAsync(query, params); // Returns single row
await db.runAsync(query, params); // Execute INSERT/UPDATE/DELETE
await db.execAsync(sql); // Execute raw SQL
```

### State Management Hooks

```typescript
// Form state
const [form, setForm] = useState({ fields });

// List management
const [list, setList] = useState([]);

// Modal/UI state
const [isModalVisible, setIsModalVisible] = useState(false);

// Refresh trigger
const [refreshList, setRefreshList] = useState(false);
useEffect(() => {
  loadData();
}, [refreshList]);
```

### Navigation Hooks

```typescript
const router = useRouter();
router.push(path); // Navigate to path
router.navigate(path); // Navigate with fallback
```

### Date Handling

```typescript
import DateTimePicker from "@react-native-community/datetimepicker";

// Date formatting
date.toISOString().split("T")[0]; // Returns "YYYY-MM-DD"
```

### UI Components

- `TextInput` - Input fields
- `Picker` - Dropdowns
- `Modal` - Popups
- `ScrollView` - Scrollable containers
- `Pressable` - Clickable elements
- `Button` - Action buttons
- `DateTimePicker` - Date selection

### Styling

- **Framework**: NativeWind (Tailwind CSS)
- **Pattern**: `className` prop with Tailwind classes
- **Dark Mode**: Built-in support with `dark:` prefix

---

## Async Functions Pattern

### Loading Data

```typescript
useEffect(() => {
  const load = async () => {
    try {
      const result = await db.getAllAsync(query);
      setState(result);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  load();
}, [dependency]);
```

### Insert/Update Operations

```typescript
const handleSubmit = async () => {
  try {
    // Validate
    if (!field) {
      Alert.alert("Error", "Field required");
      return;
    }

    // Database operation
    await db.runAsync(query, values);

    // Success feedback
    Alert.alert("Success", "Operation completed");

    // Refresh data
    setRefreshList((prev) => !prev);
  } catch (error) {
    console.error("Error:", error);
    Alert.alert("Error", "Operation failed");
  }
};
```

### Complex Queries

```typescript
useEffect(() => {
  const loadReport = async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT ... FROM table1
        LEFT JOIN table2 ON ...
        GROUP BY ...
        ORDER BY ...
      `);
      setData(result || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };
  loadReport();
}, []);
```

---

## Utilities

### Database Export (app/Database/exportDatabase.js)

```typescript
// Share SQLite database file
const dbUri = FileSystem.documentDirectory + "SQLite/" + dbName;
await Sharing.shareAsync(dbUri);
```

---

## Dependencies

### Key Libraries

- **expo-sqlite@16.0.10** - Database
- **expo-router@6.0.23** - Navigation
- **@react-navigation/bottom-tabs@7.4.0** - Tab navigation
- **@react-native-picker/picker@2.11.1** - Dropdown
- **@react-native-community/datetimepicker@9.1.0** - Date picker
- **nativewind@4.2.3** - Tailwind CSS
- **@expo/vector-icons@15.0.3** - Icons

---

## Data Flow Summary

### CRUD Operations Flow

1. **Create**: Form → Validate → INSERT → Alert → Refresh List
2. **Read**: useEffect → Query → setState → Display
3. **Update**: Select Record → Load Form → Validate → UPDATE → Alert → Refresh
4. **Delete**: (Not explicitly shown, likely linked on list view)

### Report Generation Flow

1. Complex JOIN queries with aggregation
2. COALESCE for null values
3. Display in table format
4. Currency formatting

---

## Key Features

✅ Master Data Management (Customer, Supplier, Bank)
✅ Transaction Recording (Sales, Purchase, Payments)
✅ Financial Reporting (Wise reports, Ledgers, Bank Book)
✅ SQLite Persistence
✅ Dark Mode Support
✅ Form Validation
✅ Database Export
✅ Responsive UI (NativeWind)
✅ Modal-based Editing
✅ Dropdown Filtering

---

## Configuration

### app.json

- React Compiler enabled
- Typed Routes enabled
- Expo Router plugin
- SQLite plugin
- Android edge-to-edge enabled
- Icon/Splash assets configured

### Database Initialization

- File: `app/_layout.tsx`
- Location: `SQLite/lenDenKhata.db`
- All tables created with IF NOT EXISTS
- Foreign keys enabled
