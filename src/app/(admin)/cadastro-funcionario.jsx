import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Screen, Card, CardTitle, Button, Input, Badge, Row } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { apiJson, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { isoParaDisplay, maskTelefone } from "../../utils";
import { c } from "../../theme";

const VAZIO = { nome: "", email: "", telefone: "", senha: "", confirmar: "" };
const fmtData = (iso) => (iso ? isoParaDisplay(iso) : "—");

export default function CadastroFuncionario() {
  const { usuarioLogado } = useApp();
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);

  const carregar = () =>
    apiJson("/admin/funcionarios").then(d => setFuncionarios(Array.isArray(d) ? d : [])).catch(e => toast.error(e.message));
  useEffect(() => { carregar(); }, []);

  const set = (campo) => (v) => setForm(f => ({ ...f, [campo]: campo === "telefone" ? maskTelefone(v) : v }));

  const cadastrar = async () => {
    if (!form.nome || !form.email || !form.senha) { toast.error("Preencha nome, e-mail e senha."); return; }
    if (form.senha.length < 6) { toast.error("A senha deve ter ao menos 6 caracteres."); return; }
    if (form.senha !== form.confirmar) { toast.error("As senhas não coincidem."); return; }
    setSalvando(true);
    try {
      await apiJson("/admin/funcionarios", {
        method: "POST", headers: JSON_HEADERS,
        body: JSON.stringify({ nome: form.nome, email: form.email.trim(), telefone: form.telefone, senha: form.senha }),
      });
      toast.success("Funcionário cadastrado! Ele já pode entrar como Admin.");
      setForm(VAZIO);
      carregar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (f) => {
    try {
      await apiJson(`/admin/usuarios/${f.id}/status`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ ativo: !f.ativo }) });
      setFuncionarios(prev => prev.map(x => (x.id === f.id ? { ...x, ativo: !f.ativo } : x)));
      toast.success(f.ativo ? "Acesso desativado." : "Acesso reativado.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Screen title="Cadastro de Funcionário / Admin" subtitle="Crie contas de acesso administrativo para a equipe" onRefresh={carregar}>
      <Card style={{ gap: 14 }}>
        <CardTitle icon="user-plus">Novo funcionário</CardTitle>
        <Text style={{ color: c.gray500, fontSize: 13 }}>A conta já nasce ativa e aprovada, com acesso total ao painel admin.</Text>
        <Input label="Nome completo" value={form.nome} onChangeText={set("nome")} maxLength={100} autoCapitalize="words" />
        <Input label="E-mail" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCorrect={false} />
        <Input label="Telefone (opcional)" value={form.telefone} onChangeText={set("telefone")} keyboardType="phone-pad" />
        <Input label="Senha" value={form.senha} onChangeText={set("senha")} secureTextEntry />
        <Input label="Confirmar senha" value={form.confirmar} onChangeText={set("confirmar")} secureTextEntry />
        <Button title="Cadastrar funcionário" onPress={cadastrar} loading={salvando} />
      </Card>

      <Card style={{ gap: 12 }}>
        <CardTitle icon="users">Equipe administrativa</CardTitle>
        {funcionarios.map(f => (
          <View key={f.id} style={{ borderTopWidth: 1, borderTopColor: c.gray100, paddingTop: 12, gap: 6 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "700", color: c.gray900, flex: 1 }}>{f.nome}</Text>
              {f.principal ? <Badge text="Principal" tone="amber" /> : null}
            </Row>
            <Text style={{ color: c.gray500, fontSize: 13 }}>{f.email}</Text>
            <Text style={{ color: c.gray500, fontSize: 12 }}>Cadastro: {fmtData(f.dataCadastro)} · Último acesso: {fmtData(f.ultimoAcesso)}</Text>
            <Row style={{ justifyContent: "space-between" }}>
              <Badge text={f.ativo ? "Ativo" : "Desativado"} tone={f.ativo ? "green" : "gray"} />
              {!f.principal && f.id !== usuarioLogado?.id && <Button small variant="outline" title={f.ativo ? "Desativar" : "Reativar"} onPress={() => alternarStatus(f)} />}
            </Row>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
