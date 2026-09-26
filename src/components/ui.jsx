import { useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { c, tons } from "../theme";
import { iniciais } from "../utils";

// ── Layout ──────────────────────────────────────────────────────────
// Tela padrão: cabeçalho de página (título + subtítulo) e conteúdo rolável com pull-to-refresh opcional.
export function Screen({ title, subtitle, right, children, onRefresh, scroll = true, bg = c.gray50, back }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const atualizar = async () => { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } };
  const voltar = back ? (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(back))} style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" }} hitSlop={8}>
      <Icon name="chevron-left" size={20} color={c.green600} />
      <Text style={{ color: c.green600, fontWeight: "600" }}>Voltar</Text>
    </Pressable>
  ) : null;
  const cabecalho = title ? (
    <View style={s.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.h1}>{title}</Text>
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  ) : null;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={atualizar} tintColor={c.green600} colors={[c.green600]} /> : undefined}
          >
            {voltar}
            {cabecalho}
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: 16, gap: 16 }}>{voltar}{cabecalho}{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, accent }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={[s.card, accent && { borderLeftWidth: 4, borderLeftColor: accent }, style]}>
      {children}
    </Comp>
  );
}

export const CardTitle = ({ children, icon, style }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
    {icon ? <Icon name={icon} size={18} color={c.green600} /> : null}
    <Text style={[s.cardTitle, style]}>{children}</Text>
  </View>
);

export const Row = ({ children, style }) => <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}>{children}</View>;

export const Icon = ({ name, size = 20, color = c.gray600 }) => <Feather name={name} size={size} color={color} />;

export const Empty = ({ text, icon }) => (
  <View style={s.empty}>
    {icon ? <Icon name={icon} size={36} color={c.gray300} /> : null}
    <Text style={{ color: c.gray400, textAlign: "center" }}>{text}</Text>
  </View>
);

// ── Botões ──────────────────────────────────────────────────────────
const BTN = {
  primary: { bg: c.green600, fg: "#fff", border: c.green600 },
  blue: { bg: c.blue600, fg: "#fff", border: c.blue600 },
  outline: { bg: "#fff", fg: c.gray700, border: c.gray200 },
  outlineGreen: { bg: "#fff", fg: c.green600, border: c.green600 },
  danger: { bg: "#fff", fg: c.red600, border: c.red100 },
  ghost: { bg: "transparent", fg: c.gray500, border: "transparent" },
  dark: { bg: c.gray900, fg: "#fff", border: c.gray900 },
  white: { bg: "#fff", fg: c.green600, border: "#fff" },
};

export function Button({ title, onPress, variant = "primary", icon, disabled, loading, small, style, iconOnly }) {
  const v = BTN[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall, iconOnly && { paddingHorizontal: 10 },
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={v.fg} /> : icon ? <Icon name={icon} size={small ? 14 : 16} color={v.fg} /> : null}
      {title ? <Text style={[s.btnText, small && { fontSize: 13 }, { color: v.fg }]}>{title}</Text> : null}
    </Pressable>
  );
}

