import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen, Card, Input, Badge, Icon, Empty } from "../../components/ui";
import { apiFetch } from "../../api";
import { c } from "../../theme";

const CATEGORIA_TOM = { Frutas: "orange", Proteínas: "red", Carboidratos: "amber", Vegetais: "green", Laticínios: "blue", Leguminosas: "purple" };

export default function Alimentos() {
  const [busca, setBusca] = useState("");
  const [base, setBase] = useState([]);

  const carregar = () =>
    apiFetch("/admin/alimentos")
      .then(r => (r.ok ? r.json() : []))
      .then(data => setBase(Array.isArray(data) ? data.filter(f => f.ativo !== false) : []))
      .catch(() => setBase([]));

  useEffect(() => { carregar(); }, []);

  const filtrados = base.filter(f => f.nome?.toLowerCase().includes(busca.toLowerCase()) || f.categoria?.toLowerCase().includes(busca.toLowerCase()));
  const categorias = Array.from(new Set(base.map(f => f.categoria).filter(Boolean)));

  return (
    <Screen title="Banco de Alimentos" subtitle="Consulte informações nutricionais de diversos alimentos" back="/mais" onRefresh={carregar}>
      <Card style={{ gap: 12 }}>
        <Input placeholder="Buscar por alimento ou categoria..." value={busca} onChangeText={setBusca} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {categorias.map(cat => (
            <Pressable key={cat} onPress={() => setBusca(cat)}><Badge text={cat} tone={CATEGORIA_TOM[cat] || "gray"} /></Pressable>
          ))}
        </View>
      </Card>

      {filtrados.length === 0 ? (
        <Card><Empty text="Nenhum alimento encontrado" /></Card>
      ) : (
        filtrados.map(food => (
          <Card key={food.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: c.gray900 }}>{food.nome}</Text>
                <Badge text={food.categoria || "Geral"} tone={CATEGORIA_TOM[food.categoria] || "gray"} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: c.gray900 }}>{food.calorias}</Text>
                <Text style={{ fontSize: 12, color: c.gray500 }}>kcal</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[["Proteínas", food.proteina, c.red50], ["Carboidratos", food.carboidrato, c.amber50], ["Gorduras", food.gordura, c.blue50]].map(([nome, v, bg]) => (
                <View key={nome} style={{ flex: 1, backgroundColor: bg, borderRadius: 10, padding: 10 }}>
                  <Text style={{ fontSize: 11, color: c.gray600 }}>{nome}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: c.gray900 }}>{v}g</Text>
                </View>
              ))}
            </View>
          </Card>
        ))
      )}

      <Card style={{ backgroundColor: c.blue50, borderWidth: 1, borderColor: c.blue100, flexDirection: "row", gap: 12 }}>
        <View style={{ backgroundColor: c.blue100, padding: 10, borderRadius: 10, alignSelf: "flex-start" }}><Icon name="info" size={22} color={c.blue600} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", color: c.gray900, marginBottom: 4 }}>Informação Nutricional</Text>
          <Text style={{ fontSize: 13, color: c.gray700 }}>
            Os valores nutricionais apresentados são aproximados e podem variar de acordo com a forma de preparo e origem do alimento. Consulte sempre seu nutricionista para orientações personalizadas.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
