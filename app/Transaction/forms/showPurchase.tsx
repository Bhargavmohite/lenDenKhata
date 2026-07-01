import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

type Purchase = {
  id: number;
  InvoiceNo: string;
  invoiceDate: string;
  amount: number;
  narration: string | null;
  supplyName: string | null;
};

const ShowPurchase = () => {
  const { refresh } = useLocalSearchParams();
  const db = useSafeDatabase();

  const [purchase, setPurchase] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchaseDetails = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const result = await db.getAllAsync<Purchase>(`
        SELECT 
          P.id,
          P.InvoiceNo,
          P.invoiceDate,
          P.amount,
          P.narration,
          S.supplyName
        FROM Purchase P
        LEFT JOIN Supply S ON P.supplyId = S.id
        ORDER BY P.id DESC
      `);

      setPurchase(Array.isArray(result) ? result : []); // ✅ SAFE GUARD
    } catch (error) {
      console.error("listing error in purchase", error);
      setPurchase([]); // ✅ prevent crash if query fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseDetails();
  }, [refresh, db]);

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Loading purchases...</Text>
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

  const totalAmount = purchase.reduce(
    (sum, item) => sum + Number(item.amount || 0), // ✅ SAFE NUMBER
    0,
  );

  return (
    <FlatList
      className='p-2'
      data={purchase}
      keyExtractor={(item) => item.id.toString()} // ✅ simplified
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item }) => (
        <View className='mx-4 my-2 p-4 bg-white rounded-2xl shadow-sm'>
          <View className='flex-row justify-between items-center mb-2'>
            <Text className='text-lg font-bold text-green-600'>
              🧾 {item.InvoiceNo}
            </Text>
            <Text className='text-xs text-gray-400'>
              {item.invoiceDate || "No Date"}
            </Text>
          </View>

          <Text className='text-gray-800 font-semibold mb-1'>
            🧔 {item.supplyName || "Unknown Supplier"}
          </Text>

          <Text className='text-gray-600 mb-3'>
            📝 {item.narration || "No narration"}
          </Text>

          <View className='bg-green-50 p-3 rounded-xl'>
            <Text className='text-xs text-green-600 uppercase font-semibold'>
              Amount
            </Text>
            <Text className='text-base font-bold text-green-700'>
              ₹{Number(item.amount || 0)}
            </Text>
          </View>
        </View>
      )}
      ListFooterComponent={() => (
        <View className='mx-4 my-4 p-4 bg-gray-100 rounded-2xl shadow-sm'>
          <Text className='text-sm text-green-700 font-semibold'>
            Total Balance
          </Text>
          <Text className='text-lg font-bold text-green-800'>
            ₹{totalAmount}
          </Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <View className='items-center py-20'>
          <Text className='text-gray-400'>No purchases found</Text>
        </View>
      )}
    />
  );
};

export default ShowPurchase;