// ── Formulário ──────────────────────────────────────────────────────
export function Field({ label, hint, children, style }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      {children}
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Input({ label, hint, readOnly, error, ok, multiline, style, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <TextInput
        editable={!readOnly}
        multiline={multiline}
        placeholderTextColor={c.gray400}
        autoCapitalize={props.keyboardType === "email-address" || props.secureTextEntry ? "none" : props.autoCapitalize}
        style={[
          s.input, multiline && { minHeight: 90, textAlignVertical: "top" },
          readOnly && { backgroundColor: c.gray50, color: c.gray500 },
          error && { borderColor: c.red500 }, ok && { borderColor: c.green500 }, style,
        ]}
        {...props}
      />
    </Field>
  );
}

// Lista de opções em modal (equivalente ao <Select> do web)
export function Select({ label, value, options, onChange, placeholder = "Selecione", readOnly }) {
  const [aberto, setAberto] = useState(false);
  const atual = options.find(o => String(o.value) === String(value));
  return (
    <Field label={label}>
      <Pressable disabled={readOnly} onPress={() => setAberto(true)} style={[s.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, readOnly && { backgroundColor: c.gray50 }]}>
        <Text style={{ color: atual ? (readOnly ? c.gray500 : c.gray900) : c.gray400, flex: 1 }} numberOfLines={1}>{atual ? atual.label : placeholder}</Text>
        {!readOnly && <Icon name="chevron-down" size={18} color={c.gray400} />}
      </Pressable>
      <Sheet visible={aberto} onClose={() => setAberto(false)} title={label || placeholder}>
        {options.map(o => (
          <Pressable key={o.value} onPress={() => { onChange(o.value); setAberto(false); }} style={[s.option, String(o.value) === String(value) && { backgroundColor: c.green50 }]}>
            <Text style={{ color: c.gray900, fontSize: 16, flex: 1 }}>{o.label}</Text>
            {String(o.value) === String(value) && <Icon name="check" size={18} color={c.green600} />}
          </Pressable>
        ))}
      </Sheet>
    </Field>
  );
}

export function CheckList({ options, values, onToggle }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => {
        const on = values.includes(o);
        return (
          <Pressable key={o} onPress={() => onToggle(o)} style={[s.chip, on && { backgroundColor: c.green600, borderColor: c.green600 }]}>
            {on && <Icon name="check" size={14} color="#fff" />}
            <Text style={{ color: on ? "#fff" : c.gray700, fontSize: 13, fontWeight: "500" }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={s.segmented}>
      {options.map(o => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segItem, value === o.value && s.segOn]}>
          <Text style={{ fontWeight: "600", fontSize: 13, color: value === o.value ? c.gray900 : c.gray500 }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Switch2({ value, onChange }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: value ? c.green600 : c.gray300, padding: 3 }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", marginLeft: value ? 18 : 0 }} />
    </Pressable>
  );
}

// ── Modal (bottom sheet) ────────────────────────────────────────────
export function Sheet({ visible, onClose, title, children, footer, full }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={[s.sheet, full && { height: "92%" }]}>
          <View style={s.sheetHead}>
            <Text style={[s.cardTitle, { flex: 1 }]} numberOfLines={1}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Icon name="x" size={22} color={c.gray500} /></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>{children}</ScrollView>
          {footer ? <View style={s.sheetFoot}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Dados ───────────────────────────────────────────────────────────
export function Badge({ text, tone = "green", icon, style }) {
  const [bg, fg] = tons[tone] || tons.gray;
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }, style]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 12, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}

export function Progress({ value }) {
  return (
    <View style={{ height: 12, backgroundColor: c.gray100, borderRadius: 6, overflow: "hidden" }}>
      <View style={{ height: 12, width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: c.green600, borderRadius: 6 }} />
    </View>
  );
}

export function Avatar({ nome, uri, size = 48, bg = c.green100, fg = c.green700 }) {
  const [falhou, setFalhou] = useState(false);
  if (uri && !falhou) return <Image source={{ uri }} onError={() => setFalhou(true)} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.gray100 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: size / 2.8 }}>{iniciais(nome)}</Text>
    </View>
  );
}

const STAT = {
  green: [c.green50, c.green600], blue: [c.blue50, c.blue600], orange: [c.orange50, c.orange600],
  purple: [c.purple50, c.purple600], amber: [c.amber50, c.amber600], red: [c.red50, c.red600],
  indigo: [c.indigo50, c.indigo600], teal: [c.teal50, "#0d9488"],
};

export function StatCard({ icon, label, value, subtext, color = "green", style }) {
  const [bg, fg] = STAT[color];
  return (
    <Card style={[{ flex: 1, minWidth: "45%" }, style]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.hint}>{label}</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: c.gray900, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          {subtext ? <Text style={s.hint}>{subtext}</Text> : null}
        </View>
        <View style={{ backgroundColor: bg, borderRadius: 10, padding: 10, alignSelf: "flex-start" }}>
          <Icon name={icon} size={20} color={fg} />
        </View>
      </View>
    </Card>
  );
}

export const Stars = ({ rating, size = 14 }) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => <FontStar key={i} on={i <= Math.round(rating)} size={size} />)}
  </View>
);
const FontStar = ({ on, size }) => <Icon name="star" size={size} color={on ? c.yellow400 : c.gray200} />;

export const Grid2 = ({ children, gap = 12 }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>{children}</View>;

export const s = StyleSheet.create({
  pageHeader: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  h1: { fontSize: 26, fontWeight: "800", color: c.gray900 },
  sub: { color: c.gray500, marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: c.gray900 },
  label: { fontSize: 13, fontWeight: "600", color: c.gray700 },
  hint: { fontSize: 12, color: c.gray500 },
  input: { borderWidth: 1, borderColor: c.gray200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: c.gray900, backgroundColor: "#fff" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", gap: 8, padding: 28 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: c.gray200, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#fff" },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10 },
  segmented: { flexDirection: "row", backgroundColor: c.gray100, borderRadius: 12, padding: 4 },
  segItem: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9 },
  segOn: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%" },
  sheetHead: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: c.gray100 },
  sheetFoot: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: c.gray100 },
});
