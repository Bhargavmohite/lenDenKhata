import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CustomerLedgerReport = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const [rows, setRows] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<
    { id: number; customerName: string }[]
  >([]);

  const [form, setForm] = useState<{ customerId?: number }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // 🔍 Search Filter
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;

    return rows.filter((item) =>
      String(item.InvoiceNo || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, rows]);

  // 📦 Load Customers
  useEffect(() => {
    const loadCustomers = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const result = (await db.getAllAsync(
          "SELECT id, customerName FROM Customer ORDER BY customerName",
        )) as { id: number; customerName: string }[];
        setCustomerList(result);
      } catch (error) {
        console.error("Error loading customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [db]);

  // 📊 Load Ledger (Filtered by customer)
  const loadData = async (customerId: number) => {
    if (!db) {
      console.error("Database is not available");
      return;
    }
    const raw = await db.getAllAsync(
      `
      SELECT 
        invoiceDate as date,
        InvoiceNo,
        amount as sales,
        0 as received
      FROM Sales
      WHERE customerId = ?

      UNION ALL

      SELECT 
        invoiceDate as date,
        InvoiceNo,
        0 as sales,
        amount as received
      FROM MoneyReceived
      WHERE customerId = ?

      ORDER BY date ASC
      `,
      [customerId, customerId],
    );

    let balance = 0;

    const finalData = raw.map((item: any) => {
      balance += item.sales;
      balance -= item.received;

      return {
        ...item,
        balance,
      };
    });

    setRows(finalData);
  };

  // 🔁 Reload when customer changes
  useEffect(() => {
    if (form.customerId && db) {
      setRows([]);
      loadData(form.customerId);
    }
  }, [form.customerId, db]);

  // 📅 Format Date → 27-03-2026
  const formatDate = (date: string) => {
    if (!date) return "";
    return date.split("-").reverse().join("-");
  };

  // const pushtomenu = () => {
  //   router.push("/(user)/report");
  // }

  const GeneratePDF = async () => {
    if (!form.customerId || filteredRows.length === 0) {
      alert("No data to export");
      return;
    }

    const customerName =
      customerList.find((c) => c.id === form.customerId)?.customerName || "";
    const totalSales = filteredRows.reduce((a, b) => a + b.sales, 0);
    const totalReceived = filteredRows.reduce((a, b) => a + b.received, 0);
    const finalBalance = filteredRows.at(-1)?.balance || 0;

    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 10px; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          th { background-color: #f2f2f2; }
        </style>
      </head>

      <body>
        <h2>Customer Ledger Report</h2>
        <h4>Customer: ${customerName}</h4>

        <table>
          <tr>
            <th>Date</th>
            <th>Invoice</th>
            <th>Sales</th>
            <th>Received</th>
            <th>Balance</th>
          </tr>

          ${filteredRows
            .map(
              (item) => `
              <tr>
                <td>${formatDate(item.date)}</td>
                <td>${item.InvoiceNo}</td>
                <td>${item.sales}</td>
                <td>${item.received}</td>
                <td>${item.balance}</td>
              </tr>
            `,
            )
            .join("")}
        </table>

        <br/>

        <h4>Summary</h4>
        <p>Total Sales: ${totalSales}</p>
        <p>Total Received: ${totalReceived}</p>
        <p>Final Balance: ${finalBalance}</p>
      </body>
    </html>
  `;

    try {
      const { uri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("PDF Error:", error);
    }
  };
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
    <>
      {/* Customer Picker */}
      <View className='p-4'>
        <Text className='text-base font-medium pb-2'>Choose Customer</Text>

        <Picker
          selectedValue={form.customerId}
          onValueChange={(v) => setForm((prev) => ({ ...prev, customerId: v }))}
        >
          <Picker.Item label='Select Customer' value={undefined} />
          {customerList.map((c) => (
            <Picker.Item key={c.id} label={c.customerName} value={c.id} />
          ))}
        </Picker>

        {/* Search */}
        <TextInput
          placeholder='Search Invoice...'
          value={searchQuery}
          onChangeText={setSearchQuery}
          className='border mt-3 p-2 rounded'
        />
      </View>

      {/* Table */}
      <ScrollView className='flex-1 bg-white p-6'>
        {/* Header */}
        <View className='flex-row border bg-gray-200'>
          <Text className='flex-1 p-2 text-xs border-r font-bold'>Date</Text>
          <Text className='flex-1 p-2 text-xs border-r font-bold'>Inv</Text>
          <Text className='flex-1 p-2 text-xs border-r font-bold'>Sales</Text>
          <Text className='flex-1 p-2 text-xs border-r font-bold'>Recei</Text>
          <Text className='flex-1 p-2 text-xs font-bold'>Balance</Text>
        </View>

        {/* Rows */}
        {filteredRows.map((item, index) => (
          <View key={index} className='flex-row border-b'>
            <Text
              className='flex-1 p-2   border-r border-l text-xs'
              numberOfLines={1}
            >
              {formatDate(item.date)}
            </Text>

            <Text className='flex-1 p-2 border-r text-xs' numberOfLines={1}>
              {item.InvoiceNo}
            </Text>

            <Text className='flex-1 p-2  border-r text-xs'>{item.sales}</Text>

            <Text className='flex-1 p-2 border-r text-xs'>{item.received}</Text>

            <Text className='flex-1 p-2 border-r text-xs'>{item.balance}</Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={GeneratePDF}
          className='bg-blue-500 px-4 py-2 rounded mt-4 items-center'
        >
          <Text className='text-white'>Download PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

export default CustomerLedgerReport;
