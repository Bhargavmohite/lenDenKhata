import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

type UserData = {
  id: number;
  mobilenumber: string;
  password: string;
  createdDate: string;
  expiryDate: string;
};

const list = () => {
  const db = useSQLiteContext();

  const [data, setData] = useState<UserData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const result = await db.getAllAsync<UserData>(
        "SELECT * FROM Login ORDER BY id DESC",
      );

      setData(result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      className='flex-1 bg-slate-100'
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className='p-4'>
        <Text className='text-3xl font-bold text-slate-800 mb-4'>
          Users List
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header */}
            <View className='flex-row bg-blue-600 rounded-xl py-3'>
              <Text className='w-40 text-white font-bold px-3'>
                Mobile Number
              </Text>

              <Text className='w-32 text-white font-bold px-3'>Password</Text>

              <Text className='w-40 text-white font-bold px-3'>
                Current Date
              </Text>

              <Text className='w-40 text-white font-bold px-3'>
                Expiry Date
              </Text>
            </View>

            {/* Data */}
            {data.map((item) => (
              <View
                key={item.id}
                className='bg-white rounded-xl mt-3 shadow-sm border border-slate-200'
              >
                <View className='flex-row py-3'>
                  <Text className='w-40 px-3 text-slate-700'>
                    {item.mobilenumber}
                  </Text>

                  <Text className='w-32 px-3 text-slate-700'>
                    {item.password}
                  </Text>

                  <Text className='w-40 px-3 text-slate-700'>
                    {item.createdDate}
                  </Text>

                  <Text className='w-40 px-3 text-slate-700'>
                    {item.expiryDate}
                  </Text>
                </View>
              </View>
            ))}

            {data.length === 0 && (
              <View className='bg-white p-6 rounded-xl mt-4'>
                <Text className='text-center text-slate-500'>
                  No records found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default list;
