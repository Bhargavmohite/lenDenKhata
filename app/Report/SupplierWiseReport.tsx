import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

type Row = {
  id: number;
  supplierName: string;
  purchase: number;
  paid: number;
  balance: number;
};

const SupplierWiseReport = () => {
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
            S.id,
            S.supplyName as supplierName,
            COALESCE(P.totalPurchase, 0) as purchase,
            COALESCE(M.totalPaid, 0) as paid,
            (COALESCE(P.totalPurchase, 0) - COALESCE(M.totalPaid, 0)) as balance
          FROM Supply S
          LEFT JOIN (
            SELECT supplyId, SUM(amount) as totalPurchase
            FROM Purchase
            GROUP BY supplyId
          ) P ON S.id = P.supplyId
          LEFT JOIN (
            SELECT supplyId, SUM(amount) as totalPaid
            FROM MoneyPaid
            GROUP BY supplyId
          ) M ON S.id = M.supplyId
          ORDER BY S.supplyName
        `);

        setData(result || []);
      } catch (err) {
        console.error("Report Error:", err);
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
      <View className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header */}
            <View className='flex-row bg-gray-200 p-3'>
              <Text style={{ width: 100 }} className='font-bold text-gray-700'>
                Supplier
              </Text>

              <Text
                style={{ width: 100 }}
                className='font-bold text-right text-gray-700'
              >
                Purchase
              </Text>

              <Text
                style={{ width: 100 }}
                className='font-bold text-right text-gray-700'
              >
                Paid
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
                    <Text style={{ width: 100 }} className='text-gray-800'>
                      {item.supplierName}
                    </Text>

                    <Text
                      style={{ width: 100 }}
                      className='text-right text-blue-600 font-semibold'
                    >
                      ₹{item.purchase}
                    </Text>

                    <Text
                      style={{ width: 100 }}
                      className='text-right text-green-600 font-semibold'
                    >
                      ₹{item.paid}
                    </Text>

                    <Text
                      style={{ width: 100 }}
                      className='text-right text-red-600 font-bold'
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

export default SupplierWiseReport;
