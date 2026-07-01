import  useSafeDatabase  from "@/app/hooks/useSafeDatabase";
import { Picker } from "@react-native-picker/picker";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Modal,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";

type Supplier = {
  id: number;
  supplyName: string;
  MBCountryCode: string;
  mobileNumber: string;
  email: string;
  creditLimit: string;
  creditPeriod: string;
};

const SupplyMaster = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    supplyName: "",
    MBCountryCode: "+91",
    mobileNumber: "",
    email: "",
    creditLimit: "",
    creditPeriod: "",
  });

  const pushtomenu = () => {
    router.push("/(user)");
  }

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [supplierLists, setSupplierLists] = useState<Supplier[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(-1);
  const [refreshList, setRefreshList] = useState(false);

  const loadSupplies = async () => {
    if (!db) {
      return;
    }
    try {
      const result = await db.getAllAsync<Supplier>("SELECT * FROM Supply");
      setSupplierLists(result);
    } catch (error) {
      console.log("Failed to load Suppliers", error);
    }
  };

  useEffect(() => {
    loadSupplies();
  }, [refreshList]);

  const handleSubmit = async () => {
    if (
      !form.supplyName ||
      !form.mobileNumber ||
      !form.email ||
      !form.creditLimit ||
      !form.creditPeriod
    ) {
      Alert.alert("All fields required");
      return;
    }

    try {
      if (!db) {
        Alert.alert("Alert", "Database is not ready");
        return;
      }

      const existing = await db.getFirstAsync<Supplier>(
        `SELECT * FROM Supply WHERE LOWER(supplyName) = ?`,
        [form.supplyName.toLowerCase()],
      );

      if (existing) {
        Alert.alert("Supplier already exists");
        return;
      }

      await db.runAsync(
        `INSERT INTO Supply 
        (supplyName, MBCountryCode, mobileNumber, email, creditLimit, creditPeriod)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          form.supplyName,
          form.MBCountryCode,
          form.mobileNumber,
          form.email,
          Number(form.creditLimit),
          Number(form.creditPeriod),
        ],
      );

      Alert.alert("Success", "Supplier added");

      setForm({
        supplyName: "",
        MBCountryCode: "+91",
        mobileNumber: "",
        email: "",
        creditLimit: "",
        creditPeriod: "",
      });

      setRefreshList((prev) => !prev);
      pushtomenu();
    } catch (error) {
      console.log(error);
    }
  };


  const handleUpdate = async () => {
    if (selectedCustomerId === -1) {
      Alert.alert("Select supplier first");
      return;
    }

    try {
      if (!db) {
        Alert.alert("Alert", "Database is not ready");
        return;
      }

      await db.runAsync(
        `UPDATE Supply SET 
          supplyName=?, 
          MBCountryCode=?, 
          mobileNumber=?, 
          email=?, 
          creditLimit=?, 
          creditPeriod=? 
        WHERE id=?`,
        [
          form.supplyName,
          form.MBCountryCode,
          form.mobileNumber,
          form.email,
          Number(form.creditLimit),
          Number(form.creditPeriod),
          selectedCustomerId,
        ],
      );

      Alert.alert("Updated successfully");
      setIsModalVisible(false);
      setRefreshList((prev) => !prev);
      pushtomenu();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView
      className='flex-1'
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 100,
      }}
    >
      <View className='bg-white p-4 rounded-xl gap-2'>
        <Text>Supplier Name</Text>
        <TextInput
          value={String(form.supplyName ?? "")}
          placeholder='Supplier Name'
          onChangeText={(text) => setForm({ ...form, supplyName: text })}
          className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
        />

        <Text>Mobile</Text>
        <View className='flex-row gap-2 mb-3'>
          <TextInput
            value={String(form.MBCountryCode ?? "")}
            placeholder='+91'
            onChangeText={(t) => setForm({ ...form, MBCountryCode: t })}
            className='w-16 h-12 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white '
          />
          <TextInput
            value={String(form.mobileNumber ?? "")}
            placeholder='Mobile Number'
            onChangeText={(t) =>
              setForm({
                ...form,
                mobileNumber: t.replace(/\D/g, "").slice(0, 10),
              })
            }
            className='w-full h-12 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
          />
        </View>

        <Text>Email</Text>
        <TextInput
          value={String(form.email ?? "")}
          placeholder='Email'
          onChangeText={(t) => setForm({ ...form, email: t })}
          className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
        />

        <Text>Credit Limit</Text>
        <TextInput
          value={String(form.creditLimit ?? "")}
          placeholder='Credit Limit'
          onChangeText={(t) => setForm({ ...form, creditLimit: t })}
          className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
        />

        <Text>Credit Period</Text>
        <TextInput
          value={String(form.creditPeriod ?? "")}
          placeholder='Credit Period'
          onChangeText={(t) => setForm({ ...form, creditPeriod: t })}
          className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
        />
      </View>

      <View className='flex-row gap-3 justify-center mt-4'>
        <Button title='Submit' onPress={handleSubmit} />
        <Button title='Modify' onPress={() => setIsModalVisible(true)} />
      </View>

      <Modal visible={isModalVisible} transparent animationType='fade'>
        <View className='flex-1 justify-center items-center bg-black/40'>
          <View className='w-[90%] rounded-xl bg-white p-5'>
            <Picker
              selectedValue={selectedCustomerId}
              onValueChange={(id) => {
                if (id === -1) return;

                const customer = supplierLists.find(
                  (c) => Number(c.id) === Number(id),
                );

                if (!customer) return;

                setSelectedCustomerId(Number(id));
                setForm({
                  supplyName: customer.supplyName ?? "",
                  MBCountryCode: customer.MBCountryCode ?? "+91",
                  mobileNumber: String(customer.mobileNumber ?? ""),
                  email: customer.email ?? "",
                  creditLimit: String(customer.creditLimit ?? ""),
                  creditPeriod: String(customer.creditPeriod ?? ""),
                });
              }}
            >
              <Picker.Item label='Select Supplier' value={-1} />
              {supplierLists.map((customer) => (
                <Picker.Item
                  key={customer.id}
                  label={customer.supplyName}
                  value={customer.id}
                />
              ))}
            </Picker>

            <Button title='Update' onPress={handleUpdate} />
          </View>
        </View>
      </Modal>

      <View className='mt-6 items-centerflex items-center bg-white dark:bg-gray-800/50 rounded-xl p-4 w-[85%] relative left-8 top-[2rem]'>
        <Link
          href={{
            pathname: "/Master/forms/showSupplers",
            params: { refresh: refreshList ? "1" : "0" },
          }}
        >
          <Text>Show Supplier</Text>
        </Link>
      </View>
    </ScrollView>
  );
};

export default SupplyMaster;
