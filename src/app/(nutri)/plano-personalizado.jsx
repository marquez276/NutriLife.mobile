import { useEffect, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, Card, Button, Input, Sheet, Row, Icon } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../api";
import { toast } from "../../toast";
import { c } from "../../theme";

const ICONES = ["coffee", "sun", "gift", "moon"];
const CORES = [[c.amber50, c.amber600], [c.orange50, c.orange600], ["#fefce8", "#ca8a04"], [c.indigo50, c.indigo600]];

function refeicaoVazia() { return { nome: "", horario: "", alimentos: [] }; }

export default function PlanoPersonalizadoNutri() {
  const { clienteId, clienteNome } = useLocalSearchParams();
  const { usuarioLogado } = useApp();
  const [refeicoes, setRefeicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [anamnese, setAnamnese] = useState(null);
  const [anamneseAberta, setAnamneseAberta] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [buscaIndex, setBuscaIndex] = useState(null);
  const [buscaTexto, setBuscaTexto] = useState("");

  useEffect(() => {
    if (!clienteId) return;
    setLoading(true);
    apiFetch(`/plano/personalizado/${clienteId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => setRefeicoes(data?.refeicoes?.map(r => ({ nome: r.nome || "", horario: r.horario || "", alimentos: r.alimentos || [] })) || []))
      .catch(() => setRefeicoes([]))
      .finally(() => setLoading(false));

    apiFetch(`/anamnese/cliente/${clienteId}`).then(r => (r.ok ? r.json() : null)).then(setAnamnese).catch(() => setAnamnese(null));
    apiFetch("/admin/alimentos").then(r => (r.ok ? r.json() : [])).then(d => setCatalogo(Array.isArray(d) ? d : [])).catch(() => setCatalogo([]));
  }, [clienteId]);

  const resultadosBusca = buscaTexto.trim()
    ? catalogo.filter(a => a.nome?.toLowerCase().includes(buscaTexto.toLowerCase())).slice(0, 8)
    : [];

  const adicionarRefeicao = () => setRefeicoes(prev => [...prev, refeicaoVazia()]);
  const removerRefeicao = (i) => setRefeicoes(prev => prev.filter((_, idx) => idx !== i));
  const atualizarRefeicao = (i, campo, valor) => setRefeicoes(prev => prev.map((r, idx) => (idx === i ? { ...r, [campo]: valor } : r)));

  const adicionarAlimento = (i, a) => {
    setRefeicoes(prev => prev.map((r, idx) => (idx !== i ? r : {
      ...r,
      alimentos: [...r.alimentos, { nome: a.nome, calorias: a.calorias, proteina: a.proteina, carboidrato: a.carboidrato, gordura: a.gordura, categoria: a.categoria, quantidade: 100, unidade: "g" }],
    })));
    setBuscaIndex(null); setBuscaTexto("");
  };

  const removerAlimento = (i, j) => setRefeicoes(prev => prev.map((r, idx) => (idx !== i ? r : { ...r, alimentos: r.alimentos.filter((_, k) => k !== j) })));
  const atualizarAlimento = (i, j, campo, valor) => setRefeicoes(prev => prev.map((r, idx) => (idx !== i ? r : { ...r, alimentos: r.alimentos.map((a, k) => (k === j ? { ...a, [campo]: valor } : a)) })));

  const salvar = async () => {
    setSalvando(true);
    try {
      const res = await apiFetch(`/plano/personalizado/${clienteId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refeicoes }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message); }
      toast.success("Plano personalizado enviado com sucesso!");
    } catch (e) {
      toast.error(e.message || "Não foi possível salvar o plano.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Screen title="Plano Personalizado" back="/nutricionista-portal"><Text style={{ color: c.gray400 }}>Carregando...</Text></Screen>;

  return (
    <Screen title="Plano Personalizado" subtitle={`Paciente: ${clienteNome || ""}`} back="/nutricionista-portal">
      <Row>
        <Button title="Ver ficha de anamnese" icon="clipboard" variant="outline" style={{ flex: 1 }} onPress={() => setAnamneseAberta(true)} />
        <Button title={salvando ? "Enviando..." : "Enviar plano"} icon="save" style={{ flex: 1 }} onPress={salvar} loading={salvando} />
      </Row>

      {refeicoes.map((refeicao, i) => {
        const [bg, fg] = CORES[i % CORES.length];
        const total = refeicao.alimentos?.reduce((s, a) => s + (Number(a.calorias) || 0), 0) ?? 0;
        return (
          <Card key={i} style={{ gap: 10 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ backgroundColor: bg, padding: 10, borderRadius: 10 }}><Icon name={ICONES[i % ICONES.length]} size={22} color={fg} /></View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: c.gray900 }}>{total.toFixed(0)}<Text style={{ fontSize: 12, fontWeight: "400", color: c.gray500 }}> kcal</Text></Text>
              <Pressable onPress={() => removerRefeicao(i)} hitSlop={8}><Icon name="trash-2" size={18} color={c.red600} /></Pressable>
            </Row>
            <Input placeholder="Nome da refeição (ex: Café da manhã)" value={refeicao.nome} onChangeText={v => atualizarRefeicao(i, "nome", v)} />
            <Input placeholder="Horário (ex: 08:00)" value={refeicao.horario} onChangeText={v => atualizarRefeicao(i, "horario", v)} />

            {refeicao.alimentos?.map((a, j) => (
              <View key={j} style={{ backgroundColor: c.gray50, borderRadius: 10, padding: 12, gap: 8 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "600", color: c.gray900, flex: 1 }}>{a.nome}</Text>
                  <Pressable onPress={() => removerAlimento(i, j)} hitSlop={8}><Icon name="x" size={16} color={c.red600} /></Pressable>
                </Row>
                <Text style={{ fontSize: 12, color: c.gray500 }}>P: {a.proteina}g · C: {a.carboidrato}g · G: {a.gordura}g</Text>
                <Row>
                  <View style={{ flex: 1 }}><Input keyboardType="numeric" value={String(a.quantidade ?? "")} onChangeText={v => atualizarAlimento(i, j, "quantidade", v)} /></View>
                  <View style={{ flex: 1 }}><Input value={a.unidade ?? ""} onChangeText={v => atualizarAlimento(i, j, "unidade", v)} /></View>
                </Row>
              </View>
            ))}

            {buscaIndex === i ? (
              <View style={{ borderWidth: 2, borderStyle: "dashed", borderColor: c.gray200, borderRadius: 10, padding: 10, gap: 8 }}>
                <Input placeholder="Pesquisar alimento..." value={buscaTexto} onChangeText={setBuscaTexto} autoFocus />
                {resultadosBusca.map(a => (
                  <Pressable key={a.id} onPress={() => adicionarAlimento(i, a)} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: c.gray900 }}>{a.nome} <Text style={{ color: c.gray400 }}>· {a.calorias} kcal</Text></Text>
                  </Pressable>
                ))}
                <Button title="Cancelar" variant="ghost" small onPress={() => { setBuscaIndex(null); setBuscaTexto(""); }} />
              </View>
            ) : (
              <Button title="Adicionar alimento" icon="plus" variant="outline" onPress={() => setBuscaIndex(i)} />
            )}
          </Card>
        );
      })}

      <Button title="Adicionar refeição" icon="plus" variant="outlineGreen" onPress={adicionarRefeicao} />

      <Sheet visible={anamneseAberta} onClose={() => setAnamneseAberta(false)} title="Ficha de Anamnese" full>
        {anamnese ? (
          <View style={{ gap: 10 }}>
            {[["Peso", `${anamnese.peso} kg`], ["Altura", `${anamnese.altura} cm`], ["Idade", `${anamnese.idade} anos`], ["Sexo", anamnese.sexo],
              ["Objetivo", anamnese.objetivo], ["Atividade física", anamnese.atividade || "—"], ["Sono", anamnese.sono ? `${anamnese.sono}h` : "—"],
              ["Restrições", anamnese.restricoes || "Nenhuma"], ["Comorbidades", anamnese.comorbidades || "Nenhuma"]].map(([k, v]) => (
              <View key={k} style={{ backgroundColor: c.gray50, borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: c.gray400, textTransform: "uppercase" }}>{k}</Text>
                <Text style={{ fontWeight: "700", color: c.gray900 }}>{v}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={{ color: c.gray400 }}>Este paciente ainda não preencheu a ficha de anamnese.</Text>}
      </Sheet>
    </Screen>
  );
}
