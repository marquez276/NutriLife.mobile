import { Linking } from "react-native";

export function maskCpf(v) {
  return v.replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskTelefone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1");
  if (d.length <= 7) return d.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function maskData(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function maskHora(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

// DD/MM/AAAA → AAAA-MM-DD (null se incompleta)
export function dataParaIso(v) {
  const parts = (v || "").split("/");
  if (parts.length !== 3 || parts[2].length !== 4 || parts[0].length !== 2 || parts[1].length !== 2) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// AAAA-MM-DD[...] → DD/MM/AAAA
export function isoParaDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("T")[0].split("-");
  return y && m && d ? `${d}/${m}/${y}` : String(iso);
}

const pad = (n) => String(n).padStart(2, "0");

// Datas em horário local (o web usava UTC, que vira "amanhã" à noite no Brasil)
export const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hojeIso = () => isoDe(new Date());
export const horaAgora = () => `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;

export function iniciais(nome) {
  if (!nome) return "?";
  return nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

export const brl = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

export const abrirUrl = (url) => Linking.openURL(url).catch(() => {});

export const strToList = (s) => (s ? s.split(",").map(x => x.trim()).filter(Boolean) : []);

// marcar "Nenhuma" desmarca o resto; marcar outro tira "Nenhuma"
export function alternarItem(lista, item) {
  if (item === "Nenhuma") return lista.includes("Nenhuma") ? [] : ["Nenhuma"];
  const sem = lista.filter(v => v !== "Nenhuma");
  return sem.includes(item) ? sem.filter(v => v !== item) : [...sem, item];
}

export const COMORBIDADES = [
  "Diabetes tipo 1", "Diabetes tipo 2", "Hipertensão arterial", "Colesterol alto", "Triglicerídeos altos",
  "Hipotireoidismo", "Hipertireoidismo", "Obesidade", "Síndrome metabólica", "Doença celíaca",
  "Intolerância à lactose", "Anemia", "Nenhuma",
];

export const RESTRICOES = [
  "Lactose", "Glúten", "Frutos do mar", "Amendoim", "Ovos", "Soja", "Nozes e castanhas",
  "Vegano", "Vegetariano", "Ovolactovegetariano", "Nenhuma",
];

export const OBJETIVOS = [
  { value: "EMAGRECIMENTO", label: "Emagrecimento" },
  { value: "HIPERTROFIA", label: "Ganho de Massa" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "PERFORMANCE", label: "Performance" },
];

export const ATIVIDADES = [
  { value: "sedentario", label: "Sedentário" },
  { value: "leve", label: "Leve (1–3x/semana)" },
  { value: "moderado", label: "Moderado (3–5x/semana)" },
  { value: "intenso", label: "Intenso (6–7x/semana)" },
];

export const HORAS_SONO = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} ${i === 0 ? "hora" : "horas"}` }));
