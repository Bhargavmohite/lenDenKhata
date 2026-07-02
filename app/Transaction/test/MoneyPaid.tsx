import { View, Text, ScrollView, TextInput, Pressable, Alert, Button, Platform, NativeModules, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import useSafeDatabase from '@/app/hooks/useSafeDatabase';
import { Link, router } from 'expo-router';


const MoneyPaid = () => {
const db = useSafeDatabase();

const { TaskerModule } = NativeModules;

const triggerTaskerSMS = async (
  supplierMobile: string,
  supplierName: string,
  invoiceNo: string,
  invoiceDate: string,
  amount: string
) => {
  try {
    await TaskerModule.sendBroadcast(
      "com.anonymous.SEND_PUR",
      supplierMobile,
      `
      Payment Recorded Successfully
      Supplier: ${supplierName}
      Voucher No: ${invoiceNo}
      Date: ${invoiceDate}
      Amount: ₹${amount}
      `
    );
  } catch (error) {
    console.error("Tasker SMS Error:", error);
  }
};

const logError = (context: string, error: unknown) => {
  console.error(`[${context}]`, error);

  const message =
    error instanceof Error
      ? error.message
      : "Unexpected error occurred";

  Alert.alert("Error", message);
};

const [form, setForm] = useState({
  invoiceNo: "",
  invoiceDate: "",
  supplyId: null as number | null,
  bankId: null as number | null,
  amount: "",
  narration: "",
});

const [supplierList, setSupplierList] = useState<
  { id: number; supplyName: string }[]
>([]);

const [bankList, setBankList] = useState<{ id: number; bankName: string }[]>(
  [],
);

const [selectedDate, setSelectedDate] = useState(new Date());

const [showDatePickerMain, setShowDatePickerMain] = useState(false);
const [showDatePickerModal, setShowDatePickerModal] = useState(false);

const onDateChange = (_: any, date?: Date) => {
  if (Platform.OS !== "ios") {
    setShowDatePickerMain(false);
    setShowDatePickerModal(false);
  }

  if (date) {
    setSelectedDate(date);

    setForm((prev) => ({
      ...prev,
      invoiceDate: date.toISOString().split("T")[0],
    }));
  }
};

const [refreshList, setRefreshList] = useState(false);

/* MODIFY */

const [showModifyModal, setShowModifyModal] = useState(false);

const [filterSupplierId, setFilterSupplierId] = useState("");

const [invoiceList, setInvoiceList] = useState<
  { id: number; InvoiceNo: string }[]
>([]);

const [selectedInvoiceId, setSelectedInvoiceId] = useState("");


useEffect(() => {
  const loadData = async () => {
    try {
      if (!db) return;

      // Supplier List
      const suppliers = await db.getAllAsync<{
        id: number;
        supplyName: string;
      }>(
        `SELECT id, supplyName
         FROM Supply
         ORDER BY supplyName`,
      );

      setSupplierList(suppliers);

      // Bank List
      const banks = await db.getAllAsync<{
        id: number;
        bankName: string;
      }>(
        `SELECT id, bankName
         FROM Bank
         ORDER BY bankName`,
      );

      setBankList(banks);
    } catch (error) {
      logError("Load Master Data", error);
    }
  };

  loadData();
}, [db]);

const handleSubmit = async () => {
  try {
    if (
      !form.invoiceNo ||
      !form.invoiceDate ||
      form.supplyId === null ||
      form.bankId === null ||
      !form.amount
    ) {
      Alert.alert("Alert", "Please fill all required fields");
      return;
    }

    if (!db) {
      Alert.alert("Error", "Database not ready");
      return;
    }

    if (isNaN(Number(form.amount))) {
      Alert.alert("Error", "Amount must be numeric");
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

    const supplier = await db.getFirstAsync<{
            supplyName: string;
            mobileNumber: string;
            }>(
            `SELECT supplyName, mobileNumber
            FROM Supply
            WHERE id = ?`,
            [form.supplyId]
        );
    
    if (supplier) {
  await triggerTaskerSMS(
    supplier.mobileNumber,
    supplier.supplyName,
    form.invoiceNo,
    form.invoiceDate,
    form.amount
  );
  }

    Alert.alert("Success", "Money Paid added successfully");

    // Cleanup
    setForm({
      invoiceNo: "",
      invoiceDate: "",
      supplyId: null,
      bankId: null,
      amount: "",
      narration: "",
    });

    setSelectedDate(new Date());

    setRefreshList((prev) => !prev);

    // Navigation
    router.push("/(user)/transaction");
  } catch (error) {
    logError("MoneyPaid Submit", error);
  }
};

const loadInvoicesBySupplier = async (supplierId: number) => {
  try {
    if (!db) return;

    setFilterSupplierId(String(supplierId));
    setSelectedInvoiceId("");

    const result = await db.getAllAsync<{
      id: number;
      InvoiceNo: string;
    }>(
      `SELECT id, InvoiceNo
       FROM MoneyPaid
       WHERE supplyId = ?
       ORDER BY InvoiceNo DESC`,
      [supplierId]
    );

    setInvoiceList(result);
  } catch (error) {
    console.error("Load Invoices Error:", error);
    Alert.alert("Error", "Failed to load invoices.");
  }
};

const handleUpdate = async () => {
  try {
    if (!db) return;

    if (!selectedInvoiceId) {
      Alert.alert("Error", "Select an invoice first.");
      return;
    }

    if (
      !form.invoiceNo ||
      !form.invoiceDate ||
      form.supplyId === null ||
      form.bankId === null ||
      !form.amount
    ) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    await db.runAsync(
      `UPDATE MoneyPaid
       SET
         InvoiceNo = ?,
         invoiceDate = ?,
         supplyId = ?,
         bankId = ?,
         amount = ?,
         narration = ?
       WHERE id = ?`,
      [
        Number(form.invoiceNo),
        form.invoiceDate,
        form.supplyId,
        form.bankId,
        Number(form.amount),
        form.narration,
        Number(selectedInvoiceId),
      ]
    );

    Alert.alert("Success", "Money Paid updated successfully.");

    setShowModifyModal(false);

    setSelectedInvoiceId("");
    setFilterSupplierId("");
    setInvoiceList([]);

    setForm({
      invoiceNo: "",
      invoiceDate: "",
      supplyId: null,
      bankId: null,
      amount: "",
      narration: "",
    });

    setSelectedDate(new Date());

    setRefreshList((prev) => !prev);

    router.push("/(user)/transaction");
  } catch (error) {
    console.error("Update Error:", error);
    Alert.alert("Error", "Failed to update Money Paid.");
  }
};

const loadMoneyPaidDetails = async (id: number) => {
  try {
    if (!db) return;

    setSelectedInvoiceId(String(id));

    const result = await db.getFirstAsync<{
      InvoiceNo: number;
      invoiceDate: string;
      supplyId: number;
      bankId: number;
      amount: number;
      narration: string | null;
    }>(
      `SELECT *
       FROM MoneyPaid
       WHERE id = ?`,
      [id],
    );

    if (result) {
      setForm({
        invoiceNo: String(result.InvoiceNo),
        invoiceDate: result.invoiceDate,
        supplyId: result.supplyId,
        bankId: result.bankId,
        amount: String(result.amount),
        narration: result.narration ?? "",
      });

      setSelectedDate(new Date(result.invoiceDate));
    }
  } catch (error) {
    logError("Load Details", error);
  }
};

  return (
    <>
      <ScrollView>
        <View>
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
                onValueChange={onDateChange}
              />
            )}

            <Text className='text-base font-medium mt-4 pb-2'>Supplier</Text>
            <View className='rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4'>
              <Picker
                selectedValue={form.supplyId}
                onValueChange={(v) => setForm({ ...form, supplyId: v })}
              >
                <Picker.Item label='Select Supplier' value={null} />
                {supplierList.map((s) => (
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
          <View className='flex-row justify-center gap-4 mt-4'>
                <Button title='Submit' onPress={handleSubmit}/>
                <Button title='Modify' onPress={() => setShowModifyModal(true)}/>
        </View>

        <Modal visible={showModifyModal}
                transparent
                animationType="fade"
        >
  <View className="flex-1 justify-center items-center bg-black/40">
    <View className="bg-white w-[90%] rounded-xl p-5">

      <Text className="text-lg font-semibold mb-4">
        Modify Money Paid
      </Text>

      {/* Supplier Picker */}
      <Text className="mb-2">Supplier</Text>

      <Picker
        selectedValue={filterSupplierId}
        onValueChange={(value) => {
          if (value !== "") {
            loadInvoicesBySupplier(Number(value));
          }
        }}
      >
        <Picker.Item
          label="Select Supplier"
          value=""
        />

        {supplierList.map((supplier) => (
          <Picker.Item
            key={supplier.id}
            label={supplier.supplyName}
            value={String(supplier.id)}
          />
        ))}
      </Picker>

      {/* Voucher Picker */}
      {invoiceList.length > 0 && (
        <>
          <Text className="mt-3 mb-2">
            Voucher
          </Text>

          <Picker
            selectedValue={selectedInvoiceId}
            onValueChange={(value) => {
              if (value !== "") {
                loadMoneyPaidDetails(Number(value));
              }
            }}
          >
            <Picker.Item
              label="Select Voucher"
              value=""
            />

            {invoiceList.map((invoice) => (
              <Picker.Item
                key={invoice.id}
                label={String(invoice.InvoiceNo)}
                value={String(invoice.id)}
              />
            ))}
          </Picker>
        </>
      )}

      {/* Editable Form */}
      {selectedInvoiceId !== "" && (
        <>
          <Text className="mt-4 mb-2">
            Voucher Number
          </Text>

          <TextInput
            className="h-12 rounded-lg border border-[#dbe0e6] px-4 mb-3"
            value={form.invoiceNo}
            onChangeText={(text) =>
              setForm({
                ...form,
                invoiceNo: text,
              })
            }
          />

          <Text className="mb-2">
            Date
          </Text>

          <Pressable
            onPress={() => setShowDatePickerModal(true)}
            className="h-12 rounded-lg border border-[#dbe0e6] px-4 justify-center mb-3"
          >
            <Text>
              {form.invoiceDate || "Select Date"}
            </Text>
          </Pressable>

          {showDatePickerModal && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={onDateChange}
            />
          )}

          {/* Supplier */}

          <Text className="mb-2">
            Supplier
          </Text>

          <View className="rounded-lg border border-[#dbe0e6] mb-3">
            <Picker
              selectedValue={form.supplyId}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  supplyId:
                    value !== null
                      ? Number(value)
                      : null,
                })
              }
            >
              <Picker.Item
                label="Select Supplier"
                value={null}
              />

              {supplierList.map((supplier) => (
                <Picker.Item
                  key={supplier.id}
                  label={supplier.supplyName}
                  value={supplier.id}
                />
              ))}
            </Picker>
          </View>

          {/* Bank */}

          <Text className="mb-2">
            Bank
          </Text>

          <View className="rounded-lg border border-[#dbe0e6] mb-3">
            <Picker
              selectedValue={form.bankId}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  bankId:
                    value !== null
                      ? Number(value)
                      : null,
                })
              }
            >
              <Picker.Item
                label="Select Bank"
                value={null}
              />

              {bankList.map((bank) => (
                <Picker.Item
                  key={bank.id}
                  label={bank.bankName}
                  value={bank.id}
                />
              ))}
            </Picker>
          </View>

          <Text className="mb-2">
            Amount
          </Text>

          <TextInput
            keyboardType="numeric"
            className="h-12 rounded-lg border border-[#dbe0e6] px-4 mb-3"
            value={form.amount}
            onChangeText={(text) =>
              setForm({
                ...form,
                amount: text,
              })
            }
          />

          <Text className="mb-2">
            Narration
          </Text>

          <TextInput
            className="h-12 rounded-lg border border-[#dbe0e6] px-4 mb-4"
            value={form.narration}
            onChangeText={(text) =>
              setForm({
                ...form,
                narration: text,
              })
            }
          />

          <View className="flex-row justify-between">
            <Button
              title="Update"
              onPress={handleUpdate}
            />

            <Button
              title="Cancel"
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
    </>
  );
}

export default MoneyPaid