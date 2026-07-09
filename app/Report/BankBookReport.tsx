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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

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


const GeneratePDF = async () => {
  if (!bankId || rows.length === 0) {
    alert("No data to export");
    return;
  }

  const bankName = bankList.find((b) => b.id === bankId)?.bankName || "";

  const totalPaid = rows.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const totalReceived = rows.reduce(
    (sum, item) => sum + Number(item.purchase || 0),
    0,
  );

  const finalBalance = rows.length ? rows[rows.length - 1].balance : 0;

  const html = `
  <html>
    <head>
      <style>
        body{
          font-family:Arial;
          padding:20px;
        }

        h2{
          text-align:center;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin-top:15px;
        }

        th,td{
          border:1px solid #000;
          padding:8px;
          text-align:center;
        }

        th{
          background:#eeeeee;
        }
      </style>
    </head>

    <body>

      <h2>Bank Book Report</h2>

      <h3>Bank : ${bankName}</h3>

      <table>

        <tr>
          <th>Date</th>
          <th>Invoice</th>
          <th>Supplier</th>
          <th>Received</th>
          <th>Paid</th>
          <th>Balance</th>
        </tr>

        ${rows
          .map(
            (item) => `
          <tr>
            <td>${item.date.split("-").reverse().join("/")}</td>
            <td>${item.InvoiceNo}</td>
            <td>${item.supplierName}</td>
            <td>₹${item.purchase}</td>
            <td>₹${item.paid}</td>
            <td>₹${item.balance}</td>
          </tr>
        `,
          )
          .join("")}

      </table>

      <br>

      <h3>Summary</h3>

      <p>Total Received : ₹${totalReceived}</p>
      <p>Total Paid : ₹${totalPaid}</p>
      <p>Final Balance : ₹${finalBalance}</p>

    </body>

  </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri);
  } catch (error) {
    console.log(error);
  }
};

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
        <Picker
        selectedValue={bankId?.toString()}
        onValueChange={(v) =>
        setBankId(v ? Number(v) : undefined)
        }
        >
      <Picker.Item label="Select Bank" value="" />

        {bankList.map((b) => (

        <Picker.Item

        key={b.id}

        label={b.bankName}

        value={b.id.toString()}

        />

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
      <TouchableOpacity className='bg-blue-500 px-4 py-3 rounded mt-6 items-center' onPress={GeneratePDF}>
        <Text className='text-white font-bold'>Download PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BankBookReport;
