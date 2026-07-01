import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

type Bank = {
  id: number;
  bankName: string;
  OpeningBalance: number;
};

const ShowBank = ({ refreshList }: { refreshList: any }) => {
  const [banklists, setbankLists] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  const db = useSafeDatabase();

  const loadbank = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const result = await db.getAllAsync<Bank>("SELECT * FROM Bank");
      setbankLists(result);
    } catch (error) {
      console.error("Failed to load bank:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadbank();
  }, [db, refreshList]);

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Loading banks...</Text>
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
      className='p-2 shadow-lm'
      data={banklists}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item }) => (
        <View className='bg-white rounded-2xl p-5 mx-4 my-2 shadow-md border border-gray-100 mt-3'>
          <Text className='text-lg font-semibold text-gray-800 mb-3'>
            {String(item.bankName ?? "")}
          </Text>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-gray-500'>
              Opening Balance : ₹ {String(item.OpeningBalance ?? "")}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View className='items-center py-20'>
          <Text className='text-gray-400'>No banks found</Text>
        </View>
      )}
    />
  );
};

export default ShowBank;
