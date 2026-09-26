import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen, Card, CardTitle, Button, Input, Sheet, Progress, Icon, Empty, Row } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { apiFetch, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { horaAgora, maskHora } from "../../utils";
import { c } from "../../theme";

const VAZIO = { name: "", quantity: "", calories: "", proteina: "", carboidrato: "", gordura: "", time: "" };

export default function Calorias() {
  const { usuarioLogado, refeicoes, adicionarRefeicao, removerRefeicao, metas } = useApp();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [custom, setCustom] = useState(VAZIO);
  const [alimentos, setAlimentos] = useState([]);

  useEffect(() => {
    apiFetch("/admin/alimentos")
      .then(r => (r.ok ? r.json() : []))
      .then(data => setAlimentos(Array.isArray(data) ? data.filter(f => f.ativo !== false) : []))
      .catch(() => setAlimentos([]));
  }, []);

  const meta = metas?.metaCalorias || 2000;
  const consumidas = refeicoes.reduce((sum, i) => sum + Number(i.calories), 0);
  const restantes = meta - consumidas;
  const pct = Math.min(100, (consumidas / meta) * 100);

  const adicionar = (food) => {
    adicionarRefeicao({ meal: food.nome, items: `${food.calorias} kcal`, calories: food.calorias, time: horaAgora() });
    toast.success(`${food.nome} adicionado!`);
  };

  const adicionarCustom = async () => {
    if (!custom.name || !custom.quantity || !custom.calories || !custom.time) { toast.error("Preencha todos os campos obrigatórios."); return; }
    try {
      await apiFetch("/alimentos/customizado", {
        method: "POST", headers: JSON_HEADERS,
        body: JSON.stringify({
          nome: custom.name,
          calorias: parseFloat(custom.calories) || 0,
          proteina: parseFloat(custom.proteina) || 0,
          carboidrato: parseFloat(custom.carboidrato) || 0,
          gordura: parseFloat(custom.gordura) || 0,
          clienteId: usuarioLogado?.id,
        }),
      });
    } catch {}
    adicionarRefeicao({ meal: custom.name, items: custom.quantity, calories: parseFloat(custom.calories), time: custom.time });
    setCustom(VAZIO);
    setAberto(false);
    toast.success("Alimento adicionado!");
  };

  const filtrados = alimentos.filter(f => f.nome?.toLowerCase().includes(busca.toLowerCase()));
  const setC = (campo) => (v) => setCustom(p => ({ ...p, [campo]: v }));

  return (
    <Screen title="Controle de Calorias" subtitle="Registre os alimentos consumidos durante o dia">
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: c.gray500 }}>Consumidas</Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: c.gray900 }}>{consumidas}</Text>
            <Text style={{ fontSize: 12, color: c.gray500 }}>kcal</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: c.gray500 }}>Meta Diária</Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: c.green600 }}>{meta}</Text>
            <Text style={{ fontSize: 12, color: c.gray500 }}>kcal</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: c.gray500 }}>Restantes</Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: restantes < 0 ? c.red600 : c.blue600 }}>{restantes}</Text>
            <Text style={{ fontSize: 12, color: c.gray500 }}>kcal</Text>
          </View>
        </View>
        <Progress value={pct} />
        <Text style={{ textAlign: "center", color: c.gray500, fontSize: 13 }}>{pct.toFixed(0)}% da meta diária alcançada</Text>
      </Card>

      <Card>
        <CardTitle>Alimentos Consumidos Hoje</CardTitle>
        {refeicoes.length === 0 ? (
          <Empty text="Nenhum alimento registrado ainda." />
        ) : (
          <View style={{ gap: 10 }}>
            {refeicoes.map(item => (
              <View key={item.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.gray50, borderRadius: 10, padding: 12, gap: 10 }}>
                <Text style={{ fontSize: 12, color: c.gray500, backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" }}>{item.time}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: c.gray900 }}>{item.meal}</Text>
                  <Text style={{ fontSize: 13, color: c.gray500 }}>{item.items}</Text>
                </View>
                <Text style={{ fontWeight: "800", color: c.gray900 }}>{item.calories}<Text style={{ fontWeight: "400", fontSize: 12, color: c.gray500 }}> kcal</Text></Text>
                <Pressable onPress={() => { removerRefeicao(item.id); toast.success("Removido."); }} hitSlop={8}><Icon name="trash-2" size={18} color={c.red500} /></Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <CardTitle>Buscar Alimento</CardTitle>
        <Input placeholder="Buscar alimento..." value={busca} onChangeText={setBusca} />
        <Button title="Adicionar Personalizado" icon="plus" onPress={() => { setCustom({ ...VAZIO, time: horaAgora() }); setAberto(true); }} />
        <Text style={{ fontWeight: "700", color: c.gray700, fontSize: 13 }}>Alimentos Comuns</Text>
        {filtrados.length === 0 && <Text style={{ fontSize: 12, color: c.gray400, textAlign: "center", paddingVertical: 12 }}>Nenhum alimento encontrado.</Text>}
        {filtrados.map(food => (
          <Pressable key={food.id} onPress={() => adicionar(food)} style={({ pressed }) => ({ backgroundColor: pressed ? c.gray100 : c.gray50, borderRadius: 10, padding: 12 })}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: c.gray900, fontSize: 14 }}>{food.nome}</Text>
                <Text style={{ fontSize: 12, color: c.gray500 }}>P: {food.proteina}g · C: {food.carboidrato}g · G: {food.gordura}g</Text>
              </View>
              <Text style={{ fontWeight: "800", color: c.gray900 }}>{food.calorias} kcal</Text>
            </Row>
          </Pressable>
        ))}
      </Card>

      <Sheet
        visible={aberto} onClose={() => setAberto(false)} title="Adicionar Alimento Personalizado"
        footer={<><Button title="Cancelar" variant="outline" style={{ flex: 1 }} onPress={() => setAberto(false)} /><Button title="Adicionar" style={{ flex: 1 }} onPress={adicionarCustom} /></>}
      >
        <Input label="Nome *" placeholder="Ex: Iogurte" value={custom.name} onChangeText={setC("name")} />
        <Input label="Quantidade *" placeholder="Ex: 1 pote" value={custom.quantity} onChangeText={setC("quantity")} />
        <Input label="Calorias *" placeholder="Ex: 100" keyboardType="decimal-pad" value={custom.calories} onChangeText={setC("calories")} />
        <Input label="Hora *" placeholder="HH:MM" keyboardType="number-pad" value={custom.time} onChangeText={v => setC("time")(maskHora(v))} />
        <Input label="Proteína (g)" placeholder="Ex: 10" keyboardType="decimal-pad" value={custom.proteina} onChangeText={setC("proteina")} />
        <Input label="Carboidrato (g)" placeholder="Ex: 20" keyboardType="decimal-pad" value={custom.carboidrato} onChangeText={setC("carboidrato")} />
        <Input label="Gordura (g)" placeholder="Ex: 5" keyboardType="decimal-pad" value={custom.gordura} onChangeText={setC("gordura")} />
      </Sheet>
    </Screen>
  );
}
