import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { HOME, c } from "../theme";

// Barra de abas de cada perfil (paciente / nutricionista / admin) com guarda de acesso.
// tabs: [{ name, title, icon }] visíveis; hidden: rotas do perfil que ficam fora da barra.
export function RoleTabs({ tipo, tabs, hidden = [] }) {
  const { usuarioLogado } = useApp();
  const insets = useSafeAreaInsets();
  if (!usuarioLogado) return <Redirect href="/login" />;
  if (usuarioLogado.tipo !== tipo) return <Redirect href={HOME[usuarioLogado.tipo]} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.green600,
        tabBarInactiveTintColor: c.gray400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { height: 58 + insets.bottom, paddingBottom: 6 + insets.bottom, paddingTop: 6, borderTopColor: c.gray200 },
      }}
    >
      {tabs.map(t => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Feather name={t.icon} size={22} color={color} /> }} />
      ))}
      {hidden.map(name => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
    </Tabs>
  );
}
