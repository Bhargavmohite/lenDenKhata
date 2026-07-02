import { View, Text, ScrollView, Alert, TextInput, Pressable, Platform, Modal, Button, NativeModules } from 'react-native'
import React, { useEffect, useState } from 'react'
import useSafeDatabase from '@/app/hooks/useSafeDatabase';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Link, router } from 'expo-router';

interface Purchase {
  id: number;
  InvoiceNo: number;
  invoiceDate: string;
  supplyId: number;
  amount: number;
  narration?: string;
}
const Purchase = () => {

const db = useSafeDatabase();

const { TaskerModule } = NativeModules;

const triggerTaskerSMS = async (
  supplierMobile: string,
  supplierName: string,
  invoiceNo: string,
  invoiceDate: string,
  amount: string,
) => {
  try {
    await TaskerModule.sendBroadcast(
      "com.anonymous.SEND_PUR",
      supplierMobile,
      `
Welcome to LendenKhata

Your purchase has been recorded successfully.

Supplier Name: ${supplierName}
Invoice No: ${invoiceNo}
Invoice Date: ${invoiceDate}
Amount: ₹${amount}

`,
    );

    console.log("Tasker broadcast sent successfully");
  } catch (error) {
    console.error("Tasker Error:", error);
  }
};

const pushToMenu = () => {
  router.push("/(user)/transaction");
};
const [form, setForm] = useState({
  invoiceNo: "",
  invoiceDate: "",
  supplyId: "",
  amount: "",
  narration: "",
});


const resetForm = () => {
  setForm({
    invoiceNo: "",
    invoiceDate: "",
    supplyId: "",
    amount: "",
    narration: "",
  });

  setSelectedDate(new Date());

  setFilterSupplierId("");
  setSelectedInvoiceId("");
  setInvoiceList([]);

  setShowModifyModal(false);
};


// date picker
const [selectedDate, setSelectedDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);

// modal
const [showModifyModal, setShowModifyModal] = useState(false);

const [filterSupplierId, setFilterSupplierId] = useState("");

const [invoiceList, setInvoiceList] = useState<
  {
    id: number;
    InvoiceNo: number;
  }[]
>([]);

const [selectedInvoiceId, setSelectedInvoiceId] = useState("");


const loadInvoicesBySupplier = async (supplierId: number) => {
  if (!db) return;

  try {
    setFilterSupplierId(String(supplierId));
    setSelectedInvoiceId("");

    const result = await db.getAllAsync<{
      id: number;
      InvoiceNo: number;
    }>(
      `
      SELECT id, InvoiceNo
      FROM Purchase
      WHERE supplyId = ?
      ORDER BY InvoiceNo DESC
      `,
      [supplierId],
    );

    setInvoiceList(result);
  } catch (error) {
      console.error("Load Invoice Error:", error);

      Alert.alert("Error", "Failed to load invoices.");
  }
};

// date picker
const onDateChange = (_: any, date?: Date) => {
  if (Platform.OS !== "ios") {
    setShowDatePicker(false);
  }

  if (date) {
    setSelectedDate(date);

    setForm((prev) => ({
      ...prev,
      invoiceDate: date.toISOString().split("T")[0],
    }));
};
  }

// supplier list
const [supplierList, setSupplierList] = useState<
  {
    id: number;
    supplyName: string;
  }[]
>([]);

const [refreshList, setRefreshList] = useState(false);


useEffect(() => {
  if (!db) return;

  const loadSuppliers = async () => {
    try {
      const result = await db.getAllAsync<{
        id: number;
        supplyName: string;
      }>(
        `
        SELECT id, supplyName
        FROM Supply
        ORDER BY supplyName
        `,
      );

      setSupplierList(result);
    } catch (error) {
        console.error("Load Supplier Error:", error);

        Alert.alert("Error", "Failed to load suppliers.");
    }
  };

  loadSuppliers();
}, [db]);

const handleSubmit = async () => {
  if (!db) {
    Alert.alert("Error", "Database not ready");
    return;
  }

  try {
    if (
      !form.invoiceNo.trim() ||
      !form.invoiceDate ||
      !form.supplyId ||
      !form.amount.trim()
    ) {
      Alert.alert("Alert", "Please fill all required fields");
      return;
    }

    const supplier = await db.getFirstAsync<{
      supplyName: string;
      mobileNumber: string;
    }>(
      `
   SELECT supplyName, mobileNumber
   FROM Supply
   WHERE id = ?
   `,
      [Number(form.supplyId)],
    );

    const amount = Number(form.amount);

    if (isNaN(amount)) {
      Alert.alert("Alert", "Invalid amount");
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
        amount,
        form.narration.trim(),
      ],
    );

    if (supplier) {
      await triggerTaskerSMS(
        String(supplier.mobileNumber),
        supplier.supplyName,
        form.invoiceNo,
        form.invoiceDate,
        form.amount,
      );
    }

    Alert.alert("Success", "Purchase added successfully");

    resetForm();
    setRefreshList((prev) => !prev);
    pushToMenu();
  } catch (error) {
      console.error("Purchase Submit Error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Something went wrong while saving purchase.",
      );
  }
};


