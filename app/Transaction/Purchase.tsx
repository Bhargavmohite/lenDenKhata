import useSafeDatabase from "@/app/hooks/useSafeDatabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
    NativeModules
} from "react-native";

const { TaskerModule } = NativeModules;

interface Purchase {
  id: number;
  InvoiceNo: string;
  invoiceDate: string;
  supplyId: number;
  amount: number;
  narration?: string;
}

const Purchase = () => {
  const db = useSafeDatabase();
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: "",
    supplyId: "", // ✅ FIXED (was null)
    amount: "",
    narration: "",
  });


const triggerTaskerSMS = async (
      userMobile: string,
      supplierName: string,
      invoiceNo: string,
      invoiceDate: string,
      amount: string,

    ) => {

      try {
   
      await TaskerModule.sendBroadcast(
      "com.anonymous.SEND_PUR",
      userMobile,
      `
Welcome to LendenKhata

Your purchase has been recorded successfully.

Supplier Name: ${supplierName}
Invoice No: ${invoiceNo}
Invoice Date: ${invoiceDate}
Amount: ₹${amount}
`
    );

    console.log("Tasker broadcast sent successfully");
  } catch (e) {
    console.log("Tasker Error:", e);
  }
};


  const pushtomenu = () => {
    router.push("/(user)/transaction");
  };
  const [supplyList, setSupplyList] = useState<
    { id: number; supplyName: string }[]
  >([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshList, setRefreshList] = useState(false);

  const [showDatePickerMain, setShowDatePickerMain] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [filterSupplierId, setFilterSupplierId] = useState<string>(""); // ✅ FIXED
  const [invoiceList, setInvoiceList] = useState<
    { id: number; InvoiceNo: string }[]
  >([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(""); // ✅ FIXED

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
    const loadSupplies = async () => {
      try {
        if (!db) return;
        const result = await db.getAllAsync<{ id: number; supplyName: string }>(
          "SELECT id, supplyName FROM Supply ORDER BY supplyName",
        );
        setSupplyList(result);
      } catch (error) {
        console.error(error);
      }
    };
    loadSupplies();
  }, [db]);

  const handleSubmit = async () => {
    try {
      if (
        !form.invoiceNo ||
        !form.invoiceDate ||
        !form.supplyId ||
        !form.amount
      ) {
        Alert.alert("Alert", "Please fill all required fields");
        return;
      }

      const supplier = await db.getFirstAsync<{
        supplyName: string;
      }>("SELECT supplyName FROM Supply WHERE id = ?", [Number(form.supplyId)]);

      if (!supplier) {
        Alert.alert("Supplier not found");
        return;
      }

      // Get logged-in user's mobile number
      const login = await db.getFirstAsync<{ mobilenumber: string }>(
        "SELECT mobilenumber FROM Login ORDER BY id DESC LIMIT 1",
      );

      if (!login) {
        Alert.alert("User mobile number not found");
        return;
      }

      if (isNaN(Number(form.amount))) {
        Alert.alert("Invalid Amount");
        return;
      }
      if (!db) {
        Alert.alert("Database not ready");
        return;
      }
      await db.runAsync(
        `INSERT INTO Purchase 
        (InvoiceNo, invoiceDate, supplyId, amount, narration)
        VALUES (?, ?, ?, ?, ?)`,
        [
          Number(form.invoiceNo),
          form.invoiceDate,
          Number(form.supplyId),
          Number(form.amount),
          form.narration,
        ],
      );

      await triggerTaskerSMS(
        login.mobilenumber,
        supplier.supplyName,
        form.invoiceNo,
        form.invoiceDate,
        form.amount,
      );
      Alert.alert("Success", "Purchase added");

      setForm({
        invoiceNo: "",
        invoiceDate: "",
        supplyId: "",
        amount: "",
        narration: "",
      });

      setRefreshList((prev) => !prev);
      pushtomenu();
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoicesBySupplier = async (supplierId: number) => {
    setFilterSupplierId(String(supplierId));
    setSelectedInvoiceId("");
    if (!db) return;
    const result = await db.getAllAsync<{ id: number; InvoiceNo: string }>(
      "SELECT id, InvoiceNo FROM Purchase WHERE supplyId = ?",
      [supplierId],
    );

    setInvoiceList(result || []);
  };

  const loadPurchaseDetails = async (id: number) => {
    setSelectedInvoiceId(String(id));

    if (!db) return;

    const result = await db.getFirstAsync<Purchase>(
      "SELECT * FROM Purchase WHERE id = ?",
      [id],
    );

    if (result) {
      setForm({
        invoiceNo: result.InvoiceNo,
        invoiceDate: result.invoiceDate,
        supplyId: String(result.supplyId),
        amount: String(result.amount),
        narration: result.narration || "",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedInvoiceId) {
        Alert.alert("Error", "No invoice selected");
        return;
      }

      if (
        !form.invoiceNo ||
        !form.invoiceDate ||
        !form.supplyId ||
        !form.amount
      ) {
        Alert.alert("All fields required");
        return;
      }

      if (!db) {
        Alert.alert("Database not ready");
        return;
      }
      await db.runAsync(
        `UPDATE Purchase SET 
        InvoiceNo=?, invoiceDate=?, supplyId=?, amount=?, narration=? 
        WHERE id=?`,
        [
          form.invoiceNo,
          form.invoiceDate,
          Number(form.supplyId),
          Number(form.amount),
          form.narration,
          Number(selectedInvoiceId),
        ],
      );

      Alert.alert("Updated successfully");

      setShowModifyModal(false);
      setFilterSupplierId("");
      setInvoiceList([]);
      setSelectedInvoiceId("");

      setForm({
        invoiceNo: "",
        invoiceDate: "",
        supplyId: "",
        amount: "",
        narration: "",
      });
      setRefreshList((prev) => !prev);
      pushtomenu();
    } catch (err) {
      console.error(err);
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
      className='flex-1 px-4 py-4 gap-4 mt-2'
      contentContainerStyle={{ paddingBottom: 240 }}
    >
      <View className='px-4 py-4'>
        <View className='w-full max-w-md self-center space-y-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-8'>
          <Text className='text-base font-medium pb-2'>Invoice Number</Text>
          <TextInput
            placeholder='Enter Invoice Number'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-base text-black dark:text-white'
            value={form.invoiceNo}
            onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
          />

          <Text className='text-base font-medium mt-4 pb-2'>Invoice Date</Text>
          <Pressable
            onPress={() => setShowDatePickerMain(true)}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 flex-row items-center justify-between'
          >
            <Text>{form.invoiceDate || "Select Date"}</Text>
            <MaterialIcons name='calendar-today' size={22} color='gray' />
          </Pressable>

          {showDatePickerMain && (
            <DateTimePicker
              value={selectedDate}
              mode='date'
              display='default'
              onChange={onDateChange}
            />
          )}

          <Text className='text-base font-medium mt-4 pb-2'>Supplier Name</Text>
          <View className='rounded-lg border border-[#dbe0e6] px-4'>
            <Picker
              selectedValue={form.supplyId}
              onValueChange={(v) => setForm({ ...form, supplyId: v })}
            >
              <Picker.Item label='Select Supplier' value='' />
              {supplyList.map((s) => (
                <Picker.Item
                  key={s.id}
                  label={s.supplyName}
                  value={String(s.id)}
                />
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

        <View className='flex-row justify-center gap-4 mt-4'>
          <Button title='Submit' onPress={handleSubmit} />
          <Button title='Modify' onPress={() => setShowModifyModal(true)} />
        </View>

        {/* MODIFY MODAL */}
        <Modal visible={showModifyModal} transparent>
          <View className='flex-1 justify-center items-center bg-black/40'>
            <View className='bg-white p-5 w-[90%] rounded-xl'>
              <Text>Supplier</Text>

              {/* Supplier Picker */}
              <Picker
                selectedValue={filterSupplierId}
                onValueChange={(v) => {
                  if (v !== "") loadInvoicesBySupplier(Number(v));
                }}
              >
                <Picker.Item label='Select Supplier' value='' />
                {supplyList.map((s) => (
                  <Picker.Item
                    key={s.id}
                    label={s.supplyName}
                    value={String(s.id)}
                  />
                ))}
              </Picker>

              {/* Invoice Picker */}
              {invoiceList.length > 0 && (
                <Picker
                  selectedValue={selectedInvoiceId}
                  onValueChange={(v) => {
                    if (v !== "") loadPurchaseDetails(Number(v));
                  }}
                >
                  <Picker.Item label='Select Invoice' value='' />
                  {invoiceList.map((i) => (
                    <Picker.Item
                      key={i.id}
                      label={i.InvoiceNo}
                      value={String(i.id)}
                    />
                  ))}
                </Picker>
              )}

              {/* Editable Form */}
              {selectedInvoiceId !== "" && (
                <>
                  <TextInput
                    value={form.invoiceNo}
                    onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
                  />

                  <Pressable onPress={() => setShowDatePickerModal(true)}>
                    <Text>{form.invoiceDate || "Select Date"}</Text>
                  </Pressable>

                  {showDatePickerModal && (
                    <DateTimePicker
                      value={selectedDate}
                      mode='date'
                      display='default'
                      onChange={onDateChange}
                    />
                  )}

                  <TextInput
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
          <Link
            href={{
              pathname: "/Transaction/forms/showPurchase",
              params: { refresh: refreshList ? "1" : "0" },
            }}
          >
            <Text>Show Purchase</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default Purchase;
