import { View, Text, ScrollView, Alert, Modal, Button, TextInput, Platform, NativeModules, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import useSafeDatabase from '@/app/hooks/useSafeDatabase';
import { Link, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';


const MoneyReceived = () => {

const db = useSafeDatabase();

const { TaskerModule } = NativeModules;


const getBalance = async (customerId: number) => {
  if (!db) return 0;

  try {
    const result = await db.getFirstAsync<{ balance: number }>(
      `
      SELECT SUM(amount) as balance
      FROM MoneyReceived
      WHERE customerId = ?
      `,
      [customerId]
    );

    return result?.balance ?? 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const triggerTaskerSMS = async (
  customerMobile: string,
  customerName: string,
  voucherNo: string,
  voucherDate: string,
  amount: string,
  balance: number
) => {
  try {
    await TaskerModule.sendBroadcast(
      "com.anonymous.SEND_PUR",
      customerMobile,
      `
      Len Den Khata 
      --------------------------------
      Money received 

      Received from: ${customerName}
      Date: ${voucherDate}
      Amount received (Rs): ${amount}
      Narration:${form.narration || "N/A"}
      Balance (Rs): ${balance || "N/A"}

      Thanks for your transaction
`,
    );
  } catch (error) {
    console.error("Tasker SMS Error:", error);
  }
};

const [isLoading, setIsLoading] = useState(true);

const [refreshList, setRefreshList] = useState(false);

const [form, setForm] = useState({
  invoiceNo: "",
  invoiceDate: "",
  customerId: "",
  bankId: "",
  amount: "",
  narration: "",
});

const logError = (context: string, error: unknown) => {
  console.error(`[${context}]`, error);

  const message =
    error instanceof Error ? error.message : "Unexpected error occurred";

  Alert.alert("Error", message);
};

const [customerList, setCustomerList] = useState<
  {
    id: number;
    customerName: string;
  }[]
>([]);

const [bankList, setBankList] = useState<
  {
    id: number;
    bankName: string;
  }[]
>([]);


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

const [showModifyModal, setShowModifyModal] = useState(false);

const [filterCustomerId, setFilterCustomerId] = useState("");

const [invoiceList, setInvoiceList] = useState<
  { id: number; InvoiceNo: string }[]
>([]);

const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

useEffect(() => {
  const loadData = async () => {
    try {
      if (!db) return;

      setIsLoading(true);

      const customers = await db.getAllAsync<{
        id: number;
        customerName: string;
      }>(
        `SELECT id, customerName
         FROM Customer
         ORDER BY customerName`,
      );

      const banks = await db.getAllAsync<{
        id: number;
        bankName: string;
      }>(
        `SELECT id, bankName
         FROM Bank
         ORDER BY bankName`,
      );

      setCustomerList(customers);
      setBankList(banks);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load customers and banks.");
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
}, [db]);

const loadInvoicesByCustomer = async (customerId: number) => {
  try {
    if (!db) return;

    setFilterCustomerId(String(customerId));
    setSelectedInvoiceId("");

    const result = await db.getAllAsync<{
      id: number;
      InvoiceNo: string;
    }>(
      `SELECT id, InvoiceNo
       FROM MoneyReceived
       WHERE customerId = ?`,
      [customerId],
    );

    setInvoiceList(result);
  } catch (error) {
    logError("Load Invoices", error);
  }
};

const loadMoneyReceivedDetails = async (id: number) => {
  try {
    if (!db) return;

    setSelectedInvoiceId(String(id));

    const result = await db.getFirstAsync<{
      InvoiceNo: string;
      invoiceDate: string;
      customerId: number;
      bankId: number;
      amount: number;
      narration?: string;
    }>(
      `SELECT *
       FROM MoneyReceived
       WHERE id = ?`,
      [id],
    );

    if (result) {
      setForm({
        invoiceNo: result.InvoiceNo,
        invoiceDate: result.invoiceDate,
        customerId: String(result.customerId),
        bankId: String(result.bankId),
        amount: String(result.amount),
        narration: result.narration || "",
      });

      setSelectedDate(new Date(result.invoiceDate));
    }
  } catch (error) {
    logError("Load Money Received", error);
  }
};


const handleSubmit = async () => {
  try {
    if (
      !form.invoiceNo ||
      !form.invoiceDate ||
      !form.customerId ||
      !form.bankId ||
      !form.amount
    ) {
      Alert.alert("Alert", "Please fill all required fields.");
      return;
    }

    if (!db) {
      Alert.alert("Database not ready");
      return;
    }

    if (isNaN(Number(form.amount))) {
      Alert.alert("Alert", "Amount must be numeric.");
      return;
    }

    // Insert Record
    await db.runAsync(
      `INSERT INTO MoneyReceived
      (
        InvoiceNo,
        invoiceDate,
        customerId,
        bankId,
        amount,
        narration
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(form.invoiceNo),
        form.invoiceDate,
        Number(form.customerId),
        Number(form.bankId),
        Number(form.amount),
        form.narration,
      ],
    );

    const currentBalance = await getBalance(Number(form.customerId));

    if (!db) {
      Alert.alert("Database not ready");
      return;
    }
    // Load Customer Details
    const customer = await db.getFirstAsync<{
      customerName: string;
      mobileNumber: string;
    }>(
      `SELECT
          customerName,
          mobileNumber
       FROM Customer
       WHERE id = ?`,
      [Number(form.customerId)],
    );

    // Send SMS
    if (customer) {
      await triggerTaskerSMS(
        String(customer.mobileNumber),
        customer.customerName,
        form.invoiceNo,
        form.invoiceDate,
        form.amount,
        currentBalance,
      );
    }

    Alert.alert("Success", "Money Received added successfully.");

    // Cleanup
    setForm({
      invoiceNo: "",
      invoiceDate: "",
      customerId: "",
      bankId: "",
      amount: "",
      narration: "",
    });

    setSelectedDate(new Date());

    setRefreshList((prev) => !prev);

    // Navigation
    router.push("/(user)/transaction");
  } catch (error) {
    logError("MoneyReceived Submit", error);
  }
};

const handleUpdate = async () => {
  try {
    if (!db) return;

    if (!selectedInvoiceId) {
      Alert.alert("Select Voucher");
      return;
    }

    await db.runAsync(
      `UPDATE MoneyReceived
       SET
         InvoiceNo = ?,
         invoiceDate = ?,
         customerId = ?,
         bankId = ?,
         amount = ?,
         narration = ?
       WHERE id = ?`,
      [
        Number(form.invoiceNo),
        form.invoiceDate,
        Number(form.customerId),
        Number(form.bankId),
        Number(form.amount),
        form.narration,
        Number(selectedInvoiceId),
      ],
    );

    Alert.alert("Updated Successfully");

    setShowModifyModal(false);

    setSelectedInvoiceId("");
    setFilterCustomerId("");
    setInvoiceList([]);

    setForm({
      invoiceNo: "",
      invoiceDate: "",
      customerId: "",
      bankId: "",
      amount: "",
      narration: "",
    });

    router.push("/(user)/transaction");
  } catch (error) {
    logError("Update MoneyReceived", error);
  }
};


  return (
    <>
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
          <View className='w-full max-w-md self-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-8 gap-4'>
            <Text className='text-xl font-semibold text-black dark:text-gray-300'>
              Voucher Number
            </Text>

            <TextInput
              className='h-14 rounded-lg px-4 text-xl text-black dark:text-white'
              style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
              value={form.invoiceNo}
              placeholder='Voucher Number'
              placeholderTextColor='#617589'
              onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
            />

            <Text className='text-xl font-semibold text-black dark:text-gray-300'>
              Date
            </Text>

            <Pressable
              className='h-14 rounded-lg px-4 justify-center'
              style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
              onPress={() => setShowDatePickerMain(true)}
            >
              <Text className='text-xl text-black dark:text-white'>
                {form.invoiceDate || "Select Date"}
              </Text>
            </Pressable>

            {showDatePickerMain && (
              <DateTimePicker
                value={selectedDate}
                mode='date'
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onValueChange={onDateChange}
              />
            )}

            <Text className='text-xl font-semibold text-black dark:text-gray-300'>
              Customer
            </Text>

            <View
              className='rounded-lg'
              style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
            >
              <Picker
                selectedValue={form.customerId}
                onValueChange={(v) => setForm({ ...form, customerId: v })}
                style={{ fontSize: 20 }}
              >
                <Picker.Item label='Select' value={null} />
                {customerList.map((c) => (
                  <Picker.Item key={c.id} label={c.customerName} value={c.id} />
                ))}
              </Picker>
            </View>

            <Text className='text-xl font-semibold text-black dark:text-gray-300'>
              Amount
            </Text>

            <TextInput
              className='h-14 rounded-lg px-4 text-xl text-black dark:text-white'
              style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
              value={form.amount}
              placeholder='Amount'
              placeholderTextColor='#617589'
              onChangeText={(t) => setForm({ ...form, amount: t })}
            />

            <Text className='text-xl font-semibold text-black dark:text-gray-300'>
              Bank
            </Text>

            <View
              className='rounded-lg'
              style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
            >
              <Picker
                selectedValue={form.bankId}
                onValueChange={(v) => setForm({ ...form, bankId: v })}
                style={{ fontSize: 20 }}
              >
                <Picker.Item label='Select' value={null} />
                {bankList.map((b) => (
                  <Picker.Item key={b.id} label={b.bankName} value={b.id} />
                ))}
              </Picker>
            </View>

            <Text className='text-xl font-semibold text-black dark:text-gray-300'>
              Narration
            </Text>

            <TextInput
              className='h-14 rounded-lg px-4 text-xl text-black dark:text-white'
              style={{ borderColor: "#dbe0e6", borderWidth: 1 }}
              value={form.narration}
              placeholder='Narration'
              placeholderTextColor='#617589'
              onChangeText={(t) => setForm({ ...form, narration: t })}
            />
          </View>

          {/* BUTTONS */}
          <View className='flex-row justify-center gap-4'>
            <Button title='Submit' onPress={handleSubmit} />
            <Button title='Modify' onPress={() => setShowModifyModal(true)} />
          </View>
          <Modal visible={showModifyModal} transparent animationType='fade'>
            <View className='flex-1 justify-center items-center bg-black/40'>
              <View className='bg-white rounded-xl p-5 w-[90%]'>
                <Text className='text-lg font-semibold mb-4'>
                  Modify Money Received
                </Text>

                {/* Customer */}

                <Text className='mb-2'>Customer</Text>

                <Picker
                  selectedValue={filterCustomerId}
                  onValueChange={(value) => {
                    if (value !== "") {
                      loadInvoicesByCustomer(Number(value));
                    }
                  }}
                >
                  <Picker.Item label='Select Customer' value='' />

                  {customerList.map((customer) => (
                    <Picker.Item
                      key={customer.id}
                      label={customer.customerName}
                      value={String(customer.id)}
                    />
                  ))}
                </Picker>

                {/* Voucher */}

                {invoiceList.length > 0 && (
                  <Picker
                    selectedValue={selectedInvoiceId}
                    onValueChange={(value) => {
                      if (value !== "") {
                        loadMoneyReceivedDetails(Number(value));
                      }
                    }}
                  >
                    <Picker.Item label='Select Voucher' value='' />

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
                    <Text className='mt-4'>Voucher No</Text>

                    <TextInput
                      className='border rounded-lg h-12 px-3 mb-3'
                      value={form.invoiceNo}
                      onChangeText={(text) =>
                        setForm({
                          ...form,
                          invoiceNo: text,
                        })
                      }
                    />

                    <Pressable
                      className='border rounded-lg h-12 justify-center px-3 mb-3'
                      onPress={() => setShowDatePickerModal(true)}
                    >
                      <Text>{form.invoiceDate}</Text>
                    </Pressable>

                    {showDatePickerModal && (
                      <DateTimePicker
                        value={selectedDate}
                        mode='date'
                        display='default'
                        onChange={onDateChange}
                      />
                    )}

                    <Picker
                      selectedValue={form.customerId}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          customerId: value,
                        })
                      }
                    >
                      {customerList.map((customer) => (
                        <Picker.Item
                          key={customer.id}
                          label={customer.customerName}
                          value={String(customer.id)}
                        />
                      ))}
                    </Picker>

                    <Picker
                      selectedValue={form.bankId}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          bankId: value,
                        })
                      }
                    >
                      {bankList.map((bank) => (
                        <Picker.Item
                          key={bank.id}
                          label={bank.bankName}
                          value={String(bank.id)}
                        />
                      ))}
                    </Picker>

                    <TextInput
                      className='border rounded-lg h-12 px-3 mt-3'
                      keyboardType='numeric'
                      value={form.amount}
                      onChangeText={(text) =>
                        setForm({
                          ...form,
                          amount: text,
                        })
                      }
                    />

                    <TextInput
                      className='border rounded-lg h-12 px-3 mt-3'
                      value={form.narration}
                      onChangeText={(text) =>
                        setForm({
                          ...form,
                          narration: text,
                        })
                      }
                    />

                    <View className='flex-row justify-between mt-4'>
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

          <View className='mt-6 items-centerflex items-center bg-white dark:bg-gray-800/50 rounded-xl p-4 w-[85%] relative left-8 top-[2rem]'>
            <Link href='/Transaction/forms/showMoneyReceived'>
              <Text>Show Customer</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

export default MoneyReceived