import { RoleTabs } from "../../components/RoleTabs";

export default function PatientLayout() {
  return (
    <RoleTabs
      tipo="patient"
      tabs={[
        { name: "dashboard", title: "Jornada", icon: "home" },
        { name: "plano-alimentar", title: "Plano", icon: "coffee" },
        { name: "calorias", title: "Calorias", icon: "target" },
        { name: "evolucao", title: "Evolução", icon: "trending-down" },
        { name: "mais", title: "Mais", icon: "menu" },
      ]}
      hidden={["alimentos", "nutricionistas", "agenda", "consultas", "perfil", "loja"]}
    />
  );
}
