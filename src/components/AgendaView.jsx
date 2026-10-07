import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Screen, Card, Button, Input, Sheet, Badge, Icon, Avatar, Row } from "./ui";
import { useApp } from "../context/AppContext";
import { toast } from "../toast";
import { abrirUrl, dataParaIso, hojeIso, iniciais, isoDe, isoParaDisplay, maskData, maskHora } from "../utils";
import { c } from "../theme";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const normDate = (a) => (a.date || "").split("T")[0];

// Dias do mês em grade de semanas (domingo a sábado), incluindo os dias que completam a primeira/última semana
function gradeDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(ano, mes, 1 - primeiro.getDay());
  const total = Math.ceil((primeiro.getDay() + new Date(ano, mes + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
}

// Mesma tela para paciente ("Minha Agenda") e nutricionista ("Agenda de Pacientes")
export default function AgendaView({ userType = "patient" }) {
  const { agendamentos, adicionarAgendamento, editarAgendamento, removerAgendamento, nutricionistas, vinculos } = useApp();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [selecionado, setSelecionado] = useState(hojeIso());
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const vazio = () => ({ nutritionist: "", paciente: "", date: isoParaDisplay(selecionado), time: "09:00", videoLink: "", observations: "" });
  const [form, setForm] = useState(vazio());
  const [sugestoes, setSugestoes] = useState(false);
  const set = (campo, valor) => setForm(p => ({ ...p, [campo]: valor }));

  const abrir = (ag) => {
    if (ag) {
      setEditandoId(ag.id);
      setForm({
        nutritionist: ag.nutritionist || ag.nutricionistaNome || "",
        paciente: ag.paciente || ag.pacienteNome || "",
        date: isoParaDisplay(ag.date || hojeIso()),
        time: ag.time || "09:00",
        videoLink: ag.videoLink || "",
        observations: ag.observations || "",
      });
    } else {
      setEditandoId(null);
      setForm(vazio());
    }
    setSugestoes(false);
    setAberto(true);
  };

  const salvar = () => {
    const iso = dataParaIso(form.date);
    if (!iso || form.time.length < 5) { toast.error("Preencha a data (DD/MM/AAAA) e o horário (HH:MM)."); return; }
    const dados = { ...form, date: iso };
    if (editandoId) { editarAgendamento(editandoId, dados); toast.success("Agendamento atualizado!"); }
    else { adicionarAgendamento(dados); toast.success("Consulta agendada!"); }
    setAberto(false);
  };

  const excluir = (ag) =>
    Alert.alert("Excluir agendamento", "Deseja realmente excluir esta consulta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => { removerAgendamento(ag.id); toast.success("Agendamento removido."); } },
    ]);

  const hoje = hojeIso();
  const dias = gradeDoMes(mesAtual.getFullYear(), mesAtual.getMonth());
  const doDia = agendamentos.filter(a => normDate(a) === selecionado);
  const comConsulta = new Set(agendamentos.map(normDate));
  const ehNutri = userType === "nutritionist";

  const nomesSugeridos = (ehNutri ? vinculos.filter(v => v.status === "ATIVO").map(v => v.clienteNome) : nutricionistas.map(n => n.nome)).filter(Boolean);
  const campoNome = ehNutri ? "paciente" : "nutritionist";
  const filtroNomes = nomesSugeridos.filter(n => n.toLowerCase().includes(form[campoNome].toLowerCase()) && n !== form[campoNome]);

  return (
    <Screen title={ehNutri ? "Agenda de Pacientes" : "Minha Agenda"} subtitle="Acompanhe seus horários de forma visual e intuitiva" back={ehNutri ? undefined : "/mais"}>
      <Button title="Novo Agendamento" icon="plus" onPress={() => abrir(null)} />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ backgroundColor: c.green600, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}</Text>
          <Row style={{ gap: 14 }}>
            <Pressable onPress={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))} hitSlop={10}><Icon name="chevron-left" size={22} color="#fff" /></Pressable>
            <Pressable onPress={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))} hitSlop={10}><Icon name="chevron-right" size={22} color="#fff" /></Pressable>
          </Row>
        </View>
        <View style={{ padding: 8 }}>
          <View style={{ flexDirection: "row" }}>
            {DIAS.map(d => <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: c.gray400, paddingVertical: 6, textTransform: "uppercase" }}>{d}</Text>)}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {dias.map((dia, i) => {
              const iso = isoDe(dia);
              const sel = iso === selecionado, ehHoje = iso === hoje, doMes = dia.getMonth() === mesAtual.getMonth();
              return (
                <Pressable key={i} onPress={() => setSelecionado(iso)} style={{ width: `${100 / 7}%`, height: 46, alignItems: "center", justifyContent: "center", padding: 2 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: sel ? c.green600 : "transparent", borderWidth: ehHoje && !sel ? 2 : 0, borderColor: c.green600, opacity: doMes ? 1 : 0.3 }}>
                    <Text style={{ fontWeight: "700", color: sel ? "#fff" : ehHoje ? c.green600 : c.gray900 }}>{dia.getDate()}</Text>
                    {comConsulta.has(iso) && <View style={{ position: "absolute", bottom: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: sel ? "#fff" : c.green600 }} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <Text style={{ fontSize: 18, fontWeight: "800", color: c.gray900 }}>
        {selecionado === hoje ? "Consultas para Hoje" : `Consultas para ${isoParaDisplay(selecionado)}`}
      </Text>

      {doDia.length === 0 ? (
        <Card style={{ alignItems: "center", gap: 8, padding: 28, borderWidth: 2, borderStyle: "dashed", borderColor: c.gray200, backgroundColor: c.gray50 }}>
          <Icon name="calendar" size={40} color={c.gray300} />
          <Text style={{ fontWeight: "600", color: c.gray900 }}>Nenhum agendamento para este dia</Text>
          <Text style={{ color: c.gray500, textAlign: "center" }}>Toque em "Novo Agendamento" para agendar uma consulta.</Text>
        </Card>
      ) : (
        doDia.map(ag => {
          const nome = ehNutri ? (ag.paciente || ag.pacienteNome || "Paciente não informado") : (ag.nutritionist || ag.nutricionistaNome || "Sem nutricionista");
          return (
            <Card key={ag.id} accent={c.green500} style={{ gap: 12 }}>
              <Row style={{ gap: 12 }}>
                <Avatar nome={nome} size={52} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.gray900 }}>{nome}</Text>
                  <Row><Badge text={ehNutri ? "Paciente" : "Nutricionista"} /><Text style={{ color: c.gray400, fontSize: 13 }}>{isoParaDisplay(ag.date)}</Text></Row>
                </View>
              </Row>
              <Row><Icon name="clock" size={16} color={c.gray600} /><Text style={{ fontWeight: "600", color: c.gray700 }}>{ag.time}</Text></Row>
              {ag.videoLink ? (
                <Pressable onPress={() => abrirUrl(ag.videoLink)}>
                  <Row><Icon name="video" size={16} color={c.blue600} /><Text style={{ color: c.blue600, fontWeight: "600" }}>Link da Chamada</Text><Icon name="external-link" size={12} color={c.blue600} /></Row>
                </Pressable>
              ) : null}
              {ag.observations ? <Text style={{ fontStyle: "italic", color: c.gray500 }}>"{ag.observations}"</Text> : null}
              <Row>
                <Button title="Editar" icon="edit-2" variant="outlineGreen" small style={{ flex: 1 }} onPress={() => abrir(ag)} />
                <Button title="Excluir" icon="trash-2" variant="danger" small style={{ flex: 1 }} onPress={() => excluir(ag)} />
              </Row>
            </Card>
          );
        })
      )}

      <Sheet
        visible={aberto} onClose={() => setAberto(false)} title={editandoId ? "Editar Agendamento" : "Novo Agendamento"}
        footer={<><Button title="Cancelar" variant="outline" style={{ flex: 1 }} onPress={() => setAberto(false)} /><Button title={editandoId ? "Salvar" : "Criar"} style={{ flex: 1 }} onPress={salvar} /></>}
      >
        <View>
          <Input
            label={ehNutri ? "Paciente" : "Nutricionista (opcional)"} placeholder={ehNutri ? "Nome do paciente" : "Nome do nutricionista"}
            value={form[campoNome]} onChangeText={v => { set(campoNome, v); setSugestoes(true); }} onFocus={() => setSugestoes(true)}
          />
          {sugestoes && form[campoNome].length > 0 && filtroNomes.length > 0 && (
            <View style={{ borderWidth: 1, borderColor: c.gray200, borderRadius: 10, marginTop: 4, backgroundColor: "#fff" }}>
              {filtroNomes.slice(0, 4).map(n => (
                <Pressable key={n} onPress={() => { set(campoNome, n); setSugestoes(false); }} style={{ padding: 12 }}><Text style={{ color: c.gray900 }}>{n}</Text></Pressable>
              ))}
            </View>
          )}
        </View>
        <Input label="Data" placeholder="DD/MM/AAAA" keyboardType="number-pad" value={form.date} onChangeText={v => set("date", maskData(v))} />
        <Input label="Horário" placeholder="HH:MM" keyboardType="number-pad" value={form.time} onChangeText={v => set("time", maskHora(v))} />
        <Input label="Link para videochamada" placeholder="https://meet.google.com/..." autoCapitalize="none" keyboardType="url" value={form.videoLink} onChangeText={v => set("videoLink", v)} />
        <Input label="Observações" placeholder="Ex: Trazer exames recentes..." multiline value={form.observations} onChangeText={v => set("observations", v)} />
      </Sheet>
    </Screen>
  );
}
