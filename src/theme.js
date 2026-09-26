// Mesma paleta do web (Tailwind): verde como cor principal.
export const c = {
  green50: "#f0fdf4", green100: "#dcfce7", green200: "#bbf7d0", green500: "#22c55e", green600: "#16a34a", green700: "#15803d",
  gray50: "#f9fafb", gray100: "#f3f4f6", gray200: "#e5e7eb", gray300: "#d1d5db", gray400: "#9ca3af", gray500: "#6b7280",
  gray600: "#4b5563", gray700: "#374151", gray900: "#111827",
  blue50: "#eff6ff", blue100: "#dbeafe", blue600: "#2563eb", blue700: "#1d4ed8",
  orange50: "#fff7ed", orange100: "#ffedd5", orange600: "#ea580c",
  purple50: "#faf5ff", purple100: "#f3e8ff", purple600: "#9333ea",
  amber50: "#fffbeb", amber100: "#fef3c7", amber200: "#fde68a", amber600: "#d97706", amber900: "#78350f",
  red50: "#fef2f2", red100: "#fee2e2", red500: "#ef4444", red600: "#dc2626", red700: "#b91c1c",
  yellow400: "#facc15", indigo50: "#eef2ff", indigo600: "#4f46e5", teal50: "#f0fdfa",
  white: "#ffffff",
};

// pares [fundo, texto] usados em badges/ícones
export const tons = {
  green: [c.green100, c.green700],
  blue: [c.blue100, c.blue700],
  amber: [c.amber100, c.amber600],
  red: [c.red100, c.red700],
  gray: [c.gray100, c.gray700],
  purple: [c.purple100, c.purple600],
  orange: [c.orange100, c.orange600],
};

export const HOME = { patient: "/dashboard", nutritionist: "/nutricionista-portal", admin: "/admin" };
