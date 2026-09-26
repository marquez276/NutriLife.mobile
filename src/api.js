// Único ponto de acesso ao token JWT e às chamadas HTTP autenticadas do app (mesma API do web).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

const TOKEN_KEY = "nutrilife_token";
const SESSAO_KEY = "nutrilife_sessao";

let token = null; // cópia em memória para o apiFetch não precisar esperar o AsyncStorage
let aoExpirar = () => {};

export const getToken = () => token;

export async function setToken(novo) {
  token = novo || null;
  if (novo) await AsyncStorage.setItem(TOKEN_KEY, novo);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

// true se o token existe e ainda não expirou (lê o "exp" do payload; a validação real é do backend)
function tokenValido(t) {
  if (!t) return false;
  try {
    const { exp } = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !exp || exp * 1000 > Date.now();
  } catch { return false; }
}

export async function limparSessao() {
  await setToken(null);
  await AsyncStorage.removeItem(SESSAO_KEY);
}

export async function salvarSessao(sessao) {
  await AsyncStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
}

// Restaura a sessão salva; só vale com JWT não expirado
export async function carregarSessao() {
  const t = await AsyncStorage.getItem(TOKEN_KEY);
  if (!tokenValido(t)) { await limparSessao(); return null; }
  token = t;
  const raw = await AsyncStorage.getItem(SESSAO_KEY);
  return raw ? JSON.parse(raw) : null;
}

export const registrarAoExpirar = (fn) => { aoExpirar = fn; };

export const urlCompleta = (url) => (url.startsWith("http") ? url : `${API_URL}${url}`);

export const urlImagemUsuario = (id) => `${API_URL}/usuarios/${id}/imagem?t=${Date.now()}`;

// fetch que envia "Authorization: Bearer <token>" quando há token. Se o backend responder 401 com um
// token enviado, a sessão expirou/foi revogada: limpa tudo e avisa o app para voltar ao login.
// O /auth/login nunca leva token: um token velho faria o 401 do login parecer sessão expirada.
export async function apiFetch(url, options = {}) {
  const enviar = url.includes("/auth/login") ? null : token;
  const headers = new Headers(options.headers);
  if (enviar) headers.set("Authorization", `Bearer ${enviar}`);

  const res = await fetch(urlCompleta(url), { ...options, headers });

  if (res.status === 401 && enviar) {
    await limparSessao();
    aoExpirar();
  }
  return res;
}

// apiFetch + JSON: devolve o corpo já convertido ou lança Error com a mensagem do backend.
export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro ao comunicar com o servidor.");
  return data;
}

export const JSON_HEADERS = { "Content-Type": "application/json" };
