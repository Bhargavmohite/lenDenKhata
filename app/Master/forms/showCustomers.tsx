import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

type Customer = {
  id: number;
  customerName: string;
  MBCountryCode: string;
  mobileNumber: string;
  email: string;
  creditLimit: string;
  creditPeriod: string;
};

const ShowCustomers = () => {
  const { refresh } = useLocalSearchParams();
  const db = useSafeDatabase();

  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [isloading, setIsloading] = useState(true);

  const loadCustomerList = async () => {
    if (!db) {
      setIsloading(false);
      return;
    }
    try {
      setIsloading(true);

      const result = await db.getAllAsync<Customer>(
        "SELECT * FROM Customer ORDER BY id DESC",
      );

      setCustomerList(result);
    } catch (e) {
      console.error("Database Error:", e);
    } finally {
      setIsloading(false);
    }
  };

  useEffect(() => {
    loadCustomerList();
  }, [refresh, db]);

  if (isloading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Loading customers...</Text>
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
      data={customerList}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item }) => (
        <View className='mx-4 my-2 p-4 bg-white rounded-2xl shadow-sm'>
          <View className='flex-row justify-between items-center mb-2'>
            <Text className='text-lg font-bold text-blue-600'>
              🧔 {String(item.customerName ?? "")}
            </Text>
            <Text className='text-xs text-gray-400'>
              ID: {String(item.id ?? "")}
            </Text>
          </View>

          <Text className='text-gray-700 mb-1'>
            📞 {String(item.MBCountryCode ?? "")}{" "}
            {String(item.mobileNumber ?? "")}
          </Text>

          <Text className='text-gray-600 mb-3'>
            ✉️ {String(item.email ?? "")}
          </Text>

          <View className='flex-row justify-between bg-blue-50 p-3 rounded-xl'>
            <View>
              <Text className='text-xs text-blue-500 uppercase font-semibold'>
                Credit Limit
              </Text>
              <Text className='text-base font-bold text-blue-700'>
                ₹{String(item.creditLimit ?? "")}
              </Text>
            </View>

            <View className='items-end'>
              <Text className='text-xs text-gray-500 uppercase font-semibold'>
                Period
              </Text>
              <Text className='text-base font-bold text-gray-700'>
                {String(item.creditPeriod ?? "")} Days
              </Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View className='items-center py-20'>
          <Text className='text-gray-400'>No customers found</Text>
        </View>
      )}
    />
  );
};

export default ShowCustomers;
