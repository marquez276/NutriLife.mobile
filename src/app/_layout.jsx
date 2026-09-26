import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../context/AppContext";
import { ToastHost } from "../toast";
import { c } from "../theme";

function Gate() {
  const { pronto } = useApp();
  if (!pronto) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.green50 }}>
        <ActivityIndicator size="large" color={c.green600} />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.gray50 } }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate />
      </AppProvider>
      <ToastHost />
    </SafeAreaProvider>
  );
}
