import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Screen, Card, CardTitle, Button, Input, Sheet, Progress, StatCard, Badge, Icon, Empty, Grid2, Row } from "../../components/ui";
import { LineChart } from "../../components/Charts";
import { useApp } from "../../context/AppContext";
import { toast } from "../../toast";
import { horaAgora, maskHora } from "../../utils";
import { c } from "../../theme";

const STATUS = {
  "Abaixo do peso": { tom: "blue", cor: c.blue100, desc: "Sua meta deve focar em ganho de massa." },
  "Peso Ideal": { tom: "green", cor: c.green100, desc: "Excelente! Mantenha seus hábitos saudáveis." },
  "Sobrepeso": { tom: "amber", cor: c.amber100, desc: "Procure manter um déficit calórico leve." },
  "Obesidade": { tom: "red", cor: c.red100, desc: "Priorize sua saúde com acompanhamento profissional." },
};

const FORM_VAZIO = { time: "", meal: "", items: "", calories: "" };

export default function Dashboard() {
  const router = useRouter();
  const { anamnese, anamneseCarregada, refeicoes, adicionarRefeicao, editarRefeicao, removerRefeicao, pesagens, usuarioLogado, metas, recarregarDadosPaciente } = useApp();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  // Paciente sem ficha vai para a anamnese (só depois de a busca terminar)
  const semFicha = anamneseCarregada && !anamnese;
  useEffect(() => { if (semFicha) toast.info("Por favor, preencha sua ficha de anamnese."); }, [semFicha]);
  if (semFicha) return <Redirect href="/anamnese" />;

  const meta = metas?.metaCalorias || 2000;
  const consumidas = refeicoes.reduce((sum, m) => sum + Number(m.calories), 0);
  const restantes = Math.max(0, meta - consumidas);
  const pct = Math.min(100, (consumidas / meta) * 100);

  const pesoAtual = pesagens.length > 0 ? pesagens[pesagens.length - 1].peso : (anamnese?.peso || "—");
  const pesoInicial = anamnese?.peso || null;
  const perda = pesoInicial && pesagens.length > 0 ? (parseFloat(pesoInicial) - parseFloat(pesoAtual)).toFixed(1) : null;
  const dadosGrafico = pesagens.slice(-8).map(p => ({ label: String(p.data).slice(5, 10).split("-").reverse().join("/"), value: parseFloat(p.peso) }));

  const calcularStatus = () => {
    if (metas?.statusPeso) return STATUS[metas.statusPeso] ? { label: metas.statusPeso, ...STATUS[metas.statusPeso] } : { label: metas.statusPeso, tom: "gray", desc: "" };
    if (!anamnese) return { label: "Carregando...", tom: "gray", desc: "" };
    const h = parseFloat(anamnese.altura) / 100;
    const imc = parseFloat(anamnese.peso) / (h * h);
    const nome = imc < 18.5 ? "Abaixo do peso" : imc < 25 ? "Peso Ideal" : imc < 30 ? "Sobrepeso" : "Obesidade";
    return { label: nome, ...STATUS[nome] };
  };
  const status = calcularStatus();

  const abrir = (meal) => {
    setEditando(meal);
    setForm(meal ? { time: meal.time, meal: meal.meal, items: meal.items, calories: String(meal.calories) } : { ...FORM_VAZIO, time: horaAgora() });
    setAberto(true);
  };

  const salvar = () => {
    if (!form.meal || !form.time) { toast.error("Preencha o nome e o horário."); return; }
    const dados = { ...form, calories: Number(form.calories) || 0 };
    if (editando) { editarRefeicao(editando.id, dados); toast.success("Refeição atualizada!"); }
    else { adicionarRefeicao(dados); toast.success("Refeição registrada!"); }
    setAberto(false);
  };

  return (
    <Screen
      title={`Olá, ${usuarioLogado?.nome?.split(" ")[0] || "bem-vindo"}!`}
      subtitle="Acompanhe sua evolução diária."
      onRefresh={() => recarregarDadosPaciente(usuarioLogado.id)}
    >
      <View style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
        <View style={{ flex: 1, backgroundColor: status.cor || c.gray100, borderRadius: 14, padding: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", opacity: 0.7 }}>Status Atual</Text>
          <Text style={{ fontWeight: "800", fontSize: 15, color: c.gray900 }}>{status.label}</Text>
        </View>
        <Button title="Encontrar Nutri" onPress={() => router.push("/nutricionistas")} style={{ flex: 1 }} />
      </View>

      {status.desc ? (
        <View style={{ backgroundColor: status.cor, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Icon name="target" size={20} color={c.gray900} />
          <Text style={{ flex: 1, fontSize: 13 }}><Text style={{ fontWeight: "800" }}>Nota de Saúde: </Text>{status.desc}</Text>
        </View>
      ) : null}

      <Grid2>
        <StatCard icon="zap" label="Calorias Consumidas" value={consumidas} subtext={`de ${meta} kcal`} color="orange" />
        <StatCard icon="target" label="Meta Diária" value={meta} subtext={`kcal${metas?.pesoIdeal ? ` · ideal: ${metas.pesoIdeal}kg` : ""}`} color="green" />
        <StatCard icon="trending-down" label="Peso Atual" value={`${pesoAtual} kg`} subtext={perda ? `-${perda}kg total` : "Registre pesagens"} color="blue" />
        <StatCard icon="coffee" label="Refeições Hoje" value={`${refeicoes.length}/5`} subtext={refeicoes.length >= 5 ? "Meta atingida" : `${5 - refeicoes.length} pendentes`} color="purple" />
      </Grid2>

      <Card>
        <CardTitle>Evolução de Peso</CardTitle>
        {dadosGrafico.length === 0 ? (
          <Empty text="Nenhuma pesagem registrada ainda. Vá em Evolução para registrar." />
        ) : (
          <LineChart data={dadosGrafico} unit="kg" />
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <CardTitle>Meta de Calorias</CardTitle>
        <View style={{ alignItems: "center", backgroundColor: c.gray50, borderRadius: 16, paddingVertical: 20 }}>
          <Text style={{ fontSize: 44, fontWeight: "800", color: c.gray900 }}>{restantes}</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: c.gray500, textTransform: "uppercase" }}>calorias restantes</Text>
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: c.gray600, fontWeight: "500" }}>Progresso</Text>
            <Text style={{ color: c.green600, fontWeight: "600" }}>{pct.toFixed(0)}%</Text>
          </View>
          <Progress value={pct} />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: c.orange50, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: c.orange600, textTransform: "uppercase" }}>Consumidas</Text>
            <Text style={{ fontSize: 17, fontWeight: "800" }}>{consumidas} kcal</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.green50, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: c.green600, textTransform: "uppercase" }}>Meta</Text>
            <Text style={{ fontSize: 17, fontWeight: "800" }}>{meta} kcal</Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900 }}>Registro de Refeições</Text>
        <Button title="Adicionar" icon="plus" small onPress={() => abrir(null)} />
      </View>

      {refeicoes.length === 0 ? (
        <Card style={{ borderWidth: 2, borderStyle: "dashed", borderColor: c.gray200, backgroundColor: c.gray50 }}>
          <Empty text='Nenhuma refeição registrada hoje. Toque em "Adicionar" para começar.' />
        </Card>
      ) : (
        refeicoes.map(meal => (
          <Card key={meal.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.green100, alignItems: "center", justifyContent: "center" }}>
              <Icon name="clock" size={24} color={c.green600} />
            </View>
            <View style={{ flex: 1 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "700", color: c.gray900, flex: 1 }} numberOfLines={1}>{meal.meal}</Text>
                <Text style={{ color: c.green600, fontWeight: "700" }}>{meal.calories} kcal</Text>
              </Row>
              <Text style={{ color: c.gray500, fontSize: 13 }}>{meal.time}</Text>
              <Text style={{ color: c.gray600, fontSize: 13 }} numberOfLines={1}>{meal.items}</Text>
            </View>
            <Pressable onPress={() => abrir(meal)} hitSlop={8}><Icon name="edit-2" size={18} color={c.gray400} /></Pressable>
            <Pressable onPress={() => { removerRefeicao(meal.id); toast.success("Refeição removida."); }} hitSlop={8}><Icon name="trash-2" size={18} color={c.gray400} /></Pressable>
          </Card>
        ))
      )}

      <Sheet
        visible={aberto} onClose={() => setAberto(false)} title={editando ? "Editar Refeição" : "Registrar Refeição"}
        footer={<><Button title="Cancelar" variant="outline" style={{ flex: 1 }} onPress={() => setAberto(false)} /><Button title="Salvar" style={{ flex: 1 }} onPress={salvar} /></>}
      >
        <Input label="Refeição" placeholder="Ex: Almoço" value={form.meal} onChangeText={v => setForm(p => ({ ...p, meal: v }))} />
        <Input label="Horário" placeholder="HH:MM" keyboardType="number-pad" value={form.time} onChangeText={v => setForm(p => ({ ...p, time: maskHora(v) }))} />
        <Input label="Alimentos" placeholder="Ex: Frango, Arroz, Salada" value={form.items} onChangeText={v => setForm(p => ({ ...p, items: v }))} />
        <Input label="Calorias" keyboardType="number-pad" value={form.calories} onChangeText={v => setForm(p => ({ ...p, calories: v }))} />
      </Sheet>
    </Screen>
  );
}
