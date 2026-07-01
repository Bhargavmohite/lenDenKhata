import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { NativeModules } from "react-native";

const { TaskerModule } = NativeModules;

export default function Index() {
  // const router = useRouter();
  // const nextpage = () => {
  //   router.push("/(user)");
  // };
  const db = useSQLiteContext();
  const router = useRouter();

  const [mobileNumber, setMobileNumber] = useState("");
  const navigatetologin = () => {
    router.push({
      pathname: "./login/login",
      params: {
        mobileNumber: mobileNumber,
      },
    });
  };


  const triggerTaskerSMS = async (
  mobile: string,
  password: string,
  expiryDate: string,
) => {
  try {
    const result = await TaskerModule.sendBroadcast(
    "com.anonymous.SEND_SMS",
      mobile,
      `Welcome to LendenKhata
      
      Your Mobile Number is: ${mobile}
      Your Password is: ${password}

     Your Trial is  Expiry on Date: ${expiryDate}
      `, // You can customize your message
    );

    console.log("broadcast result:", result);
  } catch (e) {
    console.log("Tasker Error:", e);
  }
};

  const handlecheck = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const user = await db.getFirstAsync<{ expiryDate: string }>(
        `SELECT * FROM Login WHERE mobilenumber = ?`,
        [mobileNumber],
      );

      if (!user) {
        Alert.alert(
          "Not Found",
          "You can activate free trial or buy paid version",
        );
        return;
      }

      // Trial expired
      if (user.expiryDate < today) {
        Alert.alert(
          "Trial Expired",
          "Your trial has expired. Please buy a subscription.",
        );
        return;
      }

      // Trial active
      Alert.alert("Success", "Login Successful");
      navigatetologin();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handlesubmit = async () => {
    try {
      if (!mobileNumber.trim()) {
        Alert.alert("Error", "Please enter mobile number");
        return;
      }

      const password = "1234";

      const today = new Date().toISOString().split("T")[0];

      const expiryDateObj = new Date();

      expiryDateObj.setDate(expiryDateObj.getDate() + 1);

      const expiryDate = expiryDateObj.toISOString().split("T")[0];

      const existingUser = await db.getFirstAsync(
        `SELECT * FROM Login WHERE mobilenumber = ?`,
        [mobileNumber],
      );

      if (existingUser) {
        Alert.alert(
          "Already Registered",
          "This mobile number has already used the free trial.",
        );
        return;
      }

      await db.runAsync(
        `INSERT INTO Login
        (mobilenumber, password, createdDate, expiryDate)
        VALUES (?, ?, ?, ?)`,
        [mobileNumber, password, today, expiryDate],
      );

      triggerTaskerSMS(mobileNumber, password, expiryDate);

      Alert.alert(
        "Success",
        "Free Trial Activated Successfully your mobile number is " +
          mobileNumber +
          " and password is " +
          password +
          " and expiry date is " +
          expiryDate,
      );

      // triggerTaskerSMS(mobileNumber, password, expiryDate);

      setMobileNumber("");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to activate free trial");
    }
  };

  const handlepaid = async () => {
    Alert.alert("Alert", "Paid Version button pressed");
  };

  const navigateToList = () => {
    router.push("./login/list");
  };

  return (
    <View className='flex-1 items-center justify-center px-4'>
      <Text className='font-bold text-lg'>This is Demo Page</Text>

      <TextInput
        placeholder='Enter your mobile number'
        className='border border-gray-300 rounded-md px-4 py-2 mt-4 w-64'
        keyboardType='phone-pad'
        value={mobileNumber}
        onChangeText={setMobileNumber}
      />

      <View className='mt-4'>
        <Button title='Login' onPress={handlecheck} />
        <Text className='mt-4 text-sm text-gray-500 text-center'>
          "If Already Registered, Click Login Button Otherwise Activate Free
          Trial or Buy Paid Version"
        </Text>
      </View>

      <View className='mt-4'>
        <Button title='Get Free Trial' onPress={handlesubmit} />
        <Text className='mt-4 text-sm text-gray-500 text-center'>
          "Free Trial is valid for 1 Day. You can only activate one free trial
          per mobile number."
        </Text>
      </View>

      <View className='mt-4'>
        <Button title='Get Paid Version' onPress={handlepaid} />
        <Text className='mt-4 text-sm text-gray-500 text-center'>
          "Paid version offers full access to all features."
        </Text>
      </View>
      <View className='mt-4'>
        <Button title='List of Users' onPress={() => navigateToList()} />
      </View>
    </View>
  );
}
