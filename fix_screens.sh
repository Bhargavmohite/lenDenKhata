#!/bin/bash

# Files to fix
files=(
  "app/Transaction/Purchase.tsx"
  "app/Transaction/MoneyReceived.tsx"
  "app/Transaction/MoneyPaid.tsx"
  "app/Master/BankMaster.tsx"
  "app/Master/SupplyMaster.tsx"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  
  # Replace import
  sed -i 's/import { useSQLiteContext } from "expo-sqlite";/import { useSafeDatabase } from "@\/app\/hooks\/useSafeDatabase";/' "$file"
  
  # Replace hook call
  sed -i 's/const db = useSQLiteContext();/const db = useSafeDatabase();\n  const [isLoading, setIsLoading] = useState(true);/' "$file"
done

echo "All files fixed!"
