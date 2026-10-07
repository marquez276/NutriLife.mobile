import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, CardTitle, Button, Input, Sheet, Badge, Avatar, Empty, Row, Segmented } from "../../components/ui";
import { LineChart } from "../../components/Charts";
import { useApp } from "../../context/AppContext";
import { apiFetch, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { c } from "../../theme";

export default function Nutricionista() {
  const router = useRouter();
  const { vinculos, aceitarVinculo, recusarVinculo, gerarConvite, pacientesExternos, cadastrarPacienteExterno, usuarioLogado } = useApp();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [observacoes, setObservacoes] = useState([]);
  const [novaObservacao, setNovaObservacao] = useState("");
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  const [evolucaoPac, setEvolucaoPac] = useState(null);
  const [evolucaoDados, setEvolucaoDados] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [aba, setAba] = useState("convite");
  const [convite, setConvite] = useState(null);
  const [gerandoConvite, setGerandoConvite] = useState(false);
  const [externo, setExterno] = useState({ nome: "", objetivo: "", observacoes: "" });

  const pacientesAtivos = vinculos.filter(v => v.status === "ATIVO");
  const solicitacoesPendentes = vinculos.filter(v => v.status === "PENDENTE" && v.origem === "PACIENTE");
  const convitesAbertos = vinculos.filter(v => v.status === "PENDENTE" && v.origem === "NUTRICIONISTA");

  const [planosPorCliente, setPlanosPorCliente] = useState({});

  useEffect(() => {
    pacientesAtivos.forEach(v => {
      if (!v.clienteId || planosPorCliente[v.clienteId] !== undefined) return;
      apiFetch(`/plano/personalizado/${v.clienteId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(plano => setPlanosPorCliente(prev => ({ ...prev, [v.clienteId]: plano })))
        .catch(() => setPlanosPorCliente(prev => ({ ...prev, [v.clienteId]: null })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculos]);

  const abrirDetalhes = async (vinculo) => {
    setSelecionado(vinculo);
    setObservacoes([]);
    setNovaObservacao("");
    if (!vinculo?.clienteId) return;
    try {
      const res = await apiFetch(`/prontuario/${vinculo.clienteId}`);
      if (res.ok) setObservacoes(await res.json());
    } catch {}
  };

  const salvarNotas = async () => {
    if (!selecionado?.clienteId || !novaObservacao.trim()) return;
    setSalvandoNotas(true);
    try {
      const res = await apiFetch("/prontuario", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ clienteId: selecionado.clienteId, texto: novaObservacao.trim() }) });
      if (res.ok) {
        const salva = await res.json();
        setObservacoes(prev => [salva, ...prev]);
        setNovaObservacao("");
        toast.success("Observação salva com sucesso.");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Não foi possível salvar a observação.");
      }
    } catch { toast.error("Erro ao conectar com o servidor."); }
    setSalvandoNotas(false);
  };

  const abrirEvolucao = async (vinculo) => {
    setEvolucaoPac(vinculo);
    setEvolucaoDados(null);
    if (vinculo?.clienteId) {
      try {
        const res = await apiFetch(`/clientes/${vinculo.clienteId}/progresso`);
        if (res.ok) setEvolucaoDados(await res.json());
      } catch {}
    }
  };

  const handleGerarConvite = async () => {
    setGerandoConvite(true);
    const codigo = await gerarConvite();
    if (codigo) setConvite(codigo);
    setGerandoConvite(false);
  };

  const salvarExterno = async () => {
    if (!externo.nome) { toast.error("Informe o nome do paciente."); return; }
    const { ok } = await cadastrarPacienteExterno(externo);
    if (ok) {
      toast.success(`Paciente ${externo.nome} cadastrado.`);
      setExterno({ nome: "", objetivo: "", observacoes: "" });
      setNovoAberto(false);
    }
  };

  const filtrados = pacientesAtivos.filter(v => (v.clienteNome || "").toLowerCase().includes(busca.toLowerCase()));
  const historico = evolucaoDados?.historico || [];

  return (
    <Screen title="Portal do Nutricionista" subtitle={`Olá, ${usuarioLogado?.nome || "Nutricionista"}! Gerencie seus pacientes.`}>
      <Row>
        <Button title="Agenda de Hoje" icon="calendar" variant="outlineGreen" style={{ flex: 1 }} onPress={() => router.push("/agenda-nutricionista")} />
        <Button title="Adicionar Paciente" icon="plus" style={{ flex: 1 }} onPress={() => { setConvite(null); setAba("convite"); setNovoAberto(true); }} />
      </Row>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1, backgroundColor: c.green600 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", opacity: 0.8, textTransform: "uppercase" }}>Vinculados</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>{pacientesAtivos.length}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: c.gray500, textTransform: "uppercase" }}>CRN</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: c.gray900 }}>{usuarioLogado?.crn || "—"}</Text>
        </Card>
      </View>

      {solicitacoesPendentes.length > 0 && (
        <Card>
          <CardTitle icon="user-plus">Solicitações de acompanhamento</CardTitle>
          {solicitacoesPendentes.map(v => (
            <Row key={v.id} style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontWeight: "700", color: c.gray900, flex: 1 }}>{v.clienteNome}</Text>
              <Button title="Recusar" variant="outline" small onPress={() => recusarVinculo(v.id)} />
              <Button title="Aceitar" small onPress={() => aceitarVinculo(v.id)} />
            </Row>
          ))}
        </Card>
      )}

      {convitesAbertos.length > 0 && (
        <Card>
          <CardTitle icon="link">Convites aguardando uso</CardTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {convitesAbertos.map(v => <Badge key={v.id} text={v.codigoConvite} tone="gray" />)}
          </View>
        </Card>
      )}

      <Input placeholder="Buscar paciente por nome..." value={busca} onChangeText={setBusca} />

      {filtrados.length === 0 ? (
        <Card><Empty text={pacientesAtivos.length === 0 ? "Nenhum paciente vinculado, melhore seu perfil e espere seus clientes" : "Nenhum paciente encontrado com esse nome."} /></Card>
      ) : (
        filtrados.map(v => {
          const plano = planosPorCliente[v.clienteId];
          const temPlano = !!plano;
          return (
            <Card key={v.id} style={{ gap: 12 }}>
              <Row style={{ gap: 12 }}>
                <Avatar nome={v.clienteNome} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: c.gray900 }} numberOfLines={1}>{v.clienteNome}</Text>
                  <Text style={{ color: c.gray500, fontSize: 13 }} numberOfLines={1}>{v.clienteEmail}</Text>
                </View>
              </Row>
              <View style={{ backgroundColor: c.gray50, borderRadius: 10, padding: 10 }}>
                {temPlano ? (
                  <>
                    <Text style={{ color: c.green700, fontWeight: "700", fontSize: 13 }}>✓ Plano criado</Text>
                    {plano.dataInicio && (
                      <Text style={{ color: c.gray400, fontSize: 12 }}>Última atualização: {new Date(plano.dataInicio).toLocaleDateString("pt-BR")}</Text>
                    )}
                  </>
                ) : (
                  <Text style={{ color: c.gray400, fontWeight: "700", fontSize: 13 }}>○ Nenhum plano criado</Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <Button title="Prontuário" icon="clipboard" variant="outline" style={{ flex: 1 }} onPress={() => abrirDetalhes(v)} />
                <Button title="Evolução" icon="trending-up" variant="outline" style={{ flex: 1 }} onPress={() => abrirEvolucao(v)} />
              </View>
              <Button
                title={temPlano ? "Criar Novo Plano Personalizado" : "Criar Plano Personalizado"}
                onPress={() => router.push({ pathname: "/plano-personalizado", params: { clienteId: v.clienteId, clienteNome: v.clienteNome } })}
              />
            </Card>
          );
        })
      )}

      {pacientesExternos.length > 0 && (
        <Card>
          <CardTitle icon="user">Pacientes sem conta</CardTitle>
          {pacientesExternos.map(p => (
            <View key={p.id} style={{ paddingVertical: 8 }}>
              <Text style={{ fontWeight: "700", color: c.gray900 }}>{p.nome}</Text>
              <Text style={{ color: c.gray500, fontSize: 13 }}>{p.objetivo || "Sem objetivo definido"}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Detalhes / prontuário */}
      <Sheet visible={!!selecionado} onClose={() => setSelecionado(null)} title={`Prontuário: ${selecionado?.clienteNome || ""}`} full>
        {selecionado && (
          <View style={{ gap: 16 }}>
            <View style={{ borderWidth: 2, borderStyle: "dashed", borderColor: c.gray200, borderRadius: 12, padding: 12, gap: 10 }}>
              <Text style={{ fontWeight: "700", color: c.gray600 }}>Nova observação</Text>
              <Input placeholder="Adicione uma observação clínica..." multiline value={novaObservacao} onChangeText={setNovaObservacao} />
              <Button title={salvandoNotas ? "Salvando..." : "Salvar observação"} onPress={salvarNotas} loading={salvandoNotas} />
            </View>
            <View style={{ gap: 10 }}>
              <Text style={{ fontWeight: "700", color: c.gray600 }}>Histórico de observações</Text>
              {observacoes.length === 0 ? (
                <Text style={{ color: c.gray400, fontSize: 13 }}>Nenhuma observação registrada ainda.</Text>
              ) : (
                observacoes.map(o => (
                  <View key={o.id} style={{ backgroundColor: c.gray50, borderRadius: 10, padding: 12 }}>
                    <Text style={{ fontSize: 11, color: c.gray400, fontWeight: "700", marginBottom: 4 }}>
                      {new Date(o.dataHora).toLocaleDateString("pt-BR")} — Nutricionista
                    </Text>
                    <Text style={{ color: c.gray700 }}>{o.texto}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </Sheet>

      {/* Evolução */}
      <Sheet visible={!!evolucaoPac} onClose={() => setEvolucaoPac(null)} title={`Evolução: ${evolucaoPac?.clienteNome || ""}`} full>
        {evolucaoPac && (
          <>
            {historico.length > 0 ? (
              <>
                <LineChart data={historico.map(h => ({ label: h.data, value: parseFloat(h.peso) }))} height={200} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1, backgroundColor: c.green50, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: c.green600, textTransform: "uppercase" }}>Inicial</Text>
                    <Text style={{ fontSize: 17, fontWeight: "800" }}>{evolucaoDados?.pesoInicial ?? "—"}kg</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: c.blue50, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: c.blue600, textTransform: "uppercase" }}>Ideal</Text>
                    <Text style={{ fontSize: 17, fontWeight: "800" }}>{evolucaoDados?.pesoIdeal ?? "—"}kg</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: c.purple50, borderRadius: 12, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: c.purple600, textTransform: "uppercase" }}>IMC</Text>
                    <Text style={{ fontSize: 17, fontWeight: "800" }}>{evolucaoDados?.imc ?? "—"}</Text>
                  </View>
                </View>
              </>
            ) : <Empty text="Nenhum histórico de peso registrado para este paciente." />}
          </>
        )}
      </Sheet>

      {/* Adicionar paciente */}
      <Sheet visible={novoAberto} onClose={() => setNovoAberto(false)} title="Adicionar Paciente" full>
        <Segmented value={aba} onChange={setAba} options={[{ value: "convite", label: "Já possui conta" }, { value: "externo", label: "Sem conta" }]} />
        {aba === "convite" ? (
          <View style={{ gap: 12 }}>
            <Text style={{ color: c.gray500, fontSize: 13 }}>Gere um código e envie para o paciente. Ele informa o código no NutriLife para se vincular a você.</Text>
            {convite ? (
              <Card style={{ backgroundColor: c.green50 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: c.green700, textAlign: "center" }}>{convite}</Text>
              </Card>
            ) : (
              <Button title={gerandoConvite ? "Gerando..." : "Gerar código de convite"} onPress={handleGerarConvite} loading={gerandoConvite} />
            )}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Input label="Nome Completo *" placeholder="João da Silva" value={externo.nome} onChangeText={v => setExterno(p => ({ ...p, nome: v }))} autoCapitalize="words" />
            <Input label="Objetivo" placeholder="Emagrecimento" value={externo.objetivo} onChangeText={v => setExterno(p => ({ ...p, objetivo: v }))} />
            <Input label="Observações" multiline value={externo.observacoes} onChangeText={v => setExterno(p => ({ ...p, observacoes: v }))} />
            <Button title="Salvar Paciente" onPress={salvarExterno} />
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
