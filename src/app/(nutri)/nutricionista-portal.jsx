import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Button, Input, Sheet, Badge, Avatar, Select, Icon, Empty, Row } from "../../components/ui";
import { LineChart } from "../../components/Charts";
import { useApp } from "../../context/AppContext";
import { apiFetch, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { c } from "../../theme";

const FORM_VAZIO = { name: "", age: "", sex: "", weight: "", height: "", goal: "", healthIssues: "", restrictions: "", activity: "", sleep: "" };
const op = (...v) => v.map(x => ({ value: x, label: x }));

export default function Nutricionista() {
  const router = useRouter();
  const { pacientes, adicionarPaciente, usuarioLogado } = useApp();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [notas, setNotas] = useState("");
  const [notasId, setNotasId] = useState(null);
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  const [evolucaoPac, setEvolucaoPac] = useState(null);
  const [notaProgresso, setNotaProgresso] = useState("");
  const [salvandoProg, setSalvandoProg] = useState(false);
  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState(FORM_VAZIO);
  const setCampo = (campo) => (v) => setNovo(p => ({ ...p, [campo]: v }));

  const buscarProntuario = async (paciente) => {
    if (!usuarioLogado?.id || !paciente?.name) return null;
    try {
      const res = await apiFetch(`/prontuario/${usuarioLogado.id}/${encodeURIComponent(paciente.name)}`);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  };

  const abrirDetalhes = async (paciente) => {
    setSelecionado(paciente);
    setNotas("");
    setNotasId(null);
    const data = await buscarProntuario(paciente);
    if (data) { setNotas(data.observations || ""); setNotasId(data.id > 0 ? data.id : null); }
  };

  const postarProntuario = async (corpo) => {
    const res = await apiFetch("/prontuario", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ...corpo, nutricionistaId: usuarioLogado.id }) });
    return res.ok ? res.json() : null;
  };

  const salvarNotas = async () => {
    if (!selecionado?.name) return;
    setSalvandoNotas(true);
    try {
      const data = await postarProntuario({ consultaId: notasId, observations: notas, pacienteNome: selecionado.name });
      if (data) { setNotasId(data.id); toast.success("Notas clínicas salvas!"); } else toast.error("Erro ao salvar notas.");
    } catch { toast.error("Erro ao conectar com o servidor."); }
    setSalvandoNotas(false);
  };

  const abrirEvolucao = async (paciente) => {
    setEvolucaoPac(paciente);
    setNotaProgresso("");
    const data = await buscarProntuario(paciente);
    if (data) setNotaProgresso(data.observations || "");
  };

  const salvarProgresso = async () => {
    if (!evolucaoPac?.name) return;
    setSalvandoProg(true);
    try {
      const data = await postarProntuario({ observations: notaProgresso, pacienteNome: evolucaoPac.name });
      data ? toast.success("Nota de progresso salva!") : toast.error("Erro ao salvar nota.");
    } catch { toast.error("Erro ao conectar com o servidor."); }
    setSalvandoProg(false);
  };

  const salvarNovo = () => {
    if (!novo.name || !novo.age || !novo.weight) { toast.error("Preencha os campos obrigatórios (Nome, Idade, Peso)"); return; }
    adicionarPaciente(novo);
    toast.success(`Paciente ${novo.name} adicionado!`);
    setNovoAberto(false);
    setNovo(FORM_VAZIO);
  };

  const filtrados = pacientes.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()));
  const evo = evolucaoPac?.evolution || [];

  return (
    <Screen title="Portal do Nutricionista" subtitle={`Olá, ${usuarioLogado?.nome || "Nutricionista"}! Gerencie seus pacientes.`}>
      <Row>
        <Button title="Agenda de Hoje" icon="calendar" variant="outlineGreen" style={{ flex: 1 }} onPress={() => router.push("/agenda-nutricionista")} />
        <Button title="Novo Paciente" icon="plus" style={{ flex: 1 }} onPress={() => setNovoAberto(true)} />
      </Row>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1, backgroundColor: c.green600 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", opacity: 0.8, textTransform: "uppercase" }}>Pacientes</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>{pacientes.length}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: c.gray500, textTransform: "uppercase" }}>CRN</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: c.gray900 }}>{usuarioLogado?.crn || "—"}</Text>
        </Card>
      </View>
      <Card>
        <Text style={{ fontSize: 11, fontWeight: "700", color: c.gray500, textTransform: "uppercase" }}>Especialidade</Text>
        <Text style={{ fontWeight: "700", color: c.gray900 }}>{usuarioLogado?.specialty || usuarioLogado?.especialidade || "—"}</Text>
      </Card>

      <Input placeholder="Buscar paciente por nome..." value={busca} onChangeText={setBusca} />

      {filtrados.length === 0 ? (
        <Card><Empty text={pacientes.length === 0 ? 'Nenhum paciente cadastrado ainda. Toque em "Novo Paciente" para adicionar.' : "Nenhum paciente encontrado com esse nome."} /></Card>
      ) : (
        filtrados.map(p => (
          <Card key={p.id} style={{ gap: 12 }}>
            <Row style={{ gap: 12 }}>
              <Avatar nome={p.name} size={56} />
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: c.gray900, flex: 1 }} numberOfLines={1}>{p.name}</Text>
                  <Badge text={p.status} tone={p.status === "Em dia" ? "green" : "amber"} />
                </Row>
                <Text style={{ color: c.gray500, fontSize: 13 }}>{p.age} anos • {p.goal || "Sem objetivo definido"}</Text>
              </View>
            </Row>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: c.gray50, borderRadius: 12, padding: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: c.gray400, textTransform: "uppercase" }}>Peso Atual</Text>
                <Text style={{ fontSize: 17, fontWeight: "800" }}>{p.weight} kg</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: c.gray50, borderRadius: 12, padding: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: c.gray400, textTransform: "uppercase" }}>Altura</Text>
                <Text style={{ fontSize: 17, fontWeight: "800" }}>{p.height ? `${p.height} cm` : "—"}</Text>
              </View>
            </View>
            <Row>
              <Button title="Detalhes" icon="clipboard" variant="outline" style={{ flex: 1 }} onPress={() => abrirDetalhes(p)} />
              <Button title="Evolução" icon="trending-up" style={{ flex: 1 }} onPress={() => abrirEvolucao(p)} />
            </Row>
          </Card>
        ))
      )}

      {/* Detalhes / prontuário */}
      <Sheet visible={!!selecionado} onClose={() => setSelecionado(null)} title={`Prontuário: ${selecionado?.name || ""}`} full>
        {selecionado && (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[["Objetivo", selecionado.goal], ["Restrições", selecionado.restrictions], ["Atividade Física", selecionado.activity], ["Problemas de Saúde", selecionado.healthIssues], ["Horas de Sono", selecionado.sleep], ["Sexo", selecionado.sex]].map(([k, v]) => (
                <View key={k} style={{ width: "48%", backgroundColor: c.gray50, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: c.gray400, textTransform: "uppercase" }}>{k}</Text>
                  <Text style={{ fontWeight: "700", color: c.gray900, marginTop: 2 }}>{v || "—"}</Text>
                </View>
              ))}
            </View>
            <View style={{ borderWidth: 2, borderStyle: "dashed", borderColor: c.gray200, borderRadius: 12, padding: 12, gap: 10 }}>
              <Text style={{ fontWeight: "700", color: c.gray600 }}>Observações Clínicas</Text>
              <Input placeholder="Adicione notas clínicas aqui..." multiline value={notas} onChangeText={setNotas} />
              <Button title={salvandoNotas ? "Salvando..." : "Salvar Notas"} onPress={salvarNotas} loading={salvandoNotas} />
            </View>
          </>
        )}
      </Sheet>

      {/* Evolução */}
      <Sheet visible={!!evolucaoPac} onClose={() => setEvolucaoPac(null)} title={`Evolução: ${evolucaoPac?.name || ""}`} full>
        {evolucaoPac && (
          <>
            {evo.length > 0 ? (
              <>
                <LineChart data={evo.map(e => ({ label: e.date, value: parseFloat(e.weight) }))} height={200} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1, backgroundColor: c.green50, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: c.green600, textTransform: "uppercase" }}>Inicial</Text>
                    <Text style={{ fontSize: 17, fontWeight: "800" }}>{evo[0].weight}kg</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: c.blue50, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: c.blue600, textTransform: "uppercase" }}>Atual</Text>
                    <Text style={{ fontSize: 17, fontWeight: "800" }}>{evolucaoPac.weight}kg</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: c.purple50, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: c.purple600, textTransform: "uppercase" }}>Redução</Text>
                    <Text style={{ fontSize: 17, fontWeight: "800" }}>-{(evo[0].weight - evolucaoPac.weight).toFixed(1)}kg</Text>
                  </View>
                </View>
              </>
            ) : <Empty text="Nenhum histórico de peso registrado para este paciente." />}
            <View style={{ borderTopWidth: 1, borderTopColor: c.gray100, paddingTop: 12, gap: 10 }}>
              <Text style={{ fontWeight: "700", color: c.gray600 }}>Nota de Progresso</Text>
              <Input placeholder="Registre evolução, observações de progresso..." multiline value={notaProgresso} onChangeText={setNotaProgresso} />
              <Button title={salvandoProg ? "Salvando..." : "Salvar Nota"} onPress={salvarProgresso} loading={salvandoProg} />
            </View>
          </>
        )}
      </Sheet>

      {/* Novo paciente */}
      <Sheet
        visible={novoAberto} onClose={() => setNovoAberto(false)} title="Adicionar Novo Paciente" full
        footer={<><Button title="Cancelar" variant="outline" style={{ flex: 1 }} onPress={() => setNovoAberto(false)} /><Button title="Salvar Paciente" style={{ flex: 1 }} onPress={salvarNovo} /></>}
      >
        <Input label="Nome Completo *" placeholder="João da Silva" value={novo.name} onChangeText={setCampo("name")} autoCapitalize="words" />
        <Input label="Idade *" placeholder="30" keyboardType="number-pad" value={novo.age} onChangeText={setCampo("age")} />
        <Input label="Peso (kg) *" placeholder="75.5" keyboardType="decimal-pad" value={novo.weight} onChangeText={v => setCampo("weight")(v.replace(",", "."))} />
        <Input label="Altura (cm)" placeholder="175" keyboardType="number-pad" value={novo.height} onChangeText={setCampo("height")} />
        <Select label="Sexo Biológico" value={novo.sex} options={op("Masculino", "Feminino")} onChange={setCampo("sex")} />
        <Select label="Objetivo Principal" value={novo.goal} options={op("Emagrecimento", "Ganho de Massa", "Definição", "Saúde Geral")} onChange={setCampo("goal")} />
        <Select label="Nível de Atividade Física" value={novo.activity} options={[{ value: "Sedentário", label: "Sedentário" }, { value: "Leve", label: "Leve (1-3x/semana)" }, { value: "Moderado", label: "Moderado (3-5x/semana)" }, { value: "Intenso", label: "Intenso (6-7x/semana)" }]} onChange={setCampo("activity")} />
        <Input label="Horas de Sono (média)" placeholder="7" keyboardType="number-pad" value={novo.sleep} onChangeText={setCampo("sleep")} />
        <Input label="Restrições Alimentares" placeholder="Lactose, glúten..." multiline value={novo.restrictions} onChangeText={setCampo("restrictions")} />
        <Input label="Problemas de Saúde" placeholder="Diabetes, hipertensão..." multiline value={novo.healthIssues} onChangeText={setCampo("healthIssues")} />
      </Sheet>
    </Screen>
  );
}
