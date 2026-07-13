import  useSafeDatabase  from "@/app/hooks/useSafeDatabase";
import { Picker } from "@react-native-picker/picker";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Customer = {
  id: number;
  customerName: string;
  MBCountryCode: string;
  mobileNumber: string;
  email: string;
  creditLimit: string;
  creditPeriod: string;
};

const CustomerMaster = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    customerName: "",
    MBCountryCode: "+91",
    mobileNumber: "",
    email: "",
    creditLimit: "",
    creditPeriod: "",
  });

  const pushtomenu = () => {
    router.push("/(user)");
  }

  const [customerLists, setCustomerLists] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(-1);
  const [isModalVisible1, setIsModalVisible1] = useState(false);
  const [refreshList, setRefreshList] = useState(false);

  const loadCustomers = async () => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Customer>("SELECT * FROM Customer");
      setCustomerLists(result);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (db) {
      loadCustomers();
    }
  }, [db, refreshList]);

  const handleSubmit = async () => {
    if (!db) {
      Alert.alert("Error", "Database not available");
      return;
    }
    try {
      if (
        !form.customerName ||
        !form.mobileNumber ||
        !form.email ||
        !form.creditLimit ||
        !form.creditPeriod
      ) {
        Alert.alert("All fields required");
        return;
      }

      if (!/\S+@\S+\.\S+/.test(form.email)) {
        Alert.alert("Invalid email");
        return;
      }

      const exists = await db.getFirstAsync<Customer>(
        `SELECT * FROM Customer WHERE LOWER(TRIM(customerName)) = ?`,
        [form.customerName.trim().toLowerCase()],
      );

      if (exists) {
        Alert.alert("Customer already exists");
        return;
      }

      await db.runAsync(
        `INSERT INTO Customer
        (customerName, MBCountryCode, mobileNumber, email, creditLimit, creditPeriod)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          form.customerName.trim(),
          form.MBCountryCode,
          form.mobileNumber,
          form.email,
          Number(form.creditLimit),
          Number(form.creditPeriod),
        ],
      );

      Alert.alert("Success", "Customer added successfully");

      setForm({
        customerName: "",
        MBCountryCode: "+91",
        mobileNumber: "",
        email: "",
        creditLimit: "",
        creditPeriod: "",
      });

      setRefreshList((prev) => !prev);

      pushtomenu();

    } catch (error) {
      console.error("Insert Error:", error);
      Alert.alert("Error", "Failed to add customer");
    }
  };

  const handleUpdate = async () => {
    if (!db) {
      Alert.alert("Error", "Database not available");
      return;
    }
    if (selectedCustomerId === -1) {
      Alert.alert("Select customer first");
      return;
    }

    try {
      await db.runAsync(
        `UPDATE Customer
         SET customerName=?, MBCountryCode=?, mobileNumber=?, email=?, creditLimit=?, creditPeriod=?
         WHERE id=?`,
        [
          form.customerName,
          form.MBCountryCode,
          form.mobileNumber,
          form.email,
          Number(form.creditLimit),
          Number(form.creditPeriod),
          selectedCustomerId,
        ],
      );

      Alert.alert("Updated successfully");

      setIsModalVisible1(false);

      setRefreshList((prev) => !prev);

      setForm({
        customerName: "",
        MBCountryCode: "+91",
        mobileNumber: "",
        email: "",
        creditLimit: "",
        creditPeriod: "",
      });

      pushtomenu();
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Update failed");
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

  if (isLoading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <ScrollView
      className='flex-1 px-4 py-4 gap-4 mt-2'
      contentContainerStyle={{ paddingBottom: 240 }}
    >
      <View className='p-4'>
        <View className='bg-white p-5 rounded-xl gap-3'>
          <Text className='text-xl font-semibold'>Customer Name</Text>
          <TextInput
            value={String(form.customerName ?? "")}
            placeholder='Customer Name'
            placeholderTextColor='#9CA3AF'
            onChangeText={(t) => setForm({ ...form, customerName: t })}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4 text-xl'
          />

          <Text className='text-xl font-semibold'>Mobile</Text>
          <View className='flex-row gap-2'>
            <TextInput
              value={String(form.MBCountryCode ?? "")}
              placeholder='Code'
              placeholderTextColor='#9CA3AF'
              onChangeText={(t) => setForm({ ...form, MBCountryCode: t })}
              className='w-20 h-14 rounded-lg border border-[#dbe0e6] text-xl text-center'
            />

            <TextInput
              value={String(form.mobileNumber ?? "")}
              placeholder='Mobile Number'
              placeholderTextColor='#9CA3AF'
              keyboardType='phone-pad'
              onChangeText={(t) =>
                setForm({
                  ...form,
                  mobileNumber: t.replace(/\D/g, "").slice(0, 10),
                })
              }
              className='flex-1 h-14 rounded-lg border border-[#dbe0e6] px-4 text-xl'
            />
          </View>

          <Text className='text-xl font-semibold'>Email</Text>
          <TextInput
            value={String(form.email ?? "")}
            placeholder='Email'
            placeholderTextColor='#9CA3AF'
            onChangeText={(t) => setForm({ ...form, email: t })}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4 text-xl'
          />

          <Text className='text-xl font-semibold'>Credit Limit</Text>
          <TextInput
            value={String(form.creditLimit ?? "")}
            placeholder='Credit Limit'
            placeholderTextColor='#9CA3AF'
            keyboardType='numeric'
            onChangeText={(t) => setForm({ ...form, creditLimit: t })}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4 text-xl'
          />

          <Text className='text-xl font-semibold'>Credit Period</Text>
          <TextInput
            value={String(form.creditPeriod ?? "")}
            placeholder='Credit Period'
            placeholderTextColor='#9CA3AF'
            keyboardType='numeric'
            onChangeText={(t) => setForm({ ...form, creditPeriod: t })}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4 text-xl'
          />
        </View>

        <View className='flex-row justify-center gap-4 mt-4'>
          <Button title='Submit' onPress={handleSubmit} />
          <Button title='Modify' onPress={() => setIsModalVisible1(true)} />
        </View>

        <Modal
          visible={isModalVisible1}
          transparent
          animationType='fade'
          onRequestClose={() => setIsModalVisible1(false)}
        >
          <View className='flex-1 justify-center items-center bg-black/40'>
            <View className='w-[90%] rounded-xl bg-white p-5 dark:bg-gray-800'>
              <Text className='text-lg font-semibold mb-4'>
                Modify Customer
              </Text>

              <View className='h-14 mb-3 justify-center rounded-lg border'>
                <Picker
                  selectedValue={selectedCustomerId}
                  onValueChange={(id) => {
                    if (id === -1) return;

                    const customer = customerLists.find(
                      (c) => Number(c.id) === Number(id),
                    );

                    if (!customer) return;

                    setSelectedCustomerId(Number(id));
                    setForm({
                      customerName: customer.customerName ?? "",
                      MBCountryCode: customer.MBCountryCode ?? "+91",
                      mobileNumber: String(customer.mobileNumber ?? ""),
                      email: customer.email ?? "",
                      creditLimit: String(customer.creditLimit ?? ""),
                      creditPeriod: String(customer.creditPeriod ?? ""),
                    });
                  }}
                >
                  <Picker.Item label='Select Customer' value={-1} />
                  {customerLists.map((customer) => (
                    <Picker.Item
                      key={customer.id}
                      label={customer.customerName}
                      value={customer.id}
                    />
                  ))}
                </Picker>
              </View>

              <View className='flex-row justify-between'>
                <Button title='Update' onPress={handleUpdate} />
              </View>
            </View>
          </View>
        </Modal>
        <View className='mt-8 items-center bg-white dark:bg-gray-800/50 rounded-xl p-4 w-[85%] self-center'>
          <Link
            href={{
              pathname: "/Master/forms/showCustomers",
              params: { refresh: refreshList ? "1" : "0" },
            }}
            asChild
          >
            <Text>Show Customers</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default CustomerMaster;
