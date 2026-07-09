import React from "react";
import { View, Text, Button, ScrollView } from "react-native";
import { router } from "expo-router";
import exportDatabase from "../Database/exportDatabase";
import { Alert } from "react-native";

const Admin = () => {
  const onClick = async () => {
    try {
      await exportDatabase();
      Alert.alert("Success", "Database exported successfully.");
    } catch (e) {
      Alert.alert("Error", "Failed to export database.");
      console.log(e);
    }
  };

  return (
    <ScrollView
      className='flex-1 bg-gray-100'
      contentContainerStyle={{ padding: 20 }}
    >
      <View className='bg-white rounded-2xl p-6 shadow'>
        <Text className='text-3xl font-bold text-center text-blue-600'>
          Admin Panel
        </Text>

        <Text className='text-gray-500 text-center mt-2'>
          Export your SQLite database for backup or viewing on a PC.
        </Text>

        <View className='mt-8'>
          <Button title='📤 Export Data' onPress={onClick} />
        </View>
      </View>

      <View className='bg-white rounded-2xl p-6 shadow mt-6'>
        <Text className='text-xl font-bold text-gray-800 mb-4'>
          📖 Instructions
        </Text>

        <Text className='text-gray-700 leading-7'>
          1. Tap <Text className='font-bold'>Export Data</Text>.
        </Text>

        <Text className='text-gray-700 leading-7 mt-2'>
          2. A SQLite database file will be created on your device.
        </Text>

        <Text className='text-gray-700 leading-7 mt-2'>
          3. Move the exported file using your File Manager or share it via
          WhatsApp, Email, Google Drive, etc.
        </Text>

        <Text className='text-gray-700 leading-7 mt-2'>
          4. On your Windows PC, install{" "}
          <Text className='font-bold'>SQLiteStudio</Text>.
        </Text>

        <Text className='text-gray-700 leading-7 mt-2'>
          5. Open SQLiteStudio and select the exported database file.
        </Text>

        <Text className='text-gray-700 leading-7 mt-2'>
          6. You can now browse all tables, view records, search data, and even
          export it to Excel or CSV if needed.
        </Text>
      </View>

      <View className='bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6'>
        <Text className='text-blue-700 font-semibold'>💡 Tip</Text>

        <Text className='text-blue-700 mt-2 leading-6'>
          Keep the exported database file in a safe place. It contains all your
          application data and can be used as a backup.
        </Text>
      </View>
    </ScrollView>
  );
};

export default Admin;
