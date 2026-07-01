import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

type Row = {
  id: number;
  customerName: string;
  sales: number;
  received: number;
  balance: number;
};

const CustomerWiseReport = () => {
  const db = useSafeDatabase();
  const [data, setData] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const result = await db.getAllAsync<Row>(`
          SELECT 
            C.id,
            C.customerName,
            COALESCE(S.totalSales, 0) as sales,
            COALESCE(M.totalReceived, 0) as received,
            (COALESCE(M.totalReceived, 0) - COALESCE(S.totalSales, 0)) as balance
          FROM Customer C
          LEFT JOIN (
            SELECT customerId, SUM(amount) as totalSales
            FROM Sales
            GROUP BY customerId
          ) S ON C.id = S.customerId
          LEFT JOIN (
            SELECT customerId, SUM(amount) as totalReceived
            FROM MoneyReceived
            GROUP BY customerId
          ) M ON C.id = M.customerId
          ORDER BY C.customerName
        `);

        setData(result || []);
      } catch (err) {
        console.error("Customer Report Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [db]);

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
    <View className='flex-1 bg-gray-100 p-4'>
      <View className='flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header */}
            <View className='flex-row bg-gray-200 p-3'>
              <Text style={{ width: 100 }} className='font-bold text-gray-700'>
                Customer
              </Text>

              <Text
                style={{ width: 100 }}
                className='font-bold text-right text-gray-700'
              >
                Sales
              </Text>

              <Text
                style={{ width: 100 }}
                className='font-bold text-right text-gray-700'
              >
                Received
              </Text>

              <Text
                style={{ width: 100 }}
                className='font-bold text-right text-gray-700'
              >
                Balance
              </Text>
            </View>

            {/* Rows */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {data.length > 0 ? (
                data.map((item) => (
                  <View
                    key={item.id}
                    className='flex-row p-3 border-t border-gray-100'
                  >
                    <Text
                      style={{ width: 100 }}
                      className='text-gray-800'
                      numberOfLines={1}
                    >
                      {item.customerName}
                    </Text>

                    <Text
                      style={{ width: 100 }}
                      className='text-right text-blue-600 font-semibold'
                    >
                      ₹{item.sales}
                    </Text>

                    <Text
                      style={{ width: 100 }}
                      className='text-right text-green-600 font-semibold'
                    >
                      ₹{item.received}
                    </Text>

                    <Text
                      style={{ width: 100 }}
                      className={`text-right font-bold ${
                        item.balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{item.balance}
                    </Text>
                  </View>
                ))
              ) : (
                <View className='items-center py-10'>
                  <Text className='text-gray-400'>No data found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default CustomerWiseReport;
