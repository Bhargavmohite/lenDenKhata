import { View, Text, ScrollView, TextInput, Pressable, Platform, Alert,  Modal, Button } from 'react-native'
import React, { useEffect, useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import useSafeDatabase from '@/app/hooks/useSafeDatabase';
import { NativeModules } from 'react-native';
import { Link, router } from 'expo-router';


type SalesForm = {
  invoiceNo: string;
  invoiceDate: string;
  customerId: number | null;
  amount: string;
  narration: string;
};

const Sales = () => {
    const db = useSafeDatabase();

    const { TaskerModule } = NativeModules;

const [form, setForm] = useState<SalesForm>({
  invoiceNo: "",
  invoiceDate: "",
  customerId: null,
  amount: "",
  narration: "",
});

const [customerList, setCustomerList] = useState<
  { id: number; customerName: string }[]
>([]);


const getBalance = async (customerId: number) => {
  if (!db) return 0;

  try {
    const result = await db.getFirstAsync<{ balance: number }>(
      `
      SELECT SUM(amount) as balance
      FROM Sales
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
  invoiceNo: string,
  invoiceDate: string,
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
      Sale info

      Inv. No. : ${invoiceNo} 
      Inv. Dt. : ${invoiceDate}
      customer: ${customerName}
      Amount (Rs): ${amount}
      Narration: ${form.narration}
      Balance (Rs): ${balance}

      Thanks for your transaction.
      `,
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


const [refreshList, setRefreshList] = useState(false);

const [showModifyModal, setShowModifyModal] = useState(false);

const [filterCustomerId, setFilterCustomerId] = useState("");

const [invoiceList, setInvoiceList] = useState<
  { id: number; InvoiceNo: string }[]
>([]);

const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

const [selectedDate, setSelectedDate] = useState(new Date());

const [showDatePickerMain, setShowDatePickerMain] = useState(false);
const [showDatePickerModal, setShowDatePickerModal] = useState(false);

const loadSalesDetails = async (id: number) => {
  try {
    if (!db) return;

    setSelectedInvoiceId(String(id));

    const result = await db.getFirstAsync<{
      InvoiceNo: string;
      invoiceDate: string;
      customerId: number;
      amount: number;
      narration?: string;
    }>(
      `SELECT * FROM Sales WHERE id = ?`,
      [id]
    );

    if (result) {
      setForm({
        invoiceNo: result.InvoiceNo,
        invoiceDate: result.invoiceDate,
        customerId: result.customerId,
        amount: String(result.amount),
        narration: result.narration || "",
      });

      setSelectedDate(new Date(result.invoiceDate));
    }
  } catch (error) {
    console.error("Load Sales Details Error:", error);
    Alert.alert("Error", "Failed to load sales details.");
  }
};

useEffect(() => {
  const loadCustomers = async () => {
    try {
      if (!db) return;

      const result = await db.getAllAsync<{
        id: number;
        customerName: string;
      }>(
        `SELECT id, customerName
         FROM Customer
         ORDER BY customerName`,
      );

      setCustomerList(result);
    } catch (error) {
      logError("Load Customers Error", error);
    }
  };

  loadCustomers();
}, [db]);
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

    if (!db) {
      Alert.alert("Database not ready");
      return;
    }

    await db.runAsync(
      `INSERT INTO Sales
      (InvoiceNo, invoiceDate, customerId, amount, narration)
      VALUES (?, ?, ?, ?, ?)`,
      [
        Number(form.invoiceNo),
        form.invoiceDate,
        Number(form.customerId),
        Number(form.amount),
        form.narration,
      ],
    );

    const currentBalance = await getBalance(Number(form.customerId));
    // 2️⃣ FETCH CUSTOMER (FOR SMS)
    const customer = await db.getFirstAsync<{
      customerName: string;
      mobileNumber: string;
    }>(
      `SELECT customerName, mobileNumber
       FROM Customer
       WHERE id = ?`,
      [Number(form.customerId)],
    );



    // 3️⃣ SEND SMS
    if (customer) {
     await triggerTaskerSMS(
        String(customer.mobileNumber),
        customer.customerName,
        form.invoiceNo,
        form.invoiceDate,
        form.amount,
        currentBalance
      );
    }

    Alert.alert("Success", "Sales added successfully");

        // 5️⃣ CLEANUP
    setForm({
      invoiceNo: "",
      invoiceDate: "",
      customerId: null,
      amount: "",
      narration: "",
    });

    setSelectedDate(new Date());
    setRefreshList((p) => !p);

    // 6️⃣ NAVIGATION
    router.push("/(user)/transaction");

  } catch (error) {
    logError("Sales Submit Error", error);
  }
};


const handleUpdate = async () => {
  try {
    if (!db) return;

    if (!selectedInvoiceId) {
      Alert.alert("Error", "No invoice selected");
      return;
    }

    

    await db.runAsync(
      `UPDATE Sales SET
        InvoiceNo = ?,
        invoiceDate = ?,
        customerId = ?,
        amount = ?,
        narration = ?
      WHERE id = ?`,
      [
        form.invoiceNo,
        form.invoiceDate,
        Number(form.customerId),
        Number(form.amount),
        form.narration,
        Number(selectedInvoiceId),
      ]
    );

    Alert.alert("Success", "Sales updated successfully");

    setShowModifyModal(false);

    setSelectedInvoiceId("");
    setFilterCustomerId("");
    setInvoiceList([]);
    setForm({
      invoiceNo: "",
      invoiceDate: "",
      customerId: null,
      amount: "",
      narration: "",
    });

    router.push("/(user)/transaction");
  } catch (error) {
    logError("Sales Update Error", error);
  }
};


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
       FROM Sales
       WHERE customerId = ?`,
      [customerId],
    );

    setInvoiceList(result || []);
  } catch (error) {
    logError("Load Invoices Error", error);
  }
};




return (
  <>
    <ScrollView
      className='flex-1 px-4 py-4'
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 220 }}
    >
      <View className='px-4 py-4'>
        <View className='w-full max-w-md self-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-8 gap-4'>
          <Text className='text-xl font-semibold text-black dark:text-gray-300'>
            Invoice Number
          </Text>

          <TextInput
            placeholder='Enter Invoice Number'
            placeholderTextColor='#617589'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-xl text-black dark:text-white'
            value={form.invoiceNo}
            onChangeText={(t) => setForm({ ...form, invoiceNo: t })}
          />

          <Text className='text-xl font-semibold text-black dark:text-gray-300'>
            Invoice Date
          </Text>

          <Pressable
            onPress={() => setShowDatePickerMain(true)}
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 flex-row items-center justify-between'
          >
            <Text className='text-xl text-black dark:text-white'>
              {form.invoiceDate || "Select Date"}
            </Text>

            <MaterialIcons name='calendar-today' size={24} color='gray' />
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
            Customer Name
          </Text>

          <View className='rounded-lg border border-[#dbe0e6] dark:border-gray-600 px-4'>
            <Picker
              selectedValue={form.customerId}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  customerId: v !== null ? Number(v) : null,
                })
              }
              style={{ fontSize: 20 }}
            >
              <Picker.Item label='Select Customer' value={null} />
              {customerList.map((c) => (
                <Picker.Item key={c.id} label={c.customerName} value={c.id} />
              ))}
            </Picker>
          </View>

          <Text className='text-xl font-semibold text-black dark:text-gray-300'>
            Amount
          </Text>

          <TextInput
            placeholder='Enter Amount'
            placeholderTextColor='#617589'
            keyboardType='numeric'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-xl text-black dark:text-white'
            value={form.amount}
            onChangeText={(t) => setForm({ ...form, amount: t })}
          />

          <Text className='text-xl font-semibold text-black dark:text-gray-300'>
            Narration
          </Text>

          <TextInput
            placeholder='Enter Narration'
            placeholderTextColor='#617589'
            className='w-full h-14 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-xl text-black dark:text-white'
            value={form.narration}
            onChangeText={(t) => setForm({ ...form, narration: t })}
          />
        </View>

        {/* Buttons */}
        <View className='flex-row justify-center gap-4 mt-4'>
          <Button title='Submit' onPress={handleSubmit} />
          <Button title='Modify' onPress={() => setShowModifyModal(true)} />
        </View>

        {/* Modify Modal */}
        <Modal visible={showModifyModal} transparent animationType='fade'>
          <View className='flex-1 justify-center items-center bg-black/40'>
            <View className='bg-white w-[90%] rounded-xl p-5'>
              <Text className='text-lg font-semibold mb-4'>Modify Sales</Text>

              {/* Customer Picker */}
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

              {/* Invoice Picker */}
              {invoiceList.length > 0 && (
                <Picker
                  selectedValue={selectedInvoiceId}
                  onValueChange={(value) => {
                    if (value !== "") {
                      loadSalesDetails(Number(value));
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
                      setForm({
                        ...form,
                        invoiceNo: text,
                      })
                    }
                  />

                  <Text className='mb-2'>Invoice Date</Text>

                  <Pressable
                    onPress={() => setShowDatePickerModal(true)}
                    className='h-12 rounded-lg border border-[#dbe0e6] px-4 justify-center mb-3'
                  >
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

                  <Text className='mb-2'>Customer</Text>

                  <View className='rounded-lg border border-[#dbe0e6] mb-3'>
                    <Picker
                      selectedValue={form.customerId}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          customerId: value,
                        })
                      }
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
                  </View>

                  <Text className='mb-2'>Amount</Text>

                  <TextInput
                    className='h-12 rounded-lg border border-[#dbe0e6] px-4 mb-3'
                    keyboardType='numeric'
                    value={form.amount}
                    onChangeText={(text) =>
                      setForm({
                        ...form,
                        amount: text,
                      })
                    }
                  />

                  <Text className='mb-2'>Narration</Text>

                  <TextInput
                    className='h-12 rounded-lg border border-[#dbe0e6] px-4 mb-4'
                    value={form.narration}
                    onChangeText={(text) =>
                      setForm({
                        ...form,
                        narration: text,
                      })
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

        <View className='mt-6 items-centerflex items-center bg-white dark:bg-gray-800/50 rounded-xl p-4 w-[85%] relative left-8 top-[2rem]'>
          <Link
            href={{
              pathname: "/Transaction/forms/showSales",
              params: { refresh: refreshList ? "1" : "0" },
            }}
          >
            <Text>Show Customer</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  </>
);
}


export default Sales