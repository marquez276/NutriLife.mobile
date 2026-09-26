import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Screen, Card, CardTitle, Button, Icon, Row } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../api";
import { toast } from "../../toast";
import { isoParaDisplay } from "../../utils";
import { c } from "../../theme";

const ICONES = ["coffee", "sun", "gift", "moon"];
const CORES = [[c.amber50, c.amber600], [c.orange50, c.orange600], ["#fefce8", "#ca8a04"], [c.indigo50, c.indigo600]];

export default function PlanoAlimentar() {
  const { usuarioLogado } = useApp();
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerando, setRegenerando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarPlano = async (forcar = false) => {
    if (!usuarioLogado?.id) return;
    const url = forcar ? `/plano/regenerar/${usuarioLogado.id}` : `/plano/gerar/${usuarioLogado.id}`;
    forcar ? setRegenerando(true) : setLoading(true);
    setErro("");
    try {
      const res = await apiFetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao carregar plano.");
      }
      setPlano(await res.json());
      if (forcar) toast.success("Plano regenerado com sucesso!");
    } catch (e) {
      setErro(e.message);
      if (forcar) toast.error("Erro ao regenerar plano.");
    } finally {
      forcar ? setRegenerando(false) : setLoading(false);
    }
  };

  useEffect(() => { carregarPlano(); }, [usuarioLogado?.id]);

  const soma = (alimentos) => alimentos?.reduce((s, a) => s + (a.calorias ?? 0), 0) ?? 0;
  const total = plano?.refeicoes?.reduce((acc, r) => acc + soma(r.alimentos), 0) ?? 0;

  return (
    <Screen title="Plano Alimentar" subtitle="Seu plano personalizado gerado automaticamente" onRefresh={() => carregarPlano()}>
      <Button title={regenerando ? "Regenerando..." : "Regenerar Plano"} icon="refresh-cw" variant="outlineGreen" onPress={() => carregarPlano(true)} loading={regenerando} />

      {loading && <Text style={{ color: c.gray400 }}>Carregando plano...</Text>}
      {erro ? <Text style={{ color: c.red500 }}>{erro}</Text> : null}

      {plano && (
        <>
          <Card style={{ backgroundColor: c.green50, borderWidth: 1, borderColor: c.green200, flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: c.gray600, fontSize: 12 }}>Total de Calorias</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: c.gray900 }}>{total.toFixed(0)}</Text>
              <Text style={{ color: c.gray500, fontSize: 12 }}>kcal/dia</Text>
            </View>
            <View>
              <Text style={{ color: c.gray600, fontSize: 12 }}>Refeições</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: c.gray900 }}>{plano.refeicoes?.length ?? 0}</Text>
              <Text style={{ color: c.gray500, fontSize: 12 }}>por dia</Text>
            </View>
            <View>
              <Text style={{ color: c.gray600, fontSize: 12 }}>Início</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: c.gray900, marginTop: 8 }}>{isoParaDisplay(plano.dataInicio)}</Text>
            </View>
          </Card>

          {plano.refeicoes?.map((refeicao, i) => {
            const [bg, fg] = CORES[i % CORES.length];
            return (
              <Card key={refeicao.id ?? i} style={{ gap: 10 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Row style={{ gap: 12, flex: 1 }}>
                    <View style={{ backgroundColor: bg, padding: 10, borderRadius: 10 }}><Icon name={ICONES[i % ICONES.length]} size={22} color={fg} /></View>
                    <CardTitle style={{}}>{refeicao.nome}</CardTitle>
                  </Row>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 22, fontWeight: "800", color: c.gray900 }}>{soma(refeicao.alimentos).toFixed(0)}</Text>
                    <Text style={{ fontSize: 12, color: c.gray500 }}>kcal</Text>
                  </View>
                </Row>
                {refeicao.alimentos?.map((a, j) => (
                  <View key={a.id ?? j} style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.gray50, borderRadius: 10, padding: 12, gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", color: c.gray900 }}>{a.nome}</Text>
                      <Text style={{ fontSize: 12, color: c.gray500 }}>P: {a.proteina}g · C: {a.carboidrato}g · G: {a.gordura}g</Text>
                    </View>
                    <Text style={{ fontWeight: "800", fontSize: 16, color: c.gray900 }}>{a.calorias}<Text style={{ fontWeight: "400", fontSize: 12, color: c.gray500 }}> kcal</Text></Text>
                  </View>
                ))}
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}
