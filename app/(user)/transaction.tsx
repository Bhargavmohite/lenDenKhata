import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

const transaction = () => {
  const router = useRouter();
  const purchase = () => {
    router.push('/Transaction/test/Purchase');
  };

  const sale = () => {
    router.push('/Transaction/test/Sales');
  };

  const money_Received = () => {
    router.push('/Transaction/test/MoneyReceived');
  };

  const money_Paid = () => {
    router.push('/Transaction/test/MoneyPaid');
  };
  return (
    <View className='px-4 py-4 gap-4 mt-2'>
      {/* Purchase */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => purchase()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center '>
            <AntDesign name='arrow-up' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Purchase
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              Make The Purchase And Modify
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>

      {/* Sales */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => sale()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center '>
            <AntDesign name='arrow-down' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Sales
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              Make The Sales And Modify
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>

      {/* Money Paid */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => money_Paid()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center '>
            <AntDesign name='arrow-up' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Money Paid
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              Make The Money Paid And Modify
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>

      {/* Money Received */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => money_Received()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center '>
            <AntDesign name='arrow-down' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Money Received
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              Make The Received And Modify
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>
    </View>
  );
};

export default transaction;
