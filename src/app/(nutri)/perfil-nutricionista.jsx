import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, CardTitle, Button, Input, Icon, Row } from "../../components/ui";
import { FotoPerfil } from "../../components/FotoPerfil";
import { useApp } from "../../context/AppContext";
import { apiFetch, JSON_HEADERS } from "../../api";
import { toast } from "../../toast";
import { abrirUrl } from "../../utils";
import { c } from "../../theme";

const PRECO_BASE = [{ label: "Consulta Inicial", value: "" }];

export default function NutricionistaPerfil() {
  const router = useRouter();
  const { usuarioLogado, recarregarNutricionistas, atualizarUsuarioLogado, logout } = useApp();
  const id = usuarioLogado?.id;

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", specialty: "", bio: "", experience: "",
    whatsapp: "", instagram: "", linkedin: "", website: "", prices: PRECO_BASE, portfolio: [], videos: [],
  });
  const set = (campo, valor) => setForm(p => ({ ...p, [campo]: valor }));

  useEffect(() => {
    if (!id) return;
    apiFetch(`/nutricionistas/${id}/perfil`)
      .then(r => (r.ok ? r.json() : null))
      .then(p => {
        const base = { ...form, nome: usuarioLogado?.nome || usuarioLogado?.nomeCompleto || "", email: usuarioLogado?.email || "", telefone: usuarioLogado?.telefone || "" };
        if (!p) { setForm(base); return; }
        let precos = base.prices;
        try { const parsed = JSON.parse(p.precos); if (Array.isArray(parsed)) precos = parsed; } catch {}
        const carregado = {
          ...base,
          specialty: p.especialidade || "", bio: p.bio || "", experience: p.experiencia || "",
          whatsapp: p.whatsapp || "", instagram: p.instagram || "", linkedin: p.linkedin || "", website: p.website || "",
          prices: precos,
          portfolio: p.portfolio ? p.portfolio.split("\n").filter(Boolean) : [],
          videos: p.videos ? p.videos.split("\n").filter(Boolean) : [],
        };
        if (p.nutricionista?.nomeCompleto) carregado.nome = p.nutricionista.nomeCompleto;
        if (p.nutricionista?.telefone) carregado.telefone = p.nutricionista.telefone;
        setForm(carregado);
      })
      .catch(() => {});
  }, [id]);

  const iniciarEdicao = () => { setSnapshot(form); setEditando(true); };
  const cancelar = () => { if (snapshot) setForm(snapshot); setEditando(false); };

  const salvar = async () => {
    if (!id) return;
    setSalvando(true);
    try {
      const [userRes, perfilRes] = await Promise.all([
        apiFetch(`/usuarios/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ nomeCompleto: form.nome, telefone: form.telefone, crn: usuarioLogado?.crn }) }),
        apiFetch(`/nutricionistas/${id}/perfil`, {
          method: "POST", headers: JSON_HEADERS,
          body: JSON.stringify({
            especialidade: form.specialty, bio: form.bio, whatsapp: form.whatsapp, instagram: form.instagram, linkedin: form.linkedin,
            website: form.website, experiencia: form.experience, precos: JSON.stringify(form.prices),
            portfolio: form.portfolio.join("\n"), videos: form.videos.join("\n"),
          }),
        }),
      ]);
      if (!userRes.ok || !perfilRes.ok) throw new Error();
      atualizarUsuarioLogado({ nome: form.nome, nomeCompleto: form.nome, telefone: form.telefone });
      recarregarNutricionistas();
      toast.success("Perfil salvo com sucesso!");
      setEditando(false);
    } catch {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSalvando(false);
    }
  };

  const salvarMidia = (portfolio, videos) =>
    apiFetch(`/nutricionistas/${id}/perfil`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ portfolio: portfolio.join("\n"), videos: videos.join("\n") }) }).catch(() => {});

  // Fotos viram data-URL (é assim que o web guarda o portfólio); vídeos guardam só o nome do arquivo
  const adicionarMidia = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], allowsMultipleSelection: true, base64: true, quality: 0.6 });
    if (res.canceled || !id) return;
    setEnviandoMidia(true);
    const novasImgs = res.assets.filter(a => a.type !== "video" && a.base64).map(a => `data:${a.mimeType || "image/jpeg"};base64,${a.base64}`);
    const novosVideos = res.assets.filter(a => a.type === "video").map(a => a.fileName || "video");
    const portfolio = [...form.portfolio, ...novasImgs];
    const videos = [...form.videos, ...novosVideos];
    setForm(p => ({ ...p, portfolio, videos }));
    await salvarMidia(portfolio, videos);
    toast.success(`${novasImgs.length + novosVideos.length} arquivo(s) adicionado(s)!`);
    setEnviandoMidia(false);
  };

  const removerImagem = async (i) => { const p = form.portfolio.filter((_, k) => k !== i); set("portfolio", p); await salvarMidia(p, form.videos); };
  const removerVideo = async (i) => { const v = form.videos.filter((_, k) => k !== i); set("videos", v); await salvarMidia(form.portfolio, v); };
  const setPreco = (i, campo, valor) => set("prices", form.prices.map((p, k) => (k === i ? { ...p, [campo]: valor } : p)));

  const sair = async () => { await logout(); router.replace("/"); };
  const ro = !editando;

  return (
    <Screen title="Perfil Profissional" subtitle="Gerencie sua presença pública e informações clínicas">
      {!editando ? (
        <Button title="Atualizar" icon="edit-2" onPress={iniciarEdicao} />
      ) : (
        <Row>
          <Button title="Cancelar" icon="x" variant="outline" style={{ flex: 1 }} onPress={cancelar} disabled={salvando} />
          <Button title="Salvar" icon="save" style={{ flex: 1 }} onPress={salvar} loading={salvando} />
        </Row>
      )}

      <Card style={{ alignItems: "center", gap: 4 }}>
        <FotoPerfil id={id} nome={form.nome} size={120} editavel />
        <Text style={{ fontSize: 20, fontWeight: "800", color: c.gray900, marginTop: 8 }}>{form.nome || "—"}</Text>
        <Text style={{ color: c.green600, fontWeight: "600" }}>CRN {usuarioLogado?.crn || "—"}</Text>
        {form.specialty ? <Text style={{ color: c.gray500 }}>{form.specialty}</Text> : null}
        <Row style={{ marginTop: 8 }}>
          {form.instagram ? <Button iconOnly icon="instagram" variant="outline" onPress={() => abrirUrl(`https://instagram.com/${form.instagram.replace("@", "")}`)} /> : null}
          {form.linkedin ? <Button iconOnly icon="linkedin" variant="outline" onPress={() => abrirUrl(`https://linkedin.com/in/${form.linkedin}`)} /> : null}
          {form.website ? <Button iconOnly icon="globe" variant="outline" onPress={() => abrirUrl(form.website.startsWith("http") ? form.website : `https://${form.website}`)} /> : null}
          {form.whatsapp ? <Button iconOnly icon="message-circle" variant="outline" onPress={() => abrirUrl(`https://wa.me/${form.whatsapp.replace(/\D/g, "")}`)} /> : null}
        </Row>
      </Card>

      <Card style={{ gap: 10 }}>
        <CardTitle icon="dollar-sign">Tabela de Preços</CardTitle>
        {form.prices.map((p, i) => (
          <Row key={i}>
            <Input placeholder="Serviço" value={p.label} readOnly={ro} onChangeText={v => setPreco(i, "label", v)} style={{ flex: 1 }} />
            <View style={{ width: 110 }}><Input placeholder="R$ 0,00" value={p.value} readOnly={ro} onChangeText={v => setPreco(i, "value", v)} /></View>
            {editando && <Pressable onPress={() => set("prices", form.prices.filter((_, k) => k !== i))} hitSlop={8}><Icon name="trash-2" size={18} color={c.red500} /></Pressable>}
          </Row>
        ))}
        {editando && <Button title="Adicionar Serviço" icon="plus" variant="outline" small onPress={() => set("prices", [...form.prices, { label: "", value: "" }])} />}
      </Card>

      <Card style={{ gap: 14 }}>
        <CardTitle>Informações Básicas</CardTitle>
        <Input label="Nome Público" value={form.nome} readOnly={ro} onChangeText={v => set("nome", v)} />
        <Input label="E-mail Profissional" value={form.email} readOnly />
        <Input label="Telefone" value={form.telefone} readOnly={ro} keyboardType="phone-pad" onChangeText={v => set("telefone", v)} />
        <Input label="Especialidade" value={form.specialty} readOnly={ro} onChangeText={v => set("specialty", v)} />
      </Card>

      <Card style={{ gap: 14 }}>
        <CardTitle>Redes Sociais</CardTitle>
        <Input label="WhatsApp" placeholder="5511999999999" value={form.whatsapp} readOnly={ro} keyboardType="phone-pad" onChangeText={v => set("whatsapp", v)} />
        <Input label="Instagram" placeholder="@seuperfil" value={form.instagram} readOnly={ro} onChangeText={v => set("instagram", v)} />
        <Input label="LinkedIn" placeholder="seu-perfil" value={form.linkedin} readOnly={ro} onChangeText={v => set("linkedin", v)} />
        <Input label="Website" placeholder="https://..." value={form.website} readOnly={ro} keyboardType="url" onChangeText={v => set("website", v)} />
      </Card>

      <Card style={{ gap: 14 }}>
        <CardTitle>Sobre Você</CardTitle>
        <Input label="Biografia Curta" multiline value={form.bio} readOnly={ro} placeholder={editando ? "Descreva sua experiência e abordagem profissional..." : ""} onChangeText={v => set("bio", v)} />
        <Input label="Experiência Profissional (uma por linha)" multiline value={form.experience} readOnly={ro} placeholder={editando ? "Ex: Clínica XYZ (2020 - Presente)" : ""} onChangeText={v => set("experience", v)} />
      </Card>

      <Card style={{ gap: 12 }}>
        <CardTitle>Mídia (Fotos)</CardTitle>
        {editando && <Button title={enviandoMidia ? "Enviando..." : "Adicionar"} icon="plus" variant="outline" onPress={adicionarMidia} loading={enviandoMidia} />}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {form.portfolio.map((img, i) => (
            <View key={i} style={{ width: "31%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", backgroundColor: c.gray200 }}>
              <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} />
              {editando && <Pressable onPress={() => removerImagem(i)} style={{ position: "absolute", top: 4, right: 4, backgroundColor: c.red500, borderRadius: 999, padding: 5 }}><Icon name="trash-2" size={12} color="#fff" /></Pressable>}
            </View>
          ))}
          {form.videos.map((v, i) => (
            <View key={i} style={{ width: "31%", aspectRatio: 1, borderRadius: 12, backgroundColor: c.gray900, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <Icon name="video" size={28} color="rgba(255,255,255,0.4)" />
              <Text numberOfLines={1} style={{ position: "absolute", bottom: 6, left: 6, right: 6, fontSize: 10, color: "#fff", fontWeight: "700" }}>{v}</Text>
              {editando && <Pressable onPress={() => removerVideo(i)} style={{ position: "absolute", top: 4, right: 4, backgroundColor: c.red500, borderRadius: 999, padding: 5 }}><Icon name="trash-2" size={12} color="#fff" /></Pressable>}
            </View>
          ))}
        </View>
        {!editando && form.portfolio.length === 0 && form.videos.length === 0 && <Text style={{ color: c.gray400 }}>Nenhuma mídia adicionada.</Text>}
        <Text style={{ fontSize: 12, color: c.gray400 }}>Estas fotos aparecerão no seu perfil público para os clientes.</Text>
      </Card>

      <Button title="Sair" icon="log-out" variant="outline" onPress={sair} />
    </Screen>
  );
}
