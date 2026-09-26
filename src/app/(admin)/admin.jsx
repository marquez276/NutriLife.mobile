import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Screen, Card, CardTitle, Button, Input, Badge, Segmented, StatCard, Grid2, Empty, Row } from "../../components/ui";
import { BarChart, Donut } from "../../components/Charts";
import { apiJson, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { isoParaDisplay } from "../../utils";
import { c } from "../../theme";

const lista = (d) => (Array.isArray(d) ? d : []);
const fmtData = (iso) => (iso ? isoParaDisplay(iso) : "Nunca");
const FILTROS = [{ value: "all", label: "Todos" }, { value: "abaixo", label: "Abaixo" }, { value: "ideal", label: "Ideal" }, { value: "acima", label: "Acima" }];
const TOM_STATUS = { Ideal: "green", Abaixo: "blue", Acima: "amber" };

export default function AdminDashboard() {
  const [aba, setAba] = useState("dashboard");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("all");
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [nutricionistas, setNutricionistas] = useState([]);
  const [crescimento, setCrescimento] = useState([]);
  const [dias, setDias] = useState("30");
  const [salvando, setSalvando] = useState(false);

  // Tudo que depende de "dias de inatividade" (flag inativo, stats) é recarregado junto
  const carregar = useCallback(() => Promise.all([
    apiJson("/admin/stats").then(setStats).catch(() => {}),
    apiJson("/admin/crescimento").then(d => setCrescimento(lista(d))).catch(() => {}),
    apiJson("/admin/usuarios").then(d => setUsuarios(lista(d))).catch(() => {}),
    apiJson("/admin/nutricionistas").then(d => setNutricionistas(lista(d))).catch(() => {}),
  ]), []);

  useEffect(() => {
    carregar();
    apiJson("/admin/configuracoes").then(d => setDias(String(d.diasInatividade ?? 30))).catch(() => {});
  }, [carregar]);

  const salvarConfig = () => {
    setSalvando(true);
    apiJson("/admin/configuracoes", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ diasInatividade: Number(dias) }) })
      .then(() => { toast.success("Configurações salvas!"); carregar(); })
      .catch(e => toast.error(e.message))
      .finally(() => setSalvando(false));
  };

  const alternarStatus = (u, setLista) =>
    apiJson(`/admin/usuarios/${u.id}/status`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ ativo: !u.ativo }) })
      .then(() => {
        setLista(prev => prev.map(x => (x.id === u.id ? { ...x, ativo: !u.ativo } : x)));
        toast.success(u.ativo ? "Conta desativada." : "Conta ativada.");
        apiJson("/admin/stats").then(setStats).catch(() => {});
      })
      .catch(e => toast.error(e.message));

  const totalPacientes = stats?.totalPacientes ?? usuarios.length;
  const totalNutri = stats?.totalNutricionistas ?? nutricionistas.length;
  const nutriAtivos = stats?.nutricionistasAtivos ?? nutricionistas.filter(n => n.ativo).length;
  const media = stats?.mediaAvaliacoes != null ? stats.mediaAvaliacoes.toFixed(1) : "—";
  const pizza = [{ name: "Ativos", value: nutriAtivos, color: "#9333ea" }, { name: "Pendentes/Inativos", value: totalNutri - nutriAtivos, color: "#d8b4fe" }];

  const filtrados = usuarios.filter(u => {
    const q = busca.toLowerCase();
    if (!(u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))) return false;
    return filtro === "all" || u.status?.toLowerCase() === filtro;
  });

  return (
    <Screen title="Painel de Administração" subtitle="Gestão global do sistema NutriLife" onRefresh={carregar}>
      <Segmented options={[{ value: "dashboard", label: "Painel" }, { value: "reports", label: "Relatórios" }, { value: "settings", label: "Config." }]} value={aba} onChange={setAba} />

      {aba === "dashboard" && (
        <>
          <Grid2>
            <StatCard icon="users" label="Total de Pacientes" value={totalPacientes} color="blue" />
            <StatCard icon="heart" label="Nutricionistas" value={totalNutri} color="green" />
            <StatCard icon="user-check" label="Nutri. Ativos" value={nutriAtivos} color="purple" />
            <StatCard icon="star" label="Média Avaliações" value={media} color="amber" />
          </Grid2>

          <Card>
            <CardTitle icon="bar-chart-2">Crescimento de Usuários</CardTitle>
            {crescimento.length ? <BarChart data={crescimento.map(d => ({ label: d.month, value: d.users }))} /> : <Empty text="Sem dados." />}
          </Card>

          <Card style={{ gap: 12 }}>
            <CardTitle>Nutricionistas por Status</CardTitle>
            <Donut data={pizza} />
            {pizza.map(d => (
              <Row key={d.name} style={{ justifyContent: "space-between", backgroundColor: c.gray50, borderRadius: 10, padding: 10 }}>
                <Row><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color }} /><Text style={{ color: c.gray600 }}>{d.name}</Text></Row>
                <Text style={{ fontWeight: "800" }}>{d.value}</Text>
              </Row>
            ))}
          </Card>

          <Card style={{ gap: 12 }}>
            <CardTitle icon="users">Gestão de Usuários</CardTitle>
            <Input placeholder="Buscar por nome..." value={busca} onChangeText={setBusca} />
            <Segmented options={FILTROS} value={filtro} onChange={setFiltro} />
            {filtrados.length === 0 ? (
              <Empty text={usuarios.length === 0 ? "Nenhum usuário cadastrado ainda." : "Nenhum usuário encontrado."} />
            ) : (
              filtrados.map(u => (
                <View key={u.id} style={{ borderTopWidth: 1, borderTopColor: c.gray100, paddingTop: 12, gap: 6 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "700", color: c.gray900, flex: 1 }}>{u.nome}</Text>
                    <Badge text={u.status} tone={TOM_STATUS[u.status] || "gray"} />
                  </Row>
                  <Text style={{ color: c.gray500, fontSize: 13 }}>{u.email}</Text>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text style={{ color: c.gray600, fontSize: 13 }}>IMC: <Text style={{ fontWeight: "700" }}>{u.imc ?? "—"}</Text> · Último acesso: {fmtData(u.ultimoAcesso)}</Text>
                  </Row>
                  <Row>
                    {u.inativo && <Badge text="Inativo" tone="red" />}
                    {!u.ativo && <Badge text="Conta desativada" tone="gray" />}
                    <View style={{ flex: 1 }} />
                    <Button small variant="outline" title={u.ativo ? "Desativar" : "Ativar"} onPress={() => alternarStatus(u, setUsuarios)} />
                  </Row>
                </View>
              ))
            )}
          </Card>
        </>
      )}

      {aba === "reports" && (
        <>
          <Card style={{ gap: 12 }}>
            <CardTitle>Resumo do Sistema</CardTitle>
            <Grid2>
              <StatCard icon="database" label="Total de Cadastros" value={stats?.totalCadastros ?? "—"} subtext={`${stats?.totalPacientes ?? 0} pacientes + ${stats?.totalNutricionistas ?? 0} nutricionistas`} color="green" />
              <StatCard icon="user-check" label="Nutricionistas Ativos" value={nutriAtivos} subtext="Com cadastro ativo" color="blue" />
              <StatCard icon="star" label="Média de Avaliações" value={media} subtext="Dos nutricionistas" color="purple" />
              <StatCard icon="file-text" label="Total de Logs" value={stats?.totalLogs ?? "—"} subtext="Registros de atividade" color="red" />
              <StatCard icon="clock" label="Usuários Inativos" value={stats?.usuariosInativos ?? "—"} subtext={`Sem acesso há mais de ${stats?.diasInatividade ?? dias} dias`} color="amber" />
              <StatCard icon="calendar" label="Consultas Agendadas" value={stats?.totalConsultas ?? "—"} subtext="Total na plataforma" color="teal" />
              <StatCard icon="shopping-bag" label="Alimentos no Catálogo" value={stats?.totalAlimentos ?? "—"} subtext={`${stats?.totalAdmins ?? 0} administradores`} color="indigo" />
            </Grid2>
          </Card>

          {nutricionistas.length > 0 && (
            <Card style={{ gap: 12 }}>
              <CardTitle>Nutricionistas Cadastrados</CardTitle>
              {nutricionistas.map(n => (
                <View key={n.id} style={{ borderTopWidth: 1, borderTopColor: c.gray100, paddingTop: 12, gap: 6 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "700", color: c.gray900, flex: 1 }}>{n.nome}</Text>
                    <Badge text={n.ativo ? "Ativo" : "Pendente"} tone={n.ativo ? "green" : "gray"} />
                  </Row>
                  <Text style={{ color: c.gray500, fontSize: 13 }}>CRN {n.crn || "—"} · Média {n.mediaAvaliacoes ?? "—"}</Text>
                  <Button small variant="outline" title={n.ativo ? "Desativar" : "Aprovar"} onPress={() => alternarStatus(n, setNutricionistas)} style={{ alignSelf: "flex-start" }} />
                </View>
              ))}
            </Card>
          )}
        </>
      )}

      {aba === "settings" && (
        <Card style={{ gap: 14 }}>
          <CardTitle>Configurações do Sistema</CardTitle>
          <Input
            label="Notificar se inatividade superior a (dias)" keyboardType="number-pad" value={dias} onChangeText={setDias}
            hint={`Usuários sem acesso há mais de ${dias || "?"} dias aparecem como "Inativo" no painel e nos relatórios${stats ? ` (agora: ${stats.usuariosInativos})` : ""}.`}
          />
          <Button title="Salvar Configurações" onPress={salvarConfig} loading={salvando} />
        </Card>
      )}
    </Screen>
  );
}
