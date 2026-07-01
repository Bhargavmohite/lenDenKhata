import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Link, router } from "expo-router";
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

interface MoneyPaidType {
  id: number;
  InvoiceNo: string;
  invoiceDate: string;
  supplyId: number;
  bankId: number;
  amount: number;
  narration?: string;
}

const money_paid = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const pushtomenu = () => {
    router.push("/(user)/transaction");
  };

  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: "",
    supplyId: null as number | null,
    bankId: null as number | null,
    amount: "",
    narration: "",
  });

  const [supplyList, setSupplyList] = useState<
    { id: number; supplyName: string }[]
  >([]);

  const [bankList, setBankList] = useState<{ id: number; bankName: string }[]>(
    [],
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshList, setRefreshList] = useState(false);

  const [showDatePickerMain, setShowDatePickerMain] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [filterSupplierId, setFilterSupplierId] = useState<number | null>(null);
  const [invoiceList, setInvoiceList] = useState<
    { id: number; InvoiceNo: string }[]
  >([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS !== "ios") {
      setShowDatePickerMain(false);
      setShowDatePickerModal(false);
    }
    if (date) {
      setSelectedDate(date);
      const formatted = date.toISOString().split("T")[0];
      setForm({ ...form, invoiceDate: formatted });
    }
  };

  useEffect(() => {
    if (!db) return;

    const loadSupplies = async () => {
      const result = await db.getAllAsync(
        "SELECT id, supplyName FROM Supply ORDER BY supplyName",
      );
      setSupplyList(result as any);
    };

    const loadBanks = async () => {
      const result = await db.getAllAsync(
        "SELECT id, bankName FROM Bank ORDER BY bankName",
      );
      setBankList(result as any);
    };

    loadSupplies();
    loadBanks();
  }, [db]);

  const handleSubmit = async () => {
    if (!db) {
      Alert.alert("Alert", "Database is not ready");
      return;
    }
    try {
      if (
        !form.invoiceNo ||
        !form.invoiceDate ||
        !form.supplyId ||
        !form.bankId ||
        !form.amount
      ) {
        Alert.alert("Alert", "Please fill all required fields");
        return;
      }

      if (isNaN(Number(form.amount))) {
        Alert.alert("Invalid Amount");
        return;
      }
      await db.runAsync(
        `INSERT INTO MoneyPaid 
        (InvoiceNo, invoiceDate, supplyId, bankId, amount, narration)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Number(form.invoiceNo),
          form.invoiceDate,
          form.supplyId,
          form.bankId,
          Number(form.amount),
          form.narration,
        ],
      );

      Alert.alert("Success", "Money Paid added successfully");

      setForm({
        invoiceNo: "",
        invoiceDate: "",
        supplyId: null,
        bankId: null,
        amount: "",
        narration: "",
      });

      setRefreshList((prev) => !prev);
      pushtomenu();
    } catch (error) {
      console.log(error);
    }
  };

  const loadInvoicesBySupplier = async (supplierId: number | null) => {
    if (!supplierId || !db) return;

    setFilterSupplierId(supplierId);
    setSelectedInvoiceId(null);

    const result = await db.getAllAsync(
      "SELECT id, InvoiceNo FROM MoneyPaid WHERE supplyId = ?",
      [supplierId],
    );

    setInvoiceList(result as any);
  };

  const loadPurchaseDetails = async (id: number | null) => {
    if (!id || !db) return;

    setSelectedInvoiceId(id);

    const result = await db.getFirstAsync(
      "SELECT * FROM MoneyPaid WHERE id = ?",
      [id],
    );

    if (result) {
      const r = result as MoneyPaidType;

      setForm({
        invoiceNo: r.InvoiceNo,
        invoiceDate: r.invoiceDate,
        supplyId: r.supplyId,
        bankId: r.bankId,
        amount: String(r.amount),
        narration: r.narration || "",
      });
    }
  };

  const handleUpdate = async () => {
    if (!db) {
      Alert.alert("Alert", "Database is not ready");
      return;
    }

    if (
      !selectedInvoiceId ||
      !form.invoiceNo ||
      !form.invoiceDate ||
      !form.supplyId ||
      !form.bankId ||
      !form.amount
    ) {
      Alert.alert("Alert", "All fields required");
      return;
    }

    try {
      await db.runAsync(
        `UPDATE MoneyPaid SET 
        InvoiceNo=?, invoiceDate=?, supplyId=?, bankId=?, amount=?, narration=? 
        WHERE id=?`,
        [
          form.invoiceNo,
          form.invoiceDate,
          form.supplyId,
          form.bankId,
          Number(form.amount),
          form.narration,
          selectedInvoiceId,
        ],
      );

      Alert.alert("Updated successfully");

      setShowModifyModal(false);

      setForm({
        invoiceNo: "",
        invoiceDate: "",
        supplyId: null,
        bankId: null,
        amount: "",
        narration: "",
      });

      setRefreshList((prev) => !prev);
      pushtomenu();
    } catch (error) {
      console.log(error);
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
    <ScrollView
      className='flex-1 px-4 py-4'
      contentContainerStyle={{ paddingBottom: 220 }}
    >
      <View className='px-4 py-4'>
        {/* FORM */}
        <View className='w-full max-w-md self-center space-y-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-8'>
          <Text className='text-base font-medium pb-2'>Voucher Number</Text>
          <TextInput
            placeholder='Enter Invoice Number'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
            value={form.invoiceNo}
            onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
          />

          <Text className='text-base font-medium mt-4 pb-2'>Date</Text>
          <Pressable
            onPress={() => setShowDatePickerMain(true)}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 flex-row items-center justify-between'
          >
            <Text>{form.invoiceDate || "Select Date"}</Text>
            <MaterialIcons name='calendar-today' size={22} />
          </Pressable>

          {showDatePickerMain && (
            <DateTimePicker
              value={selectedDate}
              mode='date'
              display='default'
              onChange={onDateChange}
            />
          )}

          <Text className='text-base font-medium mt-4 pb-2'>Supplier</Text>
          <View className='rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4'>
            <Picker
              selectedValue={form.supplyId}
              onValueChange={(v) => setForm({ ...form, supplyId: v })}
            >
              <Picker.Item label='Select Supplier' value={null} />
              {supplyList.map((s) => (
                <Picker.Item key={s.id} label={s.supplyName} value={s.id} />
              ))}
            </Picker>
          </View>

          <Text className='text-base font-medium mt-4 pb-2'>Bank</Text>
          <View className='rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4'>
            <Picker
              selectedValue={form.bankId}
              onValueChange={(v) => setForm({ ...form, bankId: v })}
            >
              <Picker.Item label='Select Bank' value={null} />
              {bankList.map((b) => (
                <Picker.Item key={b.id} label={b.bankName} value={b.id} />
              ))}
            </Picker>
          </View>

          <Text className='text-base font-medium mt-4 pb-2'>Amount</Text>
          <TextInput
            placeholder='Enter Amount'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4'
            keyboardType='numeric'
            value={form.amount}
            onChangeText={(t) => setForm({ ...form, amount: t })}
          />

          <Text className='text-base font-medium mt-4 pb-2'>Narration</Text>
          <TextInput
            placeholder='Enter Narration'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4'
            value={form.narration}
            onChangeText={(t) => setForm({ ...form, narration: t })}
          />
        </View>

        {/* BUTTONS */}
        <View className='flex-row justify-center gap-4 mt-4'>
          <Button title='Submit' onPress={handleSubmit} />
          <Button title='Modify' onPress={() => setShowModifyModal(true)} />
        </View>

        {/* MODIFY MODAL */}
        <Modal visible={showModifyModal} transparent>
          <View className='flex-1 justify-center items-center bg-black/40'>
            <View className='w-[90%] rounded-xl bg-white p-5 dark:bg-gray-800'>
              <Text className='text-lg font-semibold mb-4'>
                Modify Money Paid
              </Text>

              <Picker
                selectedValue={filterSupplierId}
                onValueChange={loadInvoicesBySupplier}
              >
                <Picker.Item label='Select Supplier' value={null} />
                {supplyList.map((s) => (
                  <Picker.Item key={s.id} label={s.supplyName} value={s.id} />
                ))}
              </Picker>

              {invoiceList.length > 0 && (
                <Picker
                  selectedValue={selectedInvoiceId}
                  onValueChange={loadPurchaseDetails}
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
                    className='border p-2 mt-2'
                    value={form.invoiceNo}
                    onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
                  />

                  <Pressable
                    onPress={() => setShowDatePickerModal(true)}
                    className='border p-2 mt-2'
                  >
                    <Text>{form.invoiceDate}</Text>
                  </Pressable>

                  {showDatePickerModal && (
                    <DateTimePicker
                      value={selectedDate}
                      mode='date'
                      onChange={onDateChange}
                    />
                  )}

                  <Picker
                    selectedValue={form.supplyId}
                    onValueChange={(v) => setForm({ ...form, supplyId: v })}
                  >
                    {supplyList.map((s) => (
                      <Picker.Item
                        key={s.id}
                        label={s.supplyName}
                        value={s.id}
                      />
                    ))}
                  </Picker>

                  <Picker
                    selectedValue={form.bankId}
                    onValueChange={(v) => setForm({ ...form, bankId: v })}
                  >
                    {bankList.map((b) => (
                      <Picker.Item key={b.id} label={b.bankName} value={b.id} />
                    ))}
                  </Picker>

                  <TextInput
                    className='border p-2 mt-2'
                    value={form.amount}
                    onChangeText={(t) => setForm({ ...form, amount: t })}
                  />

                  <TextInput
                    className='border p-2 mt-2'
                    value={form.narration}
                    onChangeText={(t) => setForm({ ...form, narration: t })}
                  />

                  <View className='flex-row justify-between mt-3'>
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

        {/* NAV */}
        <View className='mt-6 items-centerflex items-center bg-white dark:bg-gray-800/50 rounded-xl p-4 w-[85%] relative left-8 top-[2rem]'>
          <Link
            href={{
              pathname: "/Transaction/forms/showMoneyPaid",
              params: { refresh: refreshList ? "1" : "0" },
            }}
          >
            <Text>Show Money Paid</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default money_paid;
