import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  NativeModules,
  Text,
  TextInput,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";

const { TaskerModule } = NativeModules;

export default function Index() {
  // const router = useRouter();
  // const nextpage = () => {
  //   router.push("/(user)");
  // };
  const db = useSQLiteContext();
  const router = useRouter();
   const [showTrialButton, setShowTrialButton] = useState(true);
  const checkTrialStatus = async () => {
    if (!db) return;

    try {
      const user = await db.getFirstAsync(`SELECT id FROM Login LIMIT 1`);

      setShowTrialButton(!user);
    } catch (error) {
      console.log(error);
    }
  };
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
      await AsyncStorage.setItem("isLoggedIn", "true");
      await AsyncStorage.setItem("mobileNumber", mobileNumber);

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

      expiryDateObj.setDate(expiryDateObj.getDate() + 30);

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

      setShowTrialButton(false);

      triggerTaskerSMS(mobileNumber, password, expiryDate);


      Alert.alert(
        "Success", "Free trial activated successfully.",
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

  const checkAutoLogin = async () => {
  const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
  const savedMobile = await AsyncStorage.getItem("mobileNumber");

const checkAutoLogin = async () => {
  const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
  const savedMobile = await AsyncStorage.getItem("mobileNumber");

  if (isLoggedIn === "true" && savedMobile) {
    const today = new Date().toISOString().split("T")[0];

    const user = await db.getFirstAsync<{ expiryDate: string }>(
      `SELECT expiryDate FROM Login WHERE mobilenumber = ?`,
      [savedMobile],
    );

    if (user && user.expiryDate >= today) {
      router.replace({
        pathname: "./login/login",
        params: {
          mobileNumber: savedMobile,
        },
      });
    } else {
      await AsyncStorage.removeItem("isLoggedIn");
      await AsyncStorage.removeItem("mobileNumber");

      Alert.alert(
        "Trial Expired",
        "Your trial has expired. Please buy the paid version.",
      );
    }
  }
};
};

  useEffect(() => {
  if (!db) return;

  checkTrialStatus();
  checkAutoLogin();
}, [db]);
  

  return (
    <SafeAreaView className='flex-1 bg-[#F7F7FF]'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20 }}
      >
        {/* Logo */}
        <View className='items-center mt-6'>
          <View className='w-44 h-44 rounded-full bg-[#EEF2FF] items-center justify-center shadow-xl'>
            <View className='w-40 h-40 rounded-full bg-white items-center justify-center border-4 border-white'>
              <Image
                source={require("./images/logos.png")}
                className='w-34 h-34 rounded-full'
               contentFit='cover'
              />
            </View>
          </View>

          <Text className='text-5xl font-bold text-gray-800 mt-6'>
            Welcome to
          </Text>

          <Text className='text-4xl font-extrabold text-[#4F46E5] mt-2'>
            LenDenKhata
          </Text>

          <View className='flex-row items-center mt-4'>
            <View className='h-[1] w-20 bg-gray-300' />
            <View className='w-3 h-3 rounded-full bg-[#4F46E5] mx-3' />
            <View className='h-[1] w-20 bg-gray-300' />
          </View>

          <Text className='text-xl text-gray-700 mt-5'>
            Simple. Smart. Secure.
          </Text>

          <Text className='text-center text-gray-500 mt-1 px-8'>
            Your ultimate lending & borrowing manager.
          </Text>
        </View>

        {/* Card */}
        <View className='bg-white rounded-3xl mt-8 p-5 shadow-lg'>
          {/* Mobile */}
          <View className='border border-gray-300 rounded-2xl flex-row items-center overflow-hidden'>
            <View className='flex-row items-center px-4 py-4 bg-gray-50'>
              <Ionicons name='call' size={22} color='#4F46E5' />

              <Text className='ml-3 text-lg font-semibold'>+91</Text>
            </View>

            <TextInput
              placeholder='Enter your mobile number'
              keyboardType='phone-pad'
              value={mobileNumber}
              onChangeText={setMobileNumber}
              className='flex-1 px-4 text-lg'
            />
          </View>

          {/* Login */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlecheck}
            className='mt-5 overflow-hidden rounded-2xl'
          >
            <LinearGradient
              colors={["#5B4BFF", "#4734E8"]}
              className='py-4 flex-row justify-center items-center'
            >
              <Feather name='log-in' size={22} color='white' />

              <Text className='text-white font-bold text-xl ml-3'>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Trial */}
          {showTrialButton && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlesubmit}
              className='bg-green-500 rounded-2xl py-4 mt-4 flex-row justify-center items-center'
            >
              <FontAwesome5 name='gift' size={20} color='white' />

              <Text className='text-white text-xl font-bold ml-3'>
                Get Free Trial
              </Text>
            </TouchableOpacity>
          )}

          {/* Paid */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlepaid}
            className='bg-blue-600 rounded-2xl py-4 mt-4 flex-row justify-center items-center'
          >
            <FontAwesome5 name='crown' size={20} color='white' />

            <Text className='text-white text-xl font-bold ml-3'>
              Get Paid Version
            </Text>
          </TouchableOpacity>

          {/* List */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={navigateToList}
            className='border border-gray-300 rounded-2xl py-4 mt-4 flex-row justify-center items-center'
          >
            <MaterialCommunityIcons
              name='format-list-bulleted'
              size={24}
              color='#4F46E5'
            />

            <Text className='text-[#4F46E5] text-xl font-bold ml-3'>
              List of Users
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className='flex-row items-center my-7'>
            <View className='flex-1 h-[1] bg-gray-300' />
            <Text className='mx-4 text-[#4F46E5] font-semibold'>
              Information
            </Text>
            <View className='flex-1 h-[1] bg-gray-300' />
          </View>

          {/* Card 1 */}
          <View className='bg-[#F7F7FF] rounded-2xl p-4 mb-4 flex-row'>
            <View className='w-16 h-16 rounded-full bg-purple-100 items-center justify-center'>
              <Feather name='log-in' size={24} color='#4F46E5' />
            </View>

            <View className='flex-1 ml-4'>
              <Text className='text-xl font-bold text-[#4F46E5]'>Login</Text>

              <Text className='text-gray-600 mt-1'>
                If Already Registered, Click Login Button Otherwise Activate
                Free Trial or Buy Paid Version.
              </Text>
            </View>
          </View>

          {/* Card 2 */}
          <View className='bg-[#F7F7FF] rounded-2xl p-4 mb-4 flex-row'>
            <View className='w-16 h-16 rounded-full bg-green-100 items-center justify-center'>
              <FontAwesome5 name='gift' size={22} color='green' />
            </View>

            <View className='flex-1 ml-4'>
              <Text className='text-xl font-bold text-green-700'>
                Free Trial
              </Text>

              <Text className='text-gray-600 mt-1'>
                Free Trial is valid for 1 Day. You can only activate one free
                trial per mobile number.
              </Text>
            </View>
          </View>

          {/* Card 3 */}
          <View className='bg-[#F7F7FF] rounded-2xl p-4 flex-row'>
            <View className='w-16 h-16 rounded-full bg-blue-100 items-center justify-center'>
              <FontAwesome5 name='crown' size={22} color='#2563EB' />
            </View>

            <View className='flex-1 ml-4'>
              <Text className='text-xl font-bold text-blue-700'>
                Paid Version
              </Text>

              <Text className='text-gray-600 mt-1'>
                Paid version offers full access to all features.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