const handleUpdate = async () => {
  if (!db) {
    Alert.alert("Error", "Database not ready");
    return;
  }

  try {
    if (!selectedInvoiceId) {
      Alert.alert("Alert", "Select an invoice");
      return;
    }

    if (
      !form.invoiceNo.trim() ||
      !form.invoiceDate ||
      !form.supplyId ||
      !form.amount.trim()
    ) {
      Alert.alert("Alert", "Please fill all required fields");
      return;
    }

    const amount = Number(form.amount);

    if (isNaN(amount)) {
      Alert.alert("Alert", "Invalid amount");
      return;
    }

    await db.runAsync(
      `
      UPDATE Purchase
      SET
        InvoiceNo = ?,
        invoiceDate = ?,
        supplyId = ?,
        amount = ?,
        narration = ?
      WHERE id = ?
      `,
      [
        Number(form.invoiceNo),
        form.invoiceDate,
        Number(form.supplyId),
        amount,
        form.narration.trim(),
        Number(selectedInvoiceId),
      ],
    );

    Alert.alert("Success", "Purchase updated successfully");

    setShowModifyModal(false);

    setFilterSupplierId("");
    setSelectedInvoiceId("");
    setInvoiceList([]);

    resetForm();
    setRefreshList((prev) => !prev);
    pushToMenu();
  } catch (error) {
      console.error("Purchase Update Error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Something went wrong while updating purchase.",
      );
  }
};

