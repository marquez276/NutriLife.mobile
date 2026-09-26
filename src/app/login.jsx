import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, Card, Button, Input, Segmented, Icon } from "../components/ui";
import { useApp } from "../context/AppContext";
import { toast } from "../toast";
import { consumirPrefill } from "../prefill";
import { HOME, c } from "../theme";

const ABAS = [
  { value: "patient", label: "Paciente" },
  { value: "nutritionist", label: "Nutricionista" },
  { value: "admin", label: "Admin" },
];

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useApp();
  // Logo após o cadastro, e-mail e senha chegam preenchidos (só na primeira vez)
  const [inicial] = useState(() => consumirPrefill());
  const [userType, setUserType] = useState(inicial?.tipo || (ABAS.some(a => a.value === params.type) ? params.type : "patient"));
  const [email, setEmail] = useState(inicial?.email || "");
  const [password, setPassword] = useState(inicial?.senha || "");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast.error("Informe e-mail e senha."); return; }
    setCarregando(true);
    const resultado = await login(email.trim(), password, userType);
    setCarregando(false);
    if (!resultado.ok) { toast.error(resultado.erro); return; }
    toast.success("Bem-vindo!");
    router.replace(userType === "patient" && !resultado.hasAnamnese ? "/anamnese" : HOME[userType]);
  };

  // Ao trocar de aba, limpa os campos
  const trocarAba = (v) => { setUserType(v); setEmail(""); setPassword(""); };

  return (
    <Screen bg={c.green50}>
      <View style={{ alignItems: "center", marginTop: 24, marginBottom: 8 }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: c.green600 }}>NutriLife</Text>
        <Text style={{ color: c.gray600, marginTop: 4 }}>Acesse sua conta para continuar sua jornada</Text>
      </View>

      <Card style={{ gap: 16, padding: 20 }}>
        <Text style={{ textAlign: "center", fontSize: 22, fontWeight: "800", color: c.gray900 }}>Entrar na Plataforma</Text>
        {userType === "admin" && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <Icon name="shield" size={14} color={c.amber600} />
            <Text style={{ color: c.amber600, fontWeight: "600", fontSize: 13 }}>Restrito a funcionários autorizados</Text>
          </View>
        )}
        <Segmented options={ABAS} value={userType} onChange={trocarAba} />
        <Input
          label={userType === "admin" ? "E-mail Corporativo" : "E-mail"}
          placeholder={userType === "admin" ? "admin@nutrilife.com" : "seu@email.com"}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCorrect={false}
        />
        <Input label="Senha" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={handleLogin} />
        <Button
          title={userType === "patient" ? "Entrar como Paciente" : userType === "nutritionist" ? "Entrar como Nutricionista" : "Validar Acesso Admin"}
          variant={userType === "admin" ? "dark" : "primary"} onPress={handleLogin} loading={carregando}
        />
        <Text style={{ textAlign: "center", color: c.gray500 }}>
          Ainda não tem conta? <Text onPress={() => router.push("/cadastro")} style={{ color: c.green600, fontWeight: "700" }}>Cadastre-se aqui</Text>
        </Text>
      </Card>

      <Text onPress={() => router.replace("/")} style={{ textAlign: "center", color: c.gray500, marginTop: 8 }}>← Voltar para a página inicial</Text>
    </Screen>
  );
}
