import { Image, ScrollView, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Button, Icon } from "../components/ui";
import { HOME, c } from "../theme";

const BENEFICIOS = [
  "Acompanhamento personalizado de calorias",
  "Planos alimentares criados por nutricionistas",
  "Gráficos de evolução de peso",
  "Banco completo de alimentos",
  "Agendamento de consultas online",
];

const FEATURES = [
  { icon: "heart", title: "Alimentação Balanceada", description: "Planos alimentares personalizados para seus objetivos" },
  { icon: "trending-up", title: "Acompanhamento Contínuo", description: "Monitore seu progresso com gráficos detalhados" },
  { icon: "users", title: "Suporte Profissional", description: "Nutricionistas qualificados ao seu lado" },
];

export default function Landing() {
  const router = useRouter();
  const { usuarioLogado } = useApp();
  if (usuarioLogado) return <Redirect href={HOME[usuarioLogado.tipo]} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: c.gray200 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: c.green600 }}>NutriLife</Text>
            <Text style={{ color: c.gray500, fontSize: 12 }}>Alimentação Saudável</Text>
          </View>
          <Text onPress={() => router.push({ pathname: "/login", params: { type: "admin" } })} style={{ color: c.gray500, fontWeight: "600", fontSize: 13 }}>Área Admin</Text>
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 34, fontWeight: "800", color: c.gray900, lineHeight: 40 }}>
            Transforme sua relação com a <Text style={{ color: c.green600 }}>alimentação</Text>
          </Text>
          <Text style={{ fontSize: 16, color: c.gray600, lineHeight: 24 }}>
            Acompanhe suas refeições, atinja suas metas e conquiste uma vida mais saudável com o apoio de nutricionistas especializados.
          </Text>
          <Button title="Começar Agora" onPress={() => router.push("/cadastro")} />
          <Button title="Já tenho conta" variant="outline" onPress={() => router.push("/login")} />
          <View style={{ gap: 10, marginTop: 4 }}>
            {BENEFICIOS.map(b => (
              <View key={b} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.green100, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={14} color={c.green600} />
                </View>
                <Text style={{ color: c.gray700, flex: 1 }}>{b}</Text>
              </View>
            ))}
          </View>
          <Image source={{ uri: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800" }} style={{ height: 220, borderRadius: 16, backgroundColor: c.gray100 }} />
        </View>

        <View style={{ backgroundColor: c.gray50, padding: 20, gap: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: c.gray900, textAlign: "center" }}>Por que escolher o NutriLife?</Text>
          <Text style={{ color: c.gray600, textAlign: "center" }}>Tudo que você precisa para uma alimentação equilibrada</Text>
          {FEATURES.map(f => (
            <View key={f.title} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 20, borderWidth: 1, borderColor: c.gray100 }}>
              <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: c.green100, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon name={f.icon} size={24} color={c.green600} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: c.gray900, marginBottom: 4 }}>{f.title}</Text>
              <Text style={{ color: c.gray600 }}>{f.description}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: c.green600, padding: 28, alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center" }}>Pronto para começar sua jornada?</Text>
          <Text style={{ color: c.green50, textAlign: "center" }}>Junte-se a milhares de pessoas que já transformaram suas vidas</Text>
          <Button title="Criar Conta Gratuita" variant="white" onPress={() => router.push("/cadastro")} />
        </View>

        <View style={{ backgroundColor: c.amber50, padding: 24, alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 26 }}>💚</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900, textAlign: "center" }}>Ajude o NutriLife a continuar gratuito</Text>
          <Text style={{ color: c.gray600, textAlign: "center" }}>
            O NutriLife é gratuito para todos. Se ele te ajudou de alguma forma, considere fazer uma doação via PIX — qualquer valor faz diferença.
          </Text>
          <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: c.amber200, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 }}>
            <Text style={{ fontSize: 11, color: c.gray400, fontWeight: "600", textTransform: "uppercase" }}>Chave PIX</Text>
            <Text selectable style={{ fontSize: 20, fontWeight: "800", color: c.gray900 }}>11974702387</Text>
          </View>
        </View>

        <View style={{ backgroundColor: c.gray900, padding: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>NutriLife</Text>
          <Text style={{ color: c.gray400, fontSize: 12, marginTop: 4 }}>© 2026 NutriLife. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
