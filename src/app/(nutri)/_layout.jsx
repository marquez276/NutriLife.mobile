import { RoleTabs } from "../../components/RoleTabs";

export default function NutriLayout() {
  return (
    <RoleTabs
      tipo="nutritionist"
      tabs={[
        { name: "nutricionista-portal", title: "Painel", icon: "home" },
        { name: "agenda-nutricionista", title: "Agenda", icon: "calendar" },
        { name: "perfil-nutricionista", title: "Perfil", icon: "user" },
      ]}
      hidden={["plano-personalizado"]}
    />
  );
}
