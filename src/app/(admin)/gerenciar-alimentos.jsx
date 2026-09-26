import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Screen, Card, Button, Input, Sheet, Icon, Switch2, Empty, Row } from "../../components/ui";
import { apiJson, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { c } from "../../theme";

const VAZIO = { nome: "", calorias: "", proteina: "", carboidrato: "", gordura: "" };
const CAMPOS = [
  { id: "nome", label: "Nome", teclado: "default" },
  { id: "calorias", label: "Calorias (kcal)", teclado: "decimal-pad" },
  { id: "proteina", label: "Proteína (g)", teclado: "decimal-pad" },
  { id: "carboidrato", label: "Carboidrato (g)", teclado: "decimal-pad" },
  { id: "gordura", label: "Gordura (g)", teclado: "decimal-pad" },
];

export default function GerenciarAlimentos() {
  const [alimentos, setAlimentos] = useState([]);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(null); // null = novo
  const [form, setForm] = useState(VAZIO);

  const carregar = () =>
    apiJson("/admin/alimentos").then(d => setAlimentos(Array.isArray(d) ? d : [])).catch(() => toast.error("Erro ao carregar alimentos."));
  useEffect(() => { carregar(); }, []);

  const novo = () => { setEditando(null); setForm(VAZIO); setAberto(true); };
  const editar = (f) => {
    setEditando(f);
    setForm({ nome: f.nome, calorias: String(f.calorias), proteina: String(f.proteina), carboidrato: String(f.carboidrato), gordura: String(f.gordura) });
    setAberto(true);
  };

  const salvar = () => {
    const num = (v) => parseFloat(String(v).replace(",", ".")) || 0;
    const corpo = { nome: form.nome, calorias: num(form.calorias), proteina: num(form.proteina), carboidrato: num(form.carboidrato), gordura: num(form.gordura), ativo: editando ? editando.ativo : true };
    apiJson(editando ? `/admin/alimentos/${editando.id}` : "/admin/alimentos", { method: editando ? "PUT" : "POST", headers: JSON_HEADERS, body: JSON.stringify(corpo) })
      .then(salvo => {
        setAlimentos(prev => (editando ? prev.map(f => (f.id === salvo.id ? salvo : f)) : [...prev, salvo]));
        toast.success(editando ? "Alimento atualizado!" : "Alimento adicionado!");
        setAberto(false);
      })
      .catch(e => toast.error(e.message));
  };

  const alternarAtivo = (f) => {
    const { id, nome, calorias, proteina, carboidrato, gordura } = f;
    apiJson(`/admin/alimentos/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ nome, calorias, proteina, carboidrato, gordura, ativo: !f.ativo }) })
      .then(salvo => {
        setAlimentos(prev => prev.map(x => (x.id === salvo.id ? salvo : x)));
        toast.success(salvo.ativo ? "Alimento ativado." : "Alimento desativado: não entra mais nos planos.");
      })
      .catch(e => toast.error(e.message));
  };

  const remover = (f) =>
    Alert.alert("Remover alimento", `Remover "${f.nome}" do banco de alimentos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover", style: "destructive",
        onPress: () => apiJson(`/admin/alimentos/${f.id}`, { method: "DELETE" })
          .then(() => { setAlimentos(prev => prev.filter(x => x.id !== f.id)); toast.success("Alimento removido."); })
          .catch(e => toast.error(e.message)),
      },
    ]);

  const filtrados = alimentos.filter(f => f.nome?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <Screen title="Gerenciar Banco de Alimentos" subtitle="Controle total sobre a base nutricional do sistema" onRefresh={carregar}>
      <Button title="Adicionar Novo Item" icon="plus" onPress={novo} />
      <Input placeholder="Buscar na base de dados..." value={busca} onChangeText={setBusca} />
      <Card style={{ backgroundColor: c.blue600, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: 10, borderRadius: 12 }}><Icon name="database" size={22} color="#fff" /></View>
        <View>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", opacity: 0.8, textTransform: "uppercase" }}>Itens Totais</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{alimentos.length}</Text>
        </View>
      </Card>

      {filtrados.length === 0 ? (
        <Card><Empty text={alimentos.length === 0 ? "Nenhum alimento cadastrado." : "Nenhum resultado encontrado."} /></Card>
      ) : (
        filtrados.map(f => (
          <Card key={f.id} style={{ gap: 10, opacity: f.ativo === false ? 0.6 : 1 }}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: c.gray900, fontSize: 15 }}>{f.nome}</Text>
                <Text style={{ color: c.gray500, fontSize: 13 }}>{f.proteina}g / {f.carboidrato}g / {f.gordura}g (P/C/G)</Text>
              </View>
              <Text style={{ fontWeight: "800", color: c.gray900 }}>{f.calorias} kcal</Text>
            </Row>
            <Row style={{ justifyContent: "space-between" }}>
              <Row><Switch2 value={f.ativo !== false} onChange={() => alternarAtivo(f)} /><Text style={{ color: c.gray600, fontSize: 13 }}>Ativo nos planos</Text></Row>
              <Row style={{ gap: 16 }}>
                <Pressable onPress={() => editar(f)} hitSlop={8}><Icon name="edit-2" size={18} color={c.blue600} /></Pressable>
                <Pressable onPress={() => remover(f)} hitSlop={8}><Icon name="trash-2" size={18} color={c.red600} /></Pressable>
              </Row>
            </Row>
          </Card>
        ))
      )}

      <Sheet
        visible={aberto} onClose={() => setAberto(false)} title={editando ? "Editar Alimento" : "Novo Alimento"}
        footer={<><Button title="Cancelar" variant="outline" style={{ flex: 1 }} onPress={() => setAberto(false)} /><Button title="Salvar" style={{ flex: 1 }} onPress={salvar} /></>}
      >
        {CAMPOS.map(({ id, label, teclado }) => (
          <Input key={id} label={label} keyboardType={teclado} value={form[id]} onChangeText={v => setForm(p => ({ ...p, [id]: v }))} />
        ))}
      </Sheet>
    </Screen>
  );
}
