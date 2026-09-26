import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Screen, Card, CardTitle, Button, Input, Select, CheckList, Row } from "../../components/ui";
import { FotoPerfil, enviarFoto } from "../../components/FotoPerfil";
import { useApp } from "../../context/AppContext";
import { apiFetch, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { ATIVIDADES, COMORBIDADES, HORAS_SONO, OBJETIVOS, RESTRICOES, alternarItem, strToList } from "../../utils";
import { c } from "../../theme";

const formDe = (usuario, a) => ({
  nomeCompleto: usuario?.nome || "",
  telefone: usuario?.telefone || "",
  peso: a?.peso ? String(a.peso) : "",
  altura: a?.altura ? String(a.altura) : "",
  objetivo: a?.objetivo || "",
  atividade: a?.atividade || "",
  sono: a?.sono ? String(a.sono) : "",
  restricoes: strToList(a?.restricoes),
  comorbidades: strToList(a?.comorbidades),
});

export default function Perfil() {
  const { usuarioLogado, anamnese, salvarAnamnese, recarregarDadosPaciente, atualizarUsuarioLogado } = useApp();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [fotoPendente, setFotoPendente] = useState(null);
  const [form, setForm] = useState(formDe(usuarioLogado, anamnese));

  useEffect(() => { setForm(formDe(usuarioLogado, anamnese)); }, [usuarioLogado, anamnese]);
  const set = (campo, valor) => setForm(p => ({ ...p, [campo]: valor }));

  const salvar = async () => {
    if (!form.peso || !form.altura) { toast.error("Peso e altura são obrigatórios."); return; }
    setSalvando(true);
    try {
      if (fotoPendente) {
        const ok = await enviarFoto(usuarioLogado.id, fotoPendente);
        if (!ok) toast.error("Erro ao enviar foto.");
      }
      await apiFetch(`/usuarios/${usuarioLogado.id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ nomeCompleto: form.nomeCompleto, telefone: form.telefone || null }) });
      atualizarUsuarioLogado({ nome: form.nomeCompleto, nomeCompleto: form.nomeCompleto, telefone: form.telefone });

      if (anamnese?.id) {
        await apiFetch(`/anamnese/${anamnese.id}`, {
          method: "PUT", headers: JSON_HEADERS,
          body: JSON.stringify({
            peso: parseFloat(form.peso) || null,
            altura: parseFloat(form.altura) || null,
            objetivo: form.objetivo || null,
            atividade: form.atividade || null,
            sono: parseInt(form.sono) || null,
            restricoes: form.restricoes.join(", ") || null,
            comorbidades: form.comorbidades.join(", ") || null,
          }),
        });
      } else {
        await salvarAnamnese({ ...form, restricoes: form.restricoes.join(", "), comorbidades: form.comorbidades.join(", ") });
      }
      toast.success("Perfil atualizado com sucesso!");
      setEditando(false);
      setFotoPendente(null);
      await recarregarDadosPaciente(usuarioLogado.id);
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const cancelar = () => { setForm(formDe(usuarioLogado, anamnese)); setFotoPendente(null); setEditando(false); };

  return (
    <Screen
      title="Meu Perfil de Saúde" subtitle="Suas informações de cadastro e anamnese" back="/mais"
      right={!editando ? <Button title="Atualizar" icon="edit-2" small onPress={() => setEditando(true)} /> : null}
    >
      {editando && (
        <Row>
          <Button title="Cancelar" variant="outline" style={{ flex: 1 }} onPress={cancelar} disabled={salvando} />
          <Button title="Salvar" style={{ flex: 1 }} onPress={salvar} loading={salvando} />
        </Row>
      )}

      <Card style={{ alignItems: "center", gap: 6 }}>
        <FotoPerfil id={usuarioLogado?.id} nome={form.nomeCompleto} editavel={editando} pendenteUri={fotoPendente?.uri} onEscolher={setFotoPendente} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900, marginTop: 6 }}>{form.nomeCompleto || "—"}</Text>
        <Text style={{ color: c.gray500 }}>{usuarioLogado?.email || "—"}</Text>
        <View style={{ alignSelf: "stretch", borderTopWidth: 1, borderTopColor: c.gray100, marginTop: 10, paddingTop: 10, gap: 6 }}>
          {[["Telefone", form.telefone || "—"], ["Sexo", anamnese?.sexo === "M" ? "Masculino" : anamnese?.sexo === "F" ? "Feminino" : "—"], ["Idade", anamnese?.idade ? `${anamnese.idade} anos` : "—"]].map(([k, v]) => (
            <Row key={k} style={{ justifyContent: "space-between" }}><Text style={{ color: c.gray500 }}>{k}</Text><Text style={{ fontWeight: "700" }}>{v}</Text></Row>
          ))}
        </View>
      </Card>

      <Card style={{ backgroundColor: c.amber50, gap: 10 }}>
        <CardTitle icon="alert-triangle" style={{ color: c.amber900 }}>Alertas de Saúde</CardTitle>
        <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: c.gray400, textTransform: "uppercase" }}>Restrições</Text>
          <Text style={{ fontWeight: "700", color: c.gray900 }}>{form.restricoes.length ? form.restricoes.join(", ") : "Nenhuma registrada"}</Text>
        </View>
        <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: c.gray400, textTransform: "uppercase" }}>Comorbidades</Text>
          <Text style={{ fontWeight: "700", color: c.gray900 }}>{form.comorbidades.length ? form.comorbidades.join(", ") : "Nenhuma registrada"}</Text>
        </View>
      </Card>

      <Card style={{ gap: 14 }}>
        <CardTitle icon="user">Dados de Cadastro</CardTitle>
        <Input label="Nome Completo" value={form.nomeCompleto} readOnly={!editando} onChangeText={v => set("nomeCompleto", v)} />
        <Input label="E-mail" value={usuarioLogado?.email || ""} readOnly />
        <Input label="Telefone" value={form.telefone} readOnly={!editando} keyboardType="phone-pad" onChangeText={v => set("telefone", v)} />
        <Input label="Idade" value={anamnese?.idade ? `${anamnese.idade} anos` : ""} readOnly />
      </Card>

      <Card style={{ gap: 14 }}>
        <CardTitle icon="activity">Informações de Anamnese</CardTitle>
        <Input label="Peso (kg)" value={form.peso} readOnly={!editando} keyboardType="decimal-pad" onChangeText={v => set("peso", v.replace(",", "."))} />
        <Input label="Altura (cm)" value={form.altura} readOnly={!editando} keyboardType="number-pad" onChangeText={v => set("altura", v)} />
        <Select label="Objetivo" value={form.objetivo} options={OBJETIVOS} readOnly={!editando} onChange={v => set("objetivo", v)} />
        <Select label="Nível de Atividade" value={form.atividade} options={ATIVIDADES} readOnly={!editando} onChange={v => set("atividade", v)} />
        <Select label="Horas de Sono" value={form.sono} options={HORAS_SONO} readOnly={!editando} onChange={v => set("sono", v)} />

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.gray700 }}>Restrições e Alergias</Text>
          {editando
            ? <CheckList options={RESTRICOES} values={form.restricoes} onToggle={i => set("restricoes", alternarItem(form.restricoes, i))} />
            : <Input value={form.restricoes.join(", ") || "Nenhuma registrada"} readOnly />}
        </View>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.gray700 }}>Problemas de Saúde e Comorbidades</Text>
          {editando
            ? <CheckList options={COMORBIDADES} values={form.comorbidades} onToggle={i => set("comorbidades", alternarItem(form.comorbidades, i))} />
            : <Input value={form.comorbidades.join(", ") || "Nenhuma registrada"} readOnly />}
        </View>
      </Card>
    </Screen>
  );
}
