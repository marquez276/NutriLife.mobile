import Constants from "expo-constants";
import { Platform } from "react-native";

// A mesma API do web (Spring Boot, porta 8080). Ordem de resolução:
// 1. EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:8080 ou a URL de produção)
// 2. mesmo IP do computador que serve o app no Expo (celular físico na mesma rede Wi-Fi)
// 3. emulador (Android usa 10.0.2.2 para chegar no localhost do PC)
const PORTA_API = 8080;

function resolverApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  const hostUri = Constants.expoConfig?.hostUri; // "192.168.15.3:8081"
  if (hostUri) return `http://${hostUri.split(":")[0]}:${PORTA_API}`;
  return `http://${Platform.OS === "android" ? "10.0.2.2" : "localhost"}:${PORTA_API}`;
}

export const API_URL = resolverApiUrl();
