import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

type SaleItem = {
  id: number;
  InvoiceNo: string;
  invoiceDate: string;
  amount: number;
  narration: string;
  customerName: string | null;
};

const showSales = () => {
  const { refreshList } = useLocalSearchParams();

  const db = useSafeDatabase();

  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSalesDetails = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const result = await db.getAllAsync(
        `SELECT 
          S.id,
          S.InvoiceNo,
          S.invoiceDate,
          S.amount,
          S.narration,
          C.customerName
        FROM Sales S
        LEFT JOIN Customer C ON S.customerId = C.id
        ORDER BY S.invoiceDate DESC`,
      );

      setSales(result as SaleItem[]);
    } catch (error) {
      console.error("listing error in sales", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesDetails();
  }, [refreshList, db]);

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Loading sales...</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View className='flex-1 justify-center items-center'>
        <Text className='text-red-600'>Database not available</Text>
      </View>
    );
  }

  return (
    <FlatList
      className='p-2'
      data={sales}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item }) => (
        <View className='mx-4 my-2 p-4 bg-white rounded-2xl shadow-sm'>
          <View className='flex-row justify-between items-center mb-2'>
            <Text className='text-lg font-bold text-green-600'>
              🧾 {item.InvoiceNo}
            </Text>
            <Text className='text-xs text-gray-400'>{item.invoiceDate}</Text>
          </View>

          <Text className='text-gray-800 font-semibold mb-1'>
            🧔 {item.customerName || "Unknown Customer"}
          </Text>

          <Text className='text-gray-600 mb-3'>
            📝 {item.narration || "No narration"}
          </Text>

          <View className='bg-green-50 p-3 rounded-xl'>
            <Text className='text-xs text-green-600 uppercase font-semibold'>
              Amount
            </Text>
            <Text className='text-base font-bold text-green-700'>
              ₹{item.amount}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View className='items-center py-20'>
          <Text className='text-gray-400'>No Sales found</Text>
        </View>
      )}
    />
  );
};

export default showSales;
