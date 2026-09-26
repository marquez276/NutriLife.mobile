import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { c } from "./theme";

// Mesma API do "sonner" usado no web: toast.success("..."), toast.error("..."), toast.info("...")
let mostrar = () => {};
const emitir = (tipo) => (msg) => mostrar({ tipo, msg, id: Date.now() });
export const toast = { success: emitir("success"), error: emitir("error"), info: emitir("info") };

const CORES = { success: c.green600, error: c.red600, info: c.gray900 };

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState(null);
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer;
    mostrar = (novo) => {
      clearTimeout(timer);
      setItem(novo);
      Animated.timing(opacidade, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer = setTimeout(() => {
        Animated.timing(opacidade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setItem(null));
      }, 2800);
    };
    return () => { clearTimeout(timer); mostrar = () => {}; };
  }, [opacidade]);

  if (!item) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, top: insets.top + 8, opacity: opacidade, zIndex: 999 }}>
      <View style={{ backgroundColor: CORES[item.tipo], borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>{item.msg}</Text>
      </View>
    </Animated.View>
  );
}
