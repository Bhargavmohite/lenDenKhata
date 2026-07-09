import  useSafeDatabase  from "@/app/hooks/useSafeDatabase";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    Text,
    TextInput,
    View,
} from "react-native";
import ShowBank from "./forms/ShowBank";
import { router } from "expo-router";


type banks = {
  bank: string;
};

const BankMaster = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    bankName: "",
    OpeningBalance: 0,
  });

  const pushtomenu = () => {
    router.push("/(user)");
  }
  const [refreshList, setRefreshList] = useState(false);

  const handlesubmit = async () => {
    try {
      if (!form.bankName) {
        Alert.alert("Oops", "All fields Required..");
        return;
      }

      if (!db) {
        Alert.alert("Error", "Database not initialized");
        return;
      }

      const existingBank = await db.getFirstAsync<banks>(
        `SELECT * FROM Bank WHERE LOWER(TRIM(bankName)) = ?`,
        [form.bankName.trim().toLowerCase()],
      );

      if (existingBank) {
        Alert.alert("Bank already exists, please enter a new name");
        return;
      }

      await db.runAsync(
        `INSERT INTO Bank(bankName, OpeningBalance) VALUES(?, ?)`,
        [form.bankName.trim(), Number(form.OpeningBalance)],
      );

      Alert.alert("Success", "Bank Name is Saved");

      setRefreshList((prev) => !prev);

      setForm({
        bankName: "",
        OpeningBalance: 0,
      });

      pushtomenu();
    } catch (error) {
      console.log("Error :", error);
    }
  };

  if (!db) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Initializing database...</Text>
      </View>
    );
  }

  return (
    <View className='p-4'>
      <View className='w-full max-w-md self-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-8 gap-4'>
        <View className='w-full'>
          <Text className='text-lg font-semibold pb-2 text-black dark:text-gray-300'>
            Bank Name
          </Text>

          <TextInput
            placeholder='Enter Your Bank Full Name'
            placeholderTextColor='#617589'
            value={String(form.bankName ?? "")}
            onChangeText={(text) => {
              setForm({ ...form, bankName: text });
            }}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-lg text-black dark:text-white'
          />
        </View>

        <View className='w-full'>
          <Text className='text-lg font-semibold pb-2 text-black dark:text-gray-300'>
            Opening Balance
          </Text>

          <TextInput
            placeholder='Enter Opening Balance'
            placeholderTextColor='#617589'
            keyboardType='numeric'
            value={String(form.OpeningBalance ?? "")}
            onChangeText={(text) => {
              setForm({
                ...form,
                OpeningBalance: text === "" ? 0 : Number(text),
              });
            }}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-lg text-black dark:text-white'
          />
        </View>
      </View>

      <View className='p-5 flex-row justify-center'>
        <Button title='Submit' onPress={handlesubmit} />
      </View>

      <View>
        <ShowBank refreshList={refreshList} />
      </View>
    </View>
  );
};

export default BankMaster;
