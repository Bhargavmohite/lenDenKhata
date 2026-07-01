import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

const index = () => {
  const router = useRouter();
  const customer = () => {
    router.push("/Master/CustomerMaster");
  };
  const supply = () => {
    router.push("/Master/SupplyMaster");
  };
  const bank = () => {
    router.push("/Master/BankMaster");
  };

  return (
    <View className='gap-4 p-4'>
      {/* Cutsomer Master */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => customer()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center'>
            <AntDesign name='usergroup-add' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Customer Master
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              View, add, and manage your customers
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>
      {/* supply Master */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => supply()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center'>
            <MaterialIcons name='delivery-dining' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Supplier Master
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              View, add, and manage your suppliers
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>
      {/* Bank Master */}
      <Pressable
        className='bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm'
        onPress={() => bank()}
      >
        <View className='flex-row items-center gap-4'>
          <View className='w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center'>
            <AntDesign name='bank' size={32} color='#137fec' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-black dark:text-white'>
              Bank / Cash Master
            </Text>
            <Text className='text-sm text-gray-500 dark:text-gray-400'>
              View, add, and manage your Banks and Cash
            </Text>
          </View>

          <AntDesign name='right' size={22} color='#137fec' />
        </View>
      </Pressable>

      {/* <Link href={''} asChild>
        <Button title='Customer Master' />
      </Link> */}
    </View>
  );
};

export default index;
