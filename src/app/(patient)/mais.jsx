import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Card, Icon, Screen, Button } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { c } from "../../theme";

const LINKS = [
  { to: "/alimentos", icon: "database", label: "Banco de Alimentos" },
  { to: "/nutricionistas", icon: "search", label: "Nutricionistas" },
  { to: "/agenda", icon: "calendar", label: "Minha Agenda" },
  { to: "/consultas", icon: "video", label: "Consultas" },
  { to: "/loja", icon: "shopping-cart", label: "Loja NutriLife" },
  { to: "/perfil", icon: "user", label: "Meu Perfil" },
];

// Equivalente ao restante da barra lateral do web
export default function Mais() {
  const router = useRouter();
  const { usuarioLogado, logout } = useApp();
  const sair = async () => { await logout(); router.replace("/"); };

  return (
    <Screen title="Menu" subtitle="Tudo o que você pode fazer no NutriLife">
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar nome={usuarioLogado?.nome} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: c.gray900 }}>{usuarioLogado?.nome}</Text>
          <Text style={{ color: c.gray500 }}>{usuarioLogado?.email}</Text>
        </View>
      </Card>
      <Card style={{ padding: 4 }}>
        {LINKS.map((l, i) => (
          <Pressable key={l.to} onPress={() => router.push(l.to)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.gray100 }}>
            <View style={{ backgroundColor: c.green50, padding: 8, borderRadius: 10 }}><Icon name={l.icon} size={18} color={c.green600} /></View>
            <Text style={{ flex: 1, fontSize: 16, color: c.gray900, fontWeight: "500" }}>{l.label}</Text>
            <Icon name="chevron-right" size={18} color={c.gray300} />
          </Pressable>
        ))}
      </Card>
      <Button title="Sair" icon="log-out" variant="outline" onPress={sair} />
    </Screen>
  );
}
