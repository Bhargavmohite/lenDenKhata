import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type User = {
  id: number;
  mobilenumber: string;
};

const login = () => {
  const db = useSQLiteContext();

  // const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");

  const { mobileNumber: mobileNumberParam } = useLocalSearchParams();

  const [mobile, setMobile] = useState(mobileNumberParam?.toString() || "");

  const handleLogin = async () => {
    try {
      if (!mobile.trim() || !password.trim()) {
        Alert.alert("Error", "Please enter mobile number and password");
        return;
      }

      const user = await db.getFirstAsync(
        `SELECT * FROM Login WHERE mobilenumber = ? AND password = ?`,
        [mobile, password],
      );

      if (user) {
        Alert.alert("Success", "Login successful");
        router.push('/(user)');
      } else {
        Alert.alert("Error", "Invalid mobile number or password");
      }

      // setMobile("");
      setPassword("");
    } catch (error) {
      console.log(error);
    }
  };

  const navigatetochangepassword = async () => {
    const user = await db.getFirstAsync<User>(
      `SELECT * FROM Login WHERE mobilenumber = ?`,
      [mobile],
    );

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    router.push({
      pathname: "./changePassword",
      params: {
        id: user.id,
        mobileNumber: user.mobilenumber,
      },
    });
  };
  return (
    <SafeAreaView className='flex-1 bg-slate-100 justify-center px-6'>
      <View className='bg-white rounded-3xl p-6 shadow-lg'>
        {/* Header */}
        <View className='items-center mb-8'>
          <Text className='text-3xl font-bold text-slate-800'>
            Login to Your Account
          </Text>
        </View>

        {/* Mobile Number */}
        <View className='mb-4'>
          <Text className='text-slate-700 font-medium mb-2'>Mobile Number</Text>
          <TextInput
            placeholder='Enter mobile number'
            keyboardType='phone-pad'
            value={mobile}
            editable={false}
            className='border border-slate-300 rounded-xl px-4 py-3 bg-slate-50'
          />
        </View>

        {/* Password */}
        <View className='mb-2'>
          <Text className='text-slate-700 font-medium mb-2'>Password</Text>
          <TextInput
            placeholder='Enter password'
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className='border border-slate-300 rounded-xl px-4 py-3 bg-slate-50'
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className='bg-emerald-600 rounded-xl py-4 items-center mt-6'
          onPress={handleLogin}
        >
          <Text className='text-white font-bold text-base'>Login</Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity
          className='items-center mb-6 mt-4'
          onPress={navigatetochangepassword}
        >
          <Text className='text-emerald-600 font-medium'>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default login;
