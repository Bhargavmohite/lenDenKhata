import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type BankType = {
  id: number;
  bankName: string;
};

type RowType = {
  date: string;
  InvoiceNo: string;
  supplierName: string;
  purchase: number;
  paid: number;
  balance: number;
};

const BankBookReport = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const [bankList, setBankList] = useState<BankType[]>([]);
  const [bankId, setBankId] = useState<number | undefined>(undefined);

  const [rows, setRows] = useState<RowType[]>([]);

  // Load Banks
  useEffect(() => {
    const loadBanks = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const result = await db.getAllAsync<BankType>(
          `SELECT id, bankName FROM Bank ORDER BY bankName`,
        );

        setBankList(result || []);
      } catch (error) {
        console.error("Error loading banks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBanks();
  }, [db]);

  // Load Ledger Data
  const loadData = async (selectedBankId: number) => {
    if (!db) {
      console.error("Database is not available");
      return;
    }
    try {
      const raw = await db.getAllAsync<any>(
        `
        SELECT 
          M.invoiceDate as date,
          M.InvoiceNo,
          S.supplyName as supplierName,
          0 as purchase,
          M.amount as paid
        FROM MoneyPaid M
        LEFT JOIN Supply S ON M.supplyId = S.id
        WHERE M.bankId = ?

        ORDER BY date ASC
        `,
        [selectedBankId],
      );

      let balance = 0;

      const finalData = raw.map((item: any) => {
        balance -= Number(item.paid || 0);

        return {
          ...item,
          balance,
        };
      });

      setRows(finalData);
    } catch (error) {
      console.error("Error loading ledger:", error);
    }
  };

  // Auto Load when bank changes
  useEffect(() => {
    if (bankId !== undefined && db) {
      loadData(bankId);
    }
  }, [bankId, db]);

  if (isLoading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Loading report...</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View className='flex-1 items-center justify-center'>
        <Text className='text-red-600 text-center'>
          Database not available. Please restart the app.
        </Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-white p-4'>
      {/* Bank Picker */}
      <Text className='text-base font-medium mt-4 pb-2'>Choose Bank</Text>

      <View className='rounded-lg border border-[#dbe0e6] px-2 mb-4'>
        <Picker selectedValue={bankId} onValueChange={(v) => setBankId(v)}>
          <Picker.Item label='Select Bank' value={undefined} />

          {bankList.map((b) => (
            <Picker.Item key={b.id} label={b.bankName} value={b.id} />
          ))}
        </Picker>
      </View>

      {/* Table */}
      <ScrollView horizontal>
        <View>
          {/* Header */}
          <View className='flex-row border bg-gray-200'>
            <Text className='w-28 p-2 border-r text-xs font-bold'>Date</Text>

            <Text className='w-28 p-2 border-r text-xs font-bold'>Invoice</Text>

            <Text className='w-40 p-2 border-r text-xs font-bold'>
              Supplier Name
            </Text>

            <Text className='w-28 p-2 border-r text-xs font-bold'>
              Received
            </Text>

            <Text className='w-28 p-2 border-r text-xs font-bold'>Paid</Text>

            <Text className='w-28 p-2 text-xs font-bold'>Balance</Text>
          </View>

          {/* Rows */}
          {rows.map((item, index) => (
            <View key={index} className='flex-row border-b'>
              {/* Date */}
              <Text className='w-28 p-2 border-r border-l text-xs'>
                {item.date ? item.date.split("-").reverse().join("/") : ""}
              </Text>

              {/* Invoice */}
              <Text className='w-28 p-2 border-r text-xs font-bold'>
                {item.InvoiceNo}
              </Text>

              {/* Supplier */}
              <Text className='w-40 p-2 border-r text-xs'>
                {item.supplierName || "Unknown"}
              </Text>

              {/* Received */}
              <Text className='w-28 p-2 border-r text-xs'>
                ₹{item.purchase}
              </Text>

              {/* Paid */}
              <Text className='w-28 p-2 border-r text-xs'>₹{item.paid}</Text>

              {/* Balance */}
              <Text className='w-28 p-2 text-xs border-r font-bold'>
                ₹{item.balance}
              </Text>
            </View>
          ))}

          {/* Empty State */}
          {rows.length === 0 && (
            <View className='p-4'>
              <Text className='text-center text-gray-400'>
                No Records Found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* PDF Button */}
      <TouchableOpacity className='bg-blue-500 px-4 py-3 rounded mt-6 items-center'>
        <Text className='text-white font-bold'>Download PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BankBookReport;
