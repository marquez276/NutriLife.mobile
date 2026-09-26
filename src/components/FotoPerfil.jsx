import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar, Icon } from "./ui";
import { apiFetch, urlImagemUsuario } from "../api";
import { toast } from "../toast";
import { c } from "../theme";

// Foto de perfil do usuário logado (GET/POST /usuarios/{id}/imagem, igual ao web).
// onEscolher: se informado, a foto só é escolhida aqui e enviada depois pelo pai (upload pendente).
export function FotoPerfil({ id, nome, size = 96, editavel, pendenteUri, onEscolher, onEnviada }) {
  const [uri, setUri] = useState(null);
  const [chave, setChave] = useState(0);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/usuarios/${id}/imagem`).then(r => setUri(r.ok ? urlImagemUsuario(id) : null)).catch(() => setUri(null));
  }, [id, chave]);

  const escolher = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (onEscolher) { onEscolher(asset); return; }
    const ok = await enviarFoto(id, asset);
    if (ok) { setChave(k => k + 1); onEnviada?.(); toast.success("Foto atualizada!"); }
    else toast.error("Erro ao enviar foto.");
  };

  return (
    <View style={{ width: size, height: size }}>
      <Avatar nome={nome} uri={pendenteUri || uri} size={size} />
      {editavel && (
        <Pressable onPress={escolher} style={{ position: "absolute", right: -2, bottom: -2, backgroundColor: c.green600, padding: 8, borderRadius: 999, borderWidth: 2, borderColor: "#fff" }}>
          <Icon name="camera" size={14} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

// Envia o arquivo como multipart, como o <input type="file"> do web
export async function enviarFoto(id, asset) {
  const fd = new FormData();
  fd.append("file", { uri: asset.uri, name: asset.fileName || "foto.jpg", type: asset.mimeType || "image/jpeg" });
  const r = await apiFetch(`/usuarios/${id}/imagem`, { method: "POST", body: fd }).catch(() => null);
  return !!r?.ok;
}
