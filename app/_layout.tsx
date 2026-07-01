import "@/global.css";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense } from "react";

export default function RootLayout() {
  return (
    <Suspense fallback={null}>
      <SQLiteProvider
        databaseName='lenDenKhata.db'
        onInit={async (db) => {
          try {
            // 1️⃣ Enable FK first
            await db.execAsync("PRAGMA foreign_keys = ON");

            // 2️⃣ Create tables ONLY
            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS Customer (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customerName TEXT NOT NULL,
                MBCountryCode TEXT NOT NULL DEFAULT '+91',
                mobileNumber INTEGER NOT NULL,
                email TEXT NOT NULL,
                creditLimit INTEGER NOT NULL,
                creditPeriod INTEGER NOT NULL
              );
          `);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS Supply (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplyName TEXT NOT NULL,
                MBCountryCode TEXT NOT NULL DEFAULT '+91',
                mobileNumber INTEGER NOT NULL,
                email TEXT NOT NULL,
                creditLimit INTEGER NOT NULL,
                creditPeriod INTEGER NOT NULL
              );
            `);
            // await db.execAsync(`DROP TABLE IF EXISTS Bank;`);
            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS Bank (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bankName TEXT NOT NULL,
                OpeningBalance INTEGER NOT NULL
              );
            `);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS Purchase (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                InvoiceNo INTEGER NOT NULL,
                invoiceDate TEXT NOT NULL,
                supplyId INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                narration TEXT,
                FOREIGN KEY (supplyId) REFERENCES Supply(id)
              ); `);

            // await db.execAsync(`DROP TABLE IF EXISTS MoneyPaid`);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS MoneyPaid (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                InvoiceNo INTEGER NOT NULL,
                invoiceDate TEXT NOT NULL,
                supplyId INTEGER NOT NULL,
                bankId INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                narration TEXT,
                FOREIGN KEY (supplyId) REFERENCES Supply(id),
                FOREIGN KEY (bankId) REFERENCES Bank(id)

              ); `);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS Sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                InvoiceNo INTEGER NOT NULL,
                invoiceDate TEXT NOT NULL,
                customerId INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                narration TEXT,
                FOREIGN KEY (customerId) REFERENCES Customer(id)
              );`);

            // await db.execAsync(`DROP TABLE IF EXISTS MoneyReceived`);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS MoneyReceived (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                InvoiceNo INTEGER NOT NULL,
                invoiceDate TEXT NOT NULL,
                customerId INTEGER NOT NULL,
                bankId INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                narration TEXT,
                FOREIGN KEY (customerId) REFERENCES Customer(id),
                FOREIGN KEY (bankId) REFERENCES Bank(id)
              );`);

            await db.execAsync(`DROP TABLE IF EXISTS Login;`);

            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS Login (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mobilenumber TEXT,
                password TEXT,
                createdDate TEXT,
                expiryDate TEXT
              );`);

          } catch (error) {
            console.error("Database initialization error:", error);
          }
        }}
      >
        <Stack>
          <Stack.Screen name='index' options={{ headerShown: false }} />
          <Stack.Screen name='(user)' options={{ headerShown: false }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
