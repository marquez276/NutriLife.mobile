import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Screen, Card, CardTitle, Icon, Row, Empty } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../api";
import { isoParaDisplay } from "../../utils";
import { c } from "../../theme";

const ICONES = ["coffee", "sun", "gift", "moon"];
const CORES = [[c.amber50, c.amber600], [c.orange50, c.orange600], ["#fefce8", "#ca8a04"], [c.indigo50, c.indigo600]];

export default function PlanoPersonalizadoPaciente() {
  const { usuarioLogado } = useApp();
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    if (!usuarioLogado?.id) return;
    setLoading(true);
    apiFetch(`/plano/personalizado/${usuarioLogado.id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(setPlano)
      .catch(() => setPlano(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [usuarioLogado?.id]);

  if (loading) return <Screen title="Plano Personalizado" back="/dashboard"><Text style={{ color: c.gray400 }}>Carregando...</Text></Screen>;

  if (!plano) {
    return (
      <Screen title="Plano Personalizado" back="/dashboard" onRefresh={carregar}>
        <Card><Empty text="Seu nutricionista ainda não disponibilizou um Plano Personalizado para você." icon="clipboard" /></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Plano Personalizado" subtitle={`Nutricionista: ${plano.nutricionista?.nomeCompleto || "—"} · Atualizado em ${isoParaDisplay(plano.dataInicio)}`} back="/dashboard" onRefresh={carregar}>
      {plano.refeicoes?.map((refeicao, i) => {
        const [bg, fg] = CORES[i % CORES.length];
        const total = refeicao.alimentos?.reduce((s, a) => s + (a.calorias ?? 0), 0) ?? 0;
        return (
          <Card key={refeicao.id ?? i} style={{ gap: 10 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Row style={{ gap: 12, flex: 1 }}>
                <View style={{ backgroundColor: bg, padding: 10, borderRadius: 10 }}><Icon name={ICONES[i % ICONES.length]} size={22} color={fg} /></View>
                <CardTitle>{refeicao.nome}{refeicao.horario ? ` · ${refeicao.horario}` : ""}</CardTitle>
              </Row>
              <Text style={{ fontSize: 22, fontWeight: "800", color: c.gray900 }}>{total.toFixed(0)}<Text style={{ fontSize: 12, fontWeight: "400", color: c.gray500 }}> kcal</Text></Text>
            </Row>
            {refeicao.alimentos?.map((a, j) => (
              <View key={a.id ?? j} style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.gray50, borderRadius: 10, padding: 12, gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: c.gray900 }}>{a.nome}</Text>
                  <Text style={{ fontSize: 12, color: c.gray500 }}>P: {a.proteina}g · C: {a.carboidrato}g · G: {a.gordura}g</Text>
                </View>
                <Text style={{ fontSize: 13, color: c.gray500 }}>{a.quantidade} {a.unidade}</Text>
              </View>
            ))}
          </Card>
        );
      })}
    </Screen>
  );
}