//load purchase details 
const loadPurchaseDetails = async (purchaseId: number) => {
  if (!db) return;

  try {
    setSelectedInvoiceId(String(purchaseId));

    const result = await db.getFirstAsync<Purchase>(
      `
      SELECT *
      FROM Purchase
      WHERE id = ?
      `,
      [purchaseId],
    );

    if (!result) {
      Alert.alert("Error", "Purchase not found");
      return;
    }

    setForm({
      invoiceNo: String(result.InvoiceNo),
      invoiceDate: result.invoiceDate,
      supplyId: String(result.supplyId),
      amount: String(result.amount),
      narration: result.narration ?? "",
    });
  } catch (error) {
      console.error("Load Purchase Error:", error);

      Alert.alert("Error", "Failed to load purchase details.");
  }
};


  return (
    <>
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

            <Text className='text-base font-medium mt-4 pb-2'>
              Invoice Date
            </Text>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              className='w-full h-14 rounded-lg border border-[#dbe0e6] px-4 flex-row items-center justify-between'
            >
              <Text>{form.invoiceDate || "Select Date"}</Text>

              <MaterialIcons name='calendar-today' size={22} color='gray' />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode='date'
                display='default'
                onChange={onDateChange}
              />
            )}

            <Text className='text-base font-medium mt-4 pb-2'>
              Supplier Name
            </Text>

            <View className='rounded-lg border border-[#dbe0e6] px-4'>
              <Picker
                selectedValue={form.supplyId}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    supplyId: value,
                  }))
                }
              >
                <Picker.Item label='Select Supplier' value='' />

                {supplierList.map((supplier) => (
                  <Picker.Item
                    key={supplier.id}
                    label={supplier.supplyName}
                    value={String(supplier.id)}
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
{/* modify modal */}
          <Modal visible={showModifyModal} transparent animationType='fade'>
            <View className='flex-1 justify-center items-center bg-black/40'>
              <View className='bg-white w-[90%] rounded-xl p-5'>
                <Text className='mb-2'>Supplier</Text>

                <Picker
                  selectedValue={filterSupplierId}
                  onValueChange={(value) => {
                    if (value !== "") {
                      loadInvoicesBySupplier(Number(value));
                    }
                  }}
                >
                  <Picker.Item label='Select Supplier' value='' />

                  {supplierList.map((supplier) => (
                    <Picker.Item
                      key={supplier.id}
                      label={supplier.supplyName}
                      value={String(supplier.id)}
                    />
                  ))}
                </Picker>

                {invoiceList.length > 0 && (
                  <Picker
                    selectedValue={selectedInvoiceId}
                    onValueChange={(value) => {
                      if (value !== "") {
                        loadPurchaseDetails(Number(value));
                      }
                    }}
                  >
                    <Picker.Item label='Select Invoice' value='' />

                    {invoiceList.map((invoice) => (
                      <Picker.Item
                        key={invoice.id}
                        label={String(invoice.InvoiceNo)}
                        value={String(invoice.id)}
                      />
                    ))}
                  </Picker>
                )}

                {/* Editable Form */}
                {selectedInvoiceId !== "" && (
                  <>
                    <Text className='mt-4 mb-2'>Invoice Number</Text>
                    <TextInput
                      className='h-12 rounded-lg border border-[#dbe0e6] px-4 mb-3'
                      value={form.invoiceNo}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          invoiceNo: text,
                        }))
                      }
                    />

                    <Text className='mb-2'>Invoice Date</Text>

                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      className='h-12 rounded-lg border border-[#dbe0e6] px-4 justify-center mb-3'
                    >
                      <Text>{form.invoiceDate || "Select Date"}</Text>
                    </Pressable>

                    {showDatePicker && (
                      <DateTimePicker
                        value={selectedDate}
                        mode='date'
                        display='default'
                        onChange={onDateChange}
                      />
                    )}

                    <Text className='mb-2'>Supplier</Text>

                    <View className='rounded-lg border border-[#dbe0e6] mb-3'>
                      <Picker
                        selectedValue={form.supplyId}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            supplyId: value,
                          }))
                        }
                      >
                        <Picker.Item label='Select Supplier' value='' />

                        {supplierList.map((supplier) => (
                          <Picker.Item
                            key={supplier.id}
                            label={supplier.supplyName}
                            value={String(supplier.id)}
                          />
                        ))}
                      </Picker>
                    </View>

                    <Text className='mb-2'>Amount</Text>

                    <TextInput
                      className='h-12 rounded-lg border border-[#dbe0e6] px-4 mb-3'
                      keyboardType='numeric'
                      value={form.amount}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          amount: text,
                        }))
                      }
                    />

                    <Text className='mb-2'>Narration</Text>

                    <TextInput
                      className='h-12 rounded-lg border border-[#dbe0e6] px-4 mb-4'
                      value={form.narration}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          narration: text,
                        }))
                      }
                    />

                    <View className='flex-row justify-between'>
                      <Button title='Update' onPress={handleUpdate} />

                      <Button
                        title='Cancel'
                        onPress={() => {
                          setShowModifyModal(false);
                          setSelectedInvoiceId("");
                        }}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>
{/* list of purchase */}
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
    </>
  );
}

export default Purchase