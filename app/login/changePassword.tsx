import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import { useLocalSearchParams } from "expo-router";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const db = useSQLiteContext();

  const { id, mobileNumber } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;

const handleChangePassword = async () => {
  try {
    if (!userId) {
      Alert.alert("Error", "Invalid user ID");
      return;
    }

    if (!oldPassword.trim() || !newPassword.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }

    // Particular user verify
    const user = await db.getFirstAsync(
      `SELECT * FROM Login
       WHERE id = ? AND password = ?`,
      [userId, oldPassword],
    );

    if (!user) {
      Alert.alert("Error", "Current password is incorrect");
      return;
    }

    // Particular user update
    await db.runAsync(
      `UPDATE Login
       SET password = ?
       WHERE id = ?`,
      [newPassword, userId],
    );

    Alert.alert("Success", "Password changed successfully");

    setOldPassword("");
    setNewPassword("");
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Failed to change password");
  }
};

  return (
    <SafeAreaView className="flex-1 bg-slate-100 justify-center px-6">
      <View className="bg-white rounded-3xl p-6 shadow-lg">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="h-16 w-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
            <Ionicons
              name="lock-closed-outline"
              size={32}
              color="#059669"
            />
          </View>

          <Text className="text-2xl font-bold text-slate-800">
            Change Password
          </Text>

          <Text className="text-slate-500 text-center mt-2">
            Update your password to keep your account secure
          </Text>
        </View>

        {/* Current Password */}
        <View className="mb-4">
          <Text className="text-slate-700 font-medium mb-2">
            Current Password
          </Text>

          <View className="border border-slate-300 rounded-xl px-4 bg-slate-50 flex-row items-center">
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="gray"
            />

            <TextInput
              className="flex-1 py-3 ml-3"
              placeholder="Enter current password"
              secureTextEntry={!showOldPassword}
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <TouchableOpacity
              onPress={() => setShowOldPassword(!showOldPassword)}
            >
              <Ionicons
                name={
                  showOldPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View>
          <Text className="text-slate-700 font-medium mb-2">
            New Password
          </Text>

          <View className="border border-slate-300 rounded-xl px-4 bg-slate-50 flex-row items-center">
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="gray"
            />

            <TextInput
              className="flex-1 py-3 ml-3"
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={
                  showNewPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Tips */}
        <View className="bg-emerald-50 rounded-xl p-4 mt-5">
          <Text className="text-emerald-700 text-sm">
            • Use at least 8 characters
          </Text>
          <Text className="text-emerald-700 text-sm mt-1">
            • Include letters and numbers
          </Text>
          <Text className="text-emerald-700 text-sm mt-1">
            • Avoid common passwords
          </Text>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          className="bg-emerald-600 rounded-xl py-4 items-center mt-6"
          onPress={handleChangePassword}
        >
          <Text className="text-white font-bold text-base">
            Change Password
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChangePassword;