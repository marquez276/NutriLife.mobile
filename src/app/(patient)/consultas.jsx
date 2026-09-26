import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Button, Badge, Avatar, Icon, Row } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { abrirUrl, hojeIso, isoParaDisplay } from "../../utils";
import { c } from "../../theme";

export default function Consultas() {
  const router = useRouter();
  const { agendamentos, usuarioLogado, recarregarDadosPaciente } = useApp();
  const hoje = hojeIso();
  const proximas = agendamentos.filter(a => (a.date || "").split("T")[0] >= hoje);
  const passadas = agendamentos.filter(a => (a.date || "").split("T")[0] < hoje);
  const nomeNutri = (ag) => ag.nutritionist || ag.nutricionistaNome || "Nutricionista";

  return (
    <Screen title="Consultas" subtitle="Gerencie seus agendamentos com nutricionista" back="/mais" onRefresh={() => recarregarDadosPaciente(usuarioLogado.id)}>
      <Button title="Agendar Consulta" icon="plus" onPress={() => router.push("/agenda")} />

      <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900 }}>Próximas Consultas</Text>
      {proximas.length === 0 ? (
        <Text style={{ color: c.gray400 }}>Nenhuma consulta agendada.</Text>
      ) : (
        proximas.map(ag => (
          <Card key={ag.id} accent={c.green500} style={{ gap: 12 }}>
            <Row style={{ gap: 12, alignItems: "flex-start" }}>
              <Avatar nome={nomeNutri(ag)} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: c.gray900 }}>{nomeNutri(ag)}</Text>
                <Text style={{ color: c.gray600, fontSize: 13 }}>{ag.observations || "Consulta"}</Text>
              </View>
            </Row>
            <Row style={{ flexWrap: "wrap" }}>
              <Badge text="Confirmada" icon="check-circle" />
              {ag.videoLink ? <Badge text="Online" tone="blue" icon="video" /> : null}
            </Row>
            <Row>
              <Icon name="calendar" size={16} color={c.gray600} /><Text style={{ fontWeight: "600", color: c.gray700 }}>{isoParaDisplay(ag.date)}</Text>
              <Icon name="clock" size={16} color={c.gray600} /><Text style={{ fontWeight: "600", color: c.gray700 }}>{ag.time}</Text>
            </Row>
            {ag.videoLink ? <Button title="Entrar na Videochamada" icon="video" variant="blue" onPress={() => abrirUrl(ag.videoLink)} /> : null}
          </Card>
        ))
      )}

      <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900 }}>Histórico de Consultas</Text>
      {passadas.length === 0 ? (
        <Text style={{ color: c.gray400 }}>Nenhuma consulta anterior.</Text>
      ) : (
        passadas.map(ag => (
          <Card key={ag.id} style={{ gap: 10 }}>
            <Row style={{ gap: 12 }}>
              <Avatar nome={nomeNutri(ag)} size={48} bg={c.gray100} fg={c.gray700} />
              <Text style={{ flex: 1, fontWeight: "700", color: c.gray900 }}>{nomeNutri(ag)}</Text>
              <Badge text="Concluída" tone="gray" />
            </Row>
            <Row>
              <Icon name="calendar" size={16} color={c.gray600} /><Text style={{ color: c.gray700 }}>{isoParaDisplay(ag.date)}</Text>
              <Icon name="clock" size={16} color={c.gray600} /><Text style={{ color: c.gray700 }}>{ag.time}</Text>
            </Row>
            {ag.observations ? (
              <View style={{ backgroundColor: c.gray50, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontWeight: "600", color: c.gray700, marginBottom: 2 }}>Anotações:</Text>
                <Text style={{ color: c.gray600 }}>{ag.observations}</Text>
              </View>
            ) : null}
          </Card>
        ))
      )}

      <Card style={{ backgroundColor: c.green50, borderWidth: 1, borderColor: c.green200, gap: 10 }}>
        <Text style={{ fontWeight: "700", color: c.gray900 }}>Agende sua próxima consulta</Text>
        <Text style={{ fontSize: 13, color: c.gray700 }}>Mantenha seu acompanhamento em dia. Consultas regulares ajudam a alcançar seus objetivos mais rapidamente.</Text>
        <Button title="Ver Horários Disponíveis" onPress={() => router.push("/agenda")} />
      </Card>
    </Screen>
  );
}
