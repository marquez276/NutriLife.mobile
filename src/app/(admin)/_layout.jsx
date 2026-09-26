import { RoleTabs } from "../../components/RoleTabs";

export default function AdminLayout() {
  return (
    <RoleTabs
      tipo="admin"
      tabs={[
        { name: "admin", title: "Painel", icon: "shield" },
        { name: "gerenciar-alimentos", title: "Alimentos", icon: "database" },
        { name: "cadastro-funcionario", title: "Funcionários", icon: "user-plus" },
        { name: "perfil-admin", title: "Perfil", icon: "user" },
      ]}
    />
  );
}
