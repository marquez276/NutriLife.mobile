import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen, Card, CardTitle, Button, Input, Icon, Empty, Grid2, Row } from "../../components/ui";
import { LineChart } from "../../components/Charts";
import { useApp } from "../../context/AppContext";
import { toast } from "../../toast";
import { dataParaIso, hojeIso, isoParaDisplay, maskData } from "../../utils";
import { c } from "../../theme";

export default function Evolucao() {
  const { pesagens, adicionarPesagem, removerPesagem, anamnese, metas } = useApp();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoPeso, setNovoPeso] = useState("");
  const [novaData, setNovaData] = useState(isoParaDisplay(hojeIso()));

  // pesoInicial: prefere o valor persistido no backend (metas); cai para a anamnese
  const pesoInicial = metas?.pesoInicial ? parseFloat(metas.pesoInicial) : (anamnese?.peso ? parseFloat(anamnese.peso) : null);
  const pesoAtual = pesagens.length > 0 ? parseFloat(pesagens[pesagens.length - 1].peso) : pesoInicial;
  const meta = metas?.pesoIdeal ? parseFloat(metas.pesoIdeal) : (pesoInicial ? parseFloat((pesoInicial - 5).toFixed(1)) : null);
  const perdido = pesoInicial != null && pesoAtual != null ? parseFloat((pesoInicial - pesoAtual).toFixed(1)) : 0;
  const faltam = meta != null && pesoAtual != null ? parseFloat((pesoAtual - meta).toFixed(1)) : null;

  const dados = pesagens.map(p => ({ label: isoParaDisplay(p.data).slice(0, 5), value: parseFloat(p.peso) }));

  const salvar = () => {
    if (!novoPeso) { toast.error("Informe o peso."); return; }
    const iso = dataParaIso(novaData);
    if (!iso) { toast.error("Data inválida. Use DD/MM/AAAA."); return; }
    adicionarPesagem({ peso: parseFloat(novoPeso), data: iso });
    toast.success("Pesagem registrada!");
    setNovoPeso("");
    setMostrarForm(false);
  };

  const remover = async (id) => { await removerPesagem(id); toast.success("Pesagem removida."); };

  return (
    <Screen title="Evolução de Peso" subtitle="Acompanhe seu progresso ao longo do tempo">
      <Button title="Registrar Peso" icon="plus" onPress={() => setMostrarForm(!mostrarForm)} />

      {mostrarForm && (
        <Card style={{ gap: 12 }}>
          <CardTitle>Registrar Nova Pesagem</CardTitle>
          <Input label="Peso (kg)" placeholder="73.5" keyboardType="decimal-pad" value={novoPeso} onChangeText={v => setNovoPeso(v.replace(",", "."))} />
          <Input label="Data (DD/MM/AAAA)" placeholder="DD/MM/AAAA" keyboardType="number-pad" value={novaData} onChangeText={v => setNovaData(maskData(v))} />
          <Row>
            <Button title="Salvar" onPress={salvar} style={{ flex: 1 }} />
            <Button title="Cancelar" variant="outline" onPress={() => setMostrarForm(false)} style={{ flex: 1 }} />
          </Row>
        </Card>
      )}

      <Grid2>
        <Card style={{ flex: 1, minWidth: "45%" }}>
          <Text style={{ fontSize: 12, color: c.gray500 }}>Peso Atual</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: c.gray900 }}>{pesoAtual ?? "—"}</Text>
          <Text style={{ fontSize: 12, color: c.gray500 }}>kg</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: "45%" }}>
          <Text style={{ fontSize: 12, color: c.gray500 }}>Peso Inicial</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: c.gray900 }}>{pesoInicial ?? "—"}</Text>
          <Text style={{ fontSize: 12, color: c.gray500 }}>kg</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: "45%" }}>
          <Text style={{ fontSize: 12, color: c.gray500 }}>Peso Perdido</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: c.green600 }}>{perdido > 0 ? `-${perdido}` : perdido < 0 ? `+${Math.abs(perdido)}` : "0"}</Text>
          <Text style={{ fontSize: 12, color: c.gray500 }}>kg</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: "45%" }}>
          <Text style={{ fontSize: 12, color: c.gray500 }}>Meta (Peso Ideal)</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: c.gray900 }}>{meta ?? "—"}</Text>
          <Text style={{ fontSize: 12, color: c.gray500 }}>{faltam != null && faltam > 0 ? `ainda ${faltam} kg` : faltam != null ? "✓ Meta atingida" : "kg"}</Text>
        </Card>
      </Grid2>

      <Card>
        <CardTitle>Gráfico de Progresso</CardTitle>
        {dados.length === 0 ? <Empty text="Nenhuma pesagem registrada ainda." /> : <LineChart data={dados} area goal={meta} height={260} unit="kg" />}
      </Card>

      <Card>
        <CardTitle>Histórico de Pesagens</CardTitle>
        {pesagens.length === 0 ? (
          <Empty text="Nenhuma pesagem registrada." />
        ) : (
          <View style={{ gap: 10 }}>
            {[...pesagens].reverse().map((p, i) => {
              const idx = pesagens.length - 1 - i;
              const anterior = idx > 0 ? pesagens[idx - 1] : null;
              const diff = anterior ? (parseFloat(p.peso) - parseFloat(anterior.peso)).toFixed(1) : null;
              return (
                <View key={p.id ?? i} style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.gray50, borderRadius: 10, padding: 12, gap: 12 }}>
                  <View style={{ backgroundColor: c.green100, padding: 8, borderRadius: 8 }}><Icon name="calendar" size={18} color={c.green600} /></View>
                  <Text style={{ flex: 1, fontWeight: "600", color: c.gray900 }}>{isoParaDisplay(p.data)}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: c.gray900 }}>{p.peso} kg</Text>
                    {diff !== null && <Text style={{ fontSize: 12, fontWeight: "600", color: parseFloat(diff) < 0 ? c.green600 : c.red600 }}>{parseFloat(diff) > 0 ? "+" : ""}{diff} kg</Text>}
                  </View>
                  <Pressable onPress={() => remover(p.id)} hitSlop={8}><Icon name="trash-2" size={18} color={c.gray400} /></Pressable>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </Screen>
  );
}
