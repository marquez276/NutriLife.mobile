import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Screen, Card, Button, Input, Sheet, Badge, Icon, Segmented, Stars, Empty, Row } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { toast } from "../../toast";
import { abrirUrl } from "../../utils";
import { c } from "../../theme";

const media = (reviews) => (reviews?.length ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1) : null);
const whats = (n) => abrirUrl(`https://wa.me/${n.replace(/\D/g, "")}`);

export default function NutricionistasLista() {
  const { nutricionistas, adicionarAvaliacao, usuarioLogado, recarregarNutricionistas } = useApp();
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [aba, setAba] = useState("sobre");
  const [nova, setNova] = useState({ rating: 5, comment: "" });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { recarregarNutricionistas(); }, []);

  // sempre lê da lista do contexto para refletir a avaliação recém-enviada
  const selecionado = nutricionistas.find(n => n.id === selecionadoId) || null;
  const filtrados = nutricionistas.filter(n => (n.nome || "").toLowerCase().includes(busca.toLowerCase()) || (n.specialty || "").toLowerCase().includes(busca.toLowerCase()));

  const enviarAvaliacao = async () => {
    if (!nova.comment.trim()) { toast.error("Escreva um comentário."); return; }
    if (!usuarioLogado?.id) { toast.error("Você precisa estar logado."); return; }
    setEnviando(true);
    await adicionarAvaliacao(selecionado.id, { rating: nova.rating, comment: nova.comment });
    toast.success("Avaliação enviada!");
    setNova({ rating: 5, comment: "" });
    setEnviando(false);
  };

  const abrir = (n) => { setSelecionadoId(n.id); setAba("sobre"); };

  return (
    <Screen title="Encontre seu Nutricionista" subtitle="Especialistas prontos para te ajudar em sua jornada de saúde" back="/dashboard" onRefresh={recarregarNutricionistas}>
      <Input placeholder="Buscar por nome ou especialidade..." value={busca} onChangeText={setBusca} />

      {filtrados.length === 0 ? (
        <Card><Empty text={nutricionistas.length === 0 ? "No momento não há nutricionistas disponíveis." : "Nenhum nutricionista encontrado."} /></Card>
      ) : (
        filtrados.map(n => {
          const rating = media(n.reviews) ?? (n.rating > 0 ? n.rating.toFixed(1) : null);
          return (
            <Card key={n.id} style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ height: 170, backgroundColor: c.gray100, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 60, fontWeight: "800", color: c.gray300 }}>{(n.nome || "?").charAt(0)}</Text>
                {n.fotoUrl ? <Image source={{ uri: n.fotoUrl }} style={{ position: "absolute", width: "100%", height: "100%" }} resizeMode="cover" /> : null}
                <View style={{ position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Icon name="star" size={14} color={c.green600} /><Text style={{ fontWeight: "800", color: c.green700 }}>{rating ?? "Novo"}</Text>
                </View>
              </View>
              <View style={{ padding: 16, gap: 8 }}>
                <Text style={{ fontSize: 19, fontWeight: "700", color: c.gray900 }}>{n.nome}</Text>
                <Text style={{ color: c.green600, fontWeight: "700", fontSize: 11, textTransform: "uppercase" }}>{n.specialty}</Text>
                <Text numberOfLines={2} style={{ color: c.gray600, fontSize: 13 }}>{n.bio || "Sem descrição."}</Text>
                <Row>
                  <Button title="Ver Perfil Completo" onPress={() => abrir(n)} style={{ flex: 1 }} />
                  {n.whatsapp ? <Button iconOnly icon="message-circle" variant="outline" onPress={() => whats(n.whatsapp)} /> : null}
                </Row>
              </View>
            </Card>
          );
        })
      )}

      <Sheet visible={!!selecionado} onClose={() => setSelecionadoId(null)} title={selecionado?.nome || ""} full>
        {selecionado && (
          <>
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: c.gray100, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 44, fontWeight: "800", color: c.gray300 }}>{(selecionado.nome || "?").charAt(0)}</Text>
                {selecionado.fotoUrl ? <Image source={{ uri: selecionado.fotoUrl }} style={{ position: "absolute", width: "100%", height: "100%" }} /> : null}
              </View>
              {selecionado.specialty ? <Badge text={selecionado.specialty} /> : null}
              <Row style={{ gap: 6 }}><Stars rating={parseFloat(media(selecionado.reviews) || 0)} /><Text style={{ color: c.gray500 }}>{media(selecionado.reviews) ?? "Novo"}</Text></Row>
            </View>

            <Row style={{ justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
              {selecionado.whatsapp ? <Button title="WhatsApp" icon="message-circle" onPress={() => whats(selecionado.whatsapp)} style={{ backgroundColor: "#25D366", borderColor: "#25D366" }} /> : null}
              {selecionado.instagram ? <Button iconOnly icon="instagram" variant="outline" onPress={() => abrirUrl(`https://instagram.com/${selecionado.instagram.replace("@", "")}`)} /> : null}
              {selecionado.linkedin ? <Button iconOnly icon="linkedin" variant="outline" onPress={() => abrirUrl(`https://linkedin.com/in/${selecionado.linkedin}`)} /> : null}
              {selecionado.website ? <Button iconOnly icon="globe" variant="outline" onPress={() => abrirUrl(selecionado.website.startsWith("http") ? selecionado.website : `https://${selecionado.website}`)} /> : null}
            </Row>

            {selecionado.precos?.length > 0 && (
              <View style={{ gap: 8 }}>
                <Row><Icon name="dollar-sign" size={16} color={c.green600} /><Text style={{ fontWeight: "700", color: c.gray900 }}>Tabela de Preços</Text></Row>
                {selecionado.precos.map((p, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: c.gray200, borderRadius: 12 }}>
                    <Text style={{ color: c.gray600 }}>{p.label}</Text><Text style={{ fontWeight: "700", color: c.green700 }}>{p.value}</Text>
                  </View>
                ))}
              </View>
            )}

            <Segmented options={[{ value: "sobre", label: "Sobre" }, { value: "portfolio", label: "Mídia" }, { value: "avaliacoes", label: `Avaliações (${selecionado.reviews?.length || 0})` }]} value={aba} onChange={setAba} />

            {aba === "sobre" && (
              <View style={{ gap: 14 }}>
                {selecionado.bio ? (
                  <View style={{ gap: 8 }}>
                    <Row><Icon name="award" size={16} color={c.green600} /><Text style={{ fontWeight: "700", color: c.gray900 }}>Biografia</Text></Row>
                    <Text style={{ backgroundColor: c.gray50, padding: 14, borderRadius: 12, fontStyle: "italic", color: c.gray600, lineHeight: 21 }}>"{selecionado.bio}"</Text>
                  </View>
                ) : null}
                {selecionado.experiencia?.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Row><Icon name="trending-up" size={16} color={c.green600} /><Text style={{ fontWeight: "700", color: c.gray900 }}>Experiência</Text></Row>
                    {selecionado.experiencia.map((exp, i) => (
                      <Row key={i} style={{ alignItems: "flex-start" }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.green500, marginTop: 8 }} /><Text style={{ flex: 1, color: c.gray600 }}>{exp}</Text></Row>
                    ))}
                  </View>
                )}
                {!selecionado.bio && !selecionado.experiencia?.length && <Empty text="Nenhuma informação adicional." />}
              </View>
            )}

            {aba === "portfolio" && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {selecionado.portfolio?.map((img, i) => <Image key={i} source={{ uri: img }} style={{ width: "48%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: c.gray100 }} />)}
                {selecionado.videos?.map((v, i) => (
                  <View key={i} style={{ width: "48%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: c.gray900, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="video" size={22} color="#fff" />
                    <Text numberOfLines={1} style={{ position: "absolute", bottom: 6, left: 6, right: 6, fontSize: 10, color: "#fff", fontWeight: "700" }}>{v}</Text>
                  </View>
                ))}
                {!selecionado.portfolio?.length && !selecionado.videos?.length && <Empty text="Nenhum arquivo disponível." />}
              </View>
            )}

            {aba === "avaliacoes" && (
              <View style={{ gap: 12 }}>
                <View style={{ borderWidth: 2, borderStyle: "dashed", borderColor: c.green200, borderRadius: 14, padding: 14, gap: 10 }}>
                  <Row><Icon name="send" size={16} color={c.green600} /><Text style={{ fontWeight: "700", color: c.gray900 }}>Escrever Avaliação</Text></Row>
                  <Row>
                    <Text style={{ color: c.gray600 }}>Nota:</Text>
                    {[1, 2, 3, 4, 5].map(st => (
                      <Pressable key={st} onPress={() => setNova(p => ({ ...p, rating: st }))} hitSlop={4}><Icon name="star" size={24} color={st <= nova.rating ? c.yellow400 : c.gray300} /></Pressable>
                    ))}
                  </Row>
                  <Input placeholder="Compartilhe sua experiência..." multiline value={nova.comment} onChangeText={v => setNova(p => ({ ...p, comment: v }))} />
                  <Button title={enviando ? "Enviando..." : "Enviar Avaliação"} icon="send" onPress={enviarAvaliacao} loading={enviando} />
                </View>
                {selecionado.reviews?.length === 0 && <Text style={{ textAlign: "center", color: c.gray400 }}>Nenhuma avaliação ainda.</Text>}
                {selecionado.reviews?.map((rev, i) => (
                  <View key={rev.id ?? i} style={{ backgroundColor: c.gray50, borderRadius: 14, padding: 14, gap: 6 }}>
                    <Row style={{ justifyContent: "space-between" }}><Text style={{ fontWeight: "700", color: c.gray900 }}>{rev.userName || "Paciente"}</Text><Stars rating={rev.rating ?? 0} size={12} /></Row>
                    <Text style={{ color: c.gray600, fontSize: 13 }}>"{rev.comment}"</Text>
                    <Text style={{ fontSize: 10, color: c.gray400 }}>{rev.date}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
