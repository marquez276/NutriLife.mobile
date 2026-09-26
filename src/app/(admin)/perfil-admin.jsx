import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, CardTitle, Button, Input, Segmented, Badge, Avatar, Icon, Empty, Row } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { apiJson, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { c } from "../../theme";

const PAGE_SIZE = 20;
const fmtData = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");

export default function AdminPerfil() {
  const router = useRouter();
  const { usuarioLogado, atualizarUsuarioLogado, logout } = useApp();
  const [secao, setSecao] = useState("profile");

  const adminNome = usuarioLogado?.nome || "Administrador";
  const adminEmail = usuarioLogado?.email || "—";
  const [form, setForm] = useState({ nome: adminNome, telefone: usuarioLogado?.telefone || "", senhaAtual: "", novaSenha: "" });
  const [salvando, setSalvando] = useState(false);
  const set = (campo) => (v) => setForm(f => ({ ...f, [campo]: v }));

  const salvarPerfil = async () => {
    setSalvando(true);
    try {
      const salvo = await apiJson("/admin/perfil", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(form) });
      atualizarUsuarioLogado({ nome: salvo.nome, nomeCompleto: salvo.nome, telefone: salvo.telefone });
      setForm(f => ({ ...f, senhaAtual: "", novaSenha: "" }));
      toast.success("Perfil atualizado!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Admins pendentes
  const [pendentes, setPendentes] = useState([]);
  useEffect(() => {
    apiJson("/admin/pendentes").then(d => setPendentes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  const aprovar = (id) =>
    apiJson(`/admin/${id}/aprovar`, { method: "PUT" })
      .then(() => { setPendentes(prev => prev.filter(a => a.id !== id)); toast.success("Admin aprovado com sucesso!"); })
      .catch(() => toast.error("Erro ao aprovar admin."));

  // Relatórios
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (secao !== "reports") return;
    apiJson("/admin/stats").then(setStats).catch(() => setStats(null));
  }, [secao]);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [logTotal, setLogTotal] = useState(0);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  const buscarLogs = (page, substituir = false) => {
    setCarregandoLogs(true);
    apiJson(`/admin/logs?page=${page}&size=${PAGE_SIZE}`)
      .then(data => {
        setLogs(prev => (substituir ? data.content : [...prev, ...data.content]));
        setLogTotal(data.totalElements || 0);
        setLogPage(page);
      })
      .catch(() => toast.error("Erro ao carregar logs."))
      .finally(() => setCarregandoLogs(false));
  };
  useEffect(() => {
    if (secao !== "logs") return;
    setLogs([]);
    buscarLogs(0, true);
  }, [secao]);

  const sair = async () => { await logout(); router.replace("/"); };

  const cards = stats ? [
    ["database", "Total de Cadastros", stats.totalCadastros, `${stats.totalPacientes ?? 0} pacientes + ${stats.totalNutricionistas ?? 0} nutricionistas`, c.green50, c.green600],
    ["activity", "Nutricionistas Ativos", stats.nutricionistasAtivos, `${stats.totalNutricionistas ?? 0} cadastrados na plataforma`, c.blue50, c.blue600],
    ["shield", "Nutricionistas Pendentes", stats.nutricionistasPendentes, "Aguardando aprovação do admin", c.amber50, c.amber600],
    ["file-text", "Total de Logs", stats.totalLogs, "Registros de atividade", c.purple50, c.purple600],
  ] : [];

  return (
    <Screen title="Perfil do Administrador" subtitle="Gestão de conta administrativa e configurações do sistema">
      <Card style={{ alignItems: "center", gap: 6 }}>
        <Avatar nome={adminNome} size={80} bg={c.green600} fg="#fff" />
        <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900 }}>{adminNome}</Text>
        <Text style={{ color: c.gray500 }}>{adminEmail}</Text>
        <Badge text="ACESSO TOTAL" icon="shield" />
      </Card>

      <Segmented options={[{ value: "profile", label: "Perfil" }, { value: "reports", label: "Relatórios" }, { value: "logs", label: "Logs" }]} value={secao} onChange={setSecao} />

      {secao === "profile" && (
        <>
          <Card style={{ gap: 14 }}>
            <CardTitle>Dados de Acesso</CardTitle>
            <Input label="Nome" value={form.nome} onChangeText={set("nome")} maxLength={100} />
            <Input label="E-mail (não editável)" value={adminEmail} readOnly />
            <Input label="Telefone" value={form.telefone} onChangeText={set("telefone")} keyboardType="phone-pad" maxLength={20} />
            <Input label="Senha atual (só para trocar a senha)" value={form.senhaAtual} onChangeText={set("senhaAtual")} secureTextEntry />
            <Input label="Nova senha" value={form.novaSenha} onChangeText={set("novaSenha")} secureTextEntry />
            <Button title="Salvar alterações" onPress={salvarPerfil} loading={salvando} />
          </Card>

          {pendentes.length > 0 && (
            <Card style={{ gap: 12 }}>
              <CardTitle icon="shield">Admins Aguardando Aprovação</CardTitle>
              {pendentes.map(a => (
                <Row key={a.id} style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}><Text style={{ fontWeight: "700" }}>{a.nomeCompleto}</Text><Text style={{ color: c.gray500, fontSize: 13 }}>{a.email}</Text></View>
                  <Button small title="Aprovar" onPress={() => aprovar(a.id)} />
                </Row>
              ))}
            </Card>
          )}
          <Button title="Sair" icon="log-out" variant="outline" onPress={sair} />
        </>
      )}

      {secao === "reports" && (
        <Card style={{ gap: 12 }}>
          <CardTitle icon="pie-chart">Relatórios Globais</CardTitle>
          {!stats ? <Empty text="Carregando dados..." /> : cards.map(([icon, label, valor, sub, bg, fg]) => (
            <View key={label} style={{ backgroundColor: bg, borderRadius: 14, padding: 16, gap: 8 }}>
              <Row style={{ gap: 12 }}>
                <View style={{ backgroundColor: fg, padding: 10, borderRadius: 10 }}><Icon name={icon} size={20} color="#fff" /></View>
                <View><Text style={{ color: c.gray600, fontSize: 13 }}>{label}</Text><Text style={{ fontSize: 24, fontWeight: "800", color: c.gray900 }}>{valor ?? "—"}</Text></View>
              </Row>
              <Text style={{ fontSize: 12, color: c.gray500 }}>{sub}</Text>
            </View>
          ))}
        </Card>
      )}

      {secao === "logs" && (
        <Card style={{ gap: 12 }}>
          <CardTitle icon="file-text">Logs de Atividades do Sistema</CardTitle>
          {logs.length === 0 && !carregandoLogs ? <Empty text="Nenhum log registrado." /> : logs.map(l => (
            <View key={l.id} style={{ borderTopWidth: 1, borderTopColor: c.gray100, paddingTop: 10, gap: 4 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "700", flex: 1 }}>{l.usuarioNome || "—"}</Text>
                <Badge text={l.status} tone={l.status === "Sucesso" ? "green" : "red"} />
              </Row>
              <Text style={{ color: c.gray600 }}>{l.acao}</Text>
              <Text style={{ color: c.gray400, fontSize: 12 }}>{fmtData(l.dataHora)}</Text>
            </View>
          ))}
          <Text style={{ color: c.gray500, fontSize: 13 }}>{logTotal === 0 ? "Nenhum registro." : `Mostrando ${logs.length} de ${logTotal} registros`}</Text>
          {logs.length < logTotal && <Button title={carregandoLogs ? "Carregando..." : "Carregar Mais"} variant="outline" loading={carregandoLogs} onPress={() => buscarLogs(logPage + 1)} />}
        </Card>
      )}
    </Screen>
  );
}
