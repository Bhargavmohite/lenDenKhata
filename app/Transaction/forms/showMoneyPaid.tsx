import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

type MoneyPaidItem = {
  id: number;
  bankId: number;
  InvoiceNo: string;
  invoiceDate: string;
  amount: number;
  narration?: string;
  supplyName?: string;
  bankName?: string;
};

const ShowMoneyPaid = () => {
  const { refreshList } = useLocalSearchParams();
  const db = useSafeDatabase();

  const [moneyPaidList, setMoneyPaidList] = useState<MoneyPaidItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMoneyPaidDetails = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const result = await db.getAllAsync<MoneyPaidItem>(`
        SELECT 
          P.id,
          P.bankId,
          P.InvoiceNo,
          P.invoiceDate,
          P.amount,
          P.narration,
          S.supplyName,
          B.bankName
        FROM MoneyPaid P
        LEFT JOIN Supply S ON P.supplyId = S.id
        LEFT JOIN Bank B ON P.bankId = B.id
        ORDER BY P.invoiceDate DESC
      `);

      setMoneyPaidList(result || []);
    } catch (error) {
      console.error("Listing error in money paid:", error);
      setMoneyPaidList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoneyPaidDetails();
  }, [refreshList, db]);

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Loading money paid...</Text>
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

   const totalAmount = moneyPaidList.reduce(
     (sum, item) => sum + Number(item.amount || 0), // ✅ SAFE NUMBER
     0,
   );

  return (
    <FlatList
      className='p-2'
      data={moneyPaidList}
      keyExtractor={(item, index) =>
        item?.id ? item.id.toString() : index.toString()
      }
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item }) => {
        if (!item) return null;

        return (
          <View className='mx-4 my-2 p-4 bg-white rounded-2xl shadow-sm'>
            {/* Header */}
            <View className='flex-row justify-between items-center mb-2'>
              <Text className='text-lg font-bold text-green-600'>
                🧾 {item.InvoiceNo || "N/A"}
              </Text>

              <Text className='text-xs text-gray-400'>
                {item.invoiceDate || "N/A"}
              </Text>
            </View>

            {/* Supplier */}
            <Text className='text-gray-800 font-semibold mb-1'>
              🧔 {item.supplyName || "Unknown Supplier"}
            </Text>

            {/* Bank */}
            <Text className='text-gray-800 font-semibold mb-1'>
              🏦 {item.bankName || "Unknown Bank"}
            </Text>

            {/* Narration */}
            <Text className='text-gray-600 mb-3'>
              📝 {item.narration || "No narration"}
            </Text>

            {/* Amount */}
            <View className='bg-green-50 p-3 rounded-xl'>
              <Text className='text-xs text-green-600 uppercase font-semibold'>
                Amount
              </Text>

              <Text className='text-base font-bold text-green-700'>
                ₹{item.amount ?? 0}
              </Text>
            </View>
          </View>
        );
      }}
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
          <Text className='text-gray-400'>No Money Paid found</Text>
        </View>
      )}
    />
  );
};

export default ShowMoneyPaid;
