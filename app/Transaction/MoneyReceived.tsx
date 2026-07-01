import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { Link } from "expo-router";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const MoneyReceived = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const pushtomenu = () => {
    router.push("/(user)/transaction");
  }

  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: "",
    customerId: null as number | null,
    bankId: null as number | null,
    amount: "",
    narration: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [customerList, setCustomerList] = useState<
    { id: number; customerName: string }[]
  >([]);

  const [bankList, setBankList] = useState<{ id: number; bankName: string }[]>(
    [],
  );

  const [refreshList, setRefreshList] = useState(false);

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [filterCustomerId, setFilterCustomerId] = useState<number | null>(null);
  const [invoiceList, setInvoiceList] = useState<
    { id: number; InvoiceNo: string }[]
  >([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );

  const onDateChange = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setForm({
        ...form,
        invoiceDate: date.toISOString().split("T")[0],
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (
      !form.invoiceNo ||
      !form.invoiceDate ||
      !form.customerId ||
      !form.amount
    ) {
      Alert.alert("Alert", "Please fill all required fields");
      return;
    }

    if (!db) return;

    await db.runAsync(
      `INSERT INTO MoneyReceived 
      (InvoiceNo, invoiceDate, customerId, bankId, amount, narration)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        form.invoiceNo,
        form.invoiceDate,
        form.customerId,
        form.bankId,
        Number(form.amount),
        form.narration,
      ],
    );

    Alert.alert("Success", "Money Received added");

    setForm({
      invoiceNo: "",
      invoiceDate: "",
      customerId: null,
      bankId: null,
      amount: "",
      narration: "",
    });

    setRefreshList((prev) => !prev);
    pushtomenu();
    } catch (error) {
      Alert.alert("Error", error as string);
      
    }
  };

  const loadInvoicesByCustomer = async (customerId: number | null) => {
    if (!customerId || !db) return;

    setFilterCustomerId(customerId);
    setSelectedInvoiceId(null);

    const result = await db.getAllAsync(
      "SELECT id, InvoiceNo FROM MoneyReceived WHERE customerId = ?",
      [customerId],
    );

    setInvoiceList(result as any);
  };

  const loadDetails = async (id: number | null) => {
    if (!id || !db) return;

    setSelectedInvoiceId(id);

    const result = await db.getFirstAsync<any>(
      "SELECT * FROM MoneyReceived WHERE id = ?",
      [id],
    );

    if (result) {
      setForm({
        invoiceNo: result.InvoiceNo,
        invoiceDate: result.invoiceDate,
        customerId: result.customerId,
        bankId: result.bankId,
        amount: String(result.amount),
        narration: result.narration || "",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedInvoiceId || !db) return;

    await db.runAsync(
      `UPDATE MoneyReceived SET 
      InvoiceNo=?, invoiceDate=?, customerId=?, bankId=?, amount=?, narration=? 
      WHERE id=?`,
      [
        form.invoiceNo,
        form.invoiceDate,
        form.customerId,
        form.bankId,
        Number(form.amount),
        form.narration,
        selectedInvoiceId,
      ],
    );

    Alert.alert("Updated");

    setShowModifyModal(false);
    setRefreshList((prev) => !prev);
    pushtomenu();
    } catch (error) {
      Alert.alert("Error", error as string);
    }
  };

  useEffect(() => {
    if (!db) return;

    const load = async () => {
      setCustomerList(
        (await db.getAllAsync("SELECT id, customerName FROM Customer")) as any,
      );
      setBankList(
        (await db.getAllAsync("SELECT id, bankName FROM Bank")) as any,
      );
    };
    load();
  }, [db]);

  if (!db) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
        <Text className='text-gray-600 mt-4'>Initializing database...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className='flex-1'
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 120,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps='handled'
      showsVerticalScrollIndicator={false}
    >
      <View className='px-4 py-4 gap-4'>
        {/* FORM */}
        <View className='w-full max-w-md self-center space-y-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-8 gap-2'>
          <Text>Invoice Number</Text>
          <TextInput
            className='h-14 rounded-lg px-4'
            style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
            value={form.invoiceNo}
            placeholder='Invoice Number'
            onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
          />

          <Text>Date</Text>
          <Pressable
            className='h-14 rounded-lg px-4 justify-center'
            style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{form.invoiceDate || "Select Date"}</Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode='date'
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          <Text>Customer</Text>
          <View
            className='rounded-lg'
            style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
          >
            <Picker
              selectedValue={form.customerId}
              onValueChange={(v) => setForm({ ...form, customerId: v })}
            >
              <Picker.Item label='Select' value={null} />
              {customerList.map((c) => (
                <Picker.Item key={c.id} label={c.customerName} value={c.id} />
              ))}
            </Picker>
          </View>

          <Text>Amount</Text>
          <TextInput
            className='h-14 rounded-lg px-4'
            style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
            value={form.amount}
            placeholder='Amount'
            onChangeText={(t) => setForm({ ...form, amount: t })}
          />

          <Text>Bank</Text>
          <View
            className='rounded-lg'
            style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
          >
            <Picker
              selectedValue={form.bankId}
              onValueChange={(v) => setForm({ ...form, bankId: v })}
            >
              <Picker.Item label='Select' value={null} />
              {bankList.map((b) => (
                <Picker.Item key={b.id} label={b.bankName} value={b.id} />
              ))}
            </Picker>
          </View>

          <Text>Narration</Text>
          <TextInput
            className='h-14 rounded-lg px-4'
            style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
            value={form.narration}
            placeholder='Narration'
            onChangeText={(t) => setForm({ ...form, narration: t })}
          />
        </View>

        {/* BUTTONS */}
        <View className='flex-row justify-center gap-4'>
          <Button title='Submit' onPress={handleSubmit} />
          <Button title='Modify' onPress={() => setShowModifyModal(true)} />
        </View>

        {/* MODAL */}
        <Modal visible={showModifyModal} transparent>
          <View className='flex-1 justify-center items-center bg-black/40'>
            <View className='w-[90%] bg-white p-5 rounded-xl'>
              <Picker
                selectedValue={filterCustomerId}
                onValueChange={loadInvoicesByCustomer}
              >
                <Picker.Item label='Select Customer' value={null} />
                {customerList.map((c) => (
                  <Picker.Item key={c.id} label={c.customerName} value={c.id} />
                ))}
              </Picker>

              {invoiceList.length > 0 && (
                <Picker
                  selectedValue={selectedInvoiceId}
                  onValueChange={loadDetails}
                >
                  <Picker.Item label='Select Invoice' value={null} />
                  {invoiceList.map((i) => (
                    <Picker.Item key={i.id} label={i.InvoiceNo} value={i.id} />
                  ))}
                </Picker>
              )}

              {selectedInvoiceId && (
                <>
                  <TextInput
                    className='h-14 rounded-lg px-4'
                    style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
                    value={form.invoiceNo}
                    placeholder='Invoice Number'
                    onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
                  />

                  <TextInput
                    className='h-14 rounded-lg px-4'
                    style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
                    value={form.amount}
                    onChangeText={(t) => setForm({ ...form, amount: t })}
                  />

                  <View className='flex-row justify-between'>
                    <Button title='Update' onPress={handleUpdate} />
                    <Button
                      title='Cancel'
                      onPress={() => setShowModifyModal(false)}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        <View className='mt-6 items-centerflex items-center bg-white dark:bg-gray-800/50 rounded-xl p-4 w-[85%] relative left-8 top-[2rem]'>
          <Link href='/Transaction/forms/showMoneyReceived'>
            <Text>Show Customer</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default MoneyReceived;
