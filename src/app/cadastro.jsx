import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Button, Input, Segmented } from "../components/ui";
import { useApp } from "../context/AppContext";
import { apiFetch } from "../api";
import { toast } from "../toast";
import { guardarPrefill } from "../prefill";
import { dataParaIso, maskCpf, maskData, maskTelefone } from "../utils";
import { c } from "../theme";

export default function Cadastro() {
  const router = useRouter();
  const { cadastrarPaciente, cadastrarNutricionista, login } = useApp();
  const [aba, setAba] = useState("patient");
  const [enviando, setEnviando] = useState(false);

  const [paciente, setPaciente] = useState({ nome: "", email: "", senha: "", confirmar: "", cpf: "", dataNascimento: "", telefone: "" });
  const [nutri, setNutri] = useState({ nome: "", email: "", crn: "", especialidade: "", telefone: "", senha: "", confirmar: "" });
  const [crnStatus, setCrnStatus] = useState(null); // null | "ok" | "erro"

  const setP = (campo, mask) => (v) => setPaciente(p => ({ ...p, [campo]: mask ? mask(v) : v }));
  const setN = (campo, mask) => (v) => setNutri(n => ({ ...n, [campo]: mask ? mask(v) : v }));

  const verificarCrn = async (crn) => {
    if (!crn || crn.length < 4) { setCrnStatus(null); return; }
    try {
      const r = await apiFetch(`/admin/verificar-crn?crn=${encodeURIComponent(crn)}`);
      const data = await r.json();
      setCrnStatus(data.disponivel ? "ok" : "erro");
    } catch { setCrnStatus(null); }
  };

  const handlePaciente = async () => {
    const obrigatorios = [paciente.nome, paciente.cpf, paciente.dataNascimento, paciente.telefone, paciente.email, paciente.senha, paciente.confirmar];
    if (obrigatorios.some(v => !v)) { toast.error("Preencha todos os campos."); return; }
    if (paciente.cpf.replace(/\D/g, "").length !== 11) { toast.error("CPF inválido. Use o formato 000.000.000-00."); return; }
    if (paciente.telefone.replace(/\D/g, "").length < 10) { toast.error("Telefone inválido. Use o formato (00) 00000-0000."); return; }
    const dataIso = dataParaIso(paciente.dataNascimento);
    if (!dataIso) { toast.error("Data de nascimento inválida. Use DD/MM/AAAA."); return; }
    if (paciente.senha !== paciente.confirmar) { toast.error("As senhas não coincidem."); return; }

    setEnviando(true);
    const resultado = await cadastrarPaciente({
      nome: paciente.nome, email: paciente.email.trim(), senha: paciente.senha, cpf: paciente.cpf,
      dataNascimento: dataIso, telefone: paciente.telefone,
    });
    if (!resultado.ok) { setEnviando(false); toast.error(resultado.erro); return; }

    const loginResult = await login(paciente.email.trim(), paciente.senha, "patient");
    setEnviando(false);
    if (!loginResult.ok) {
      toast.error("Conta criada, mas erro ao fazer login. Tente entrar manualmente.");
      router.replace("/login");
      return;
    }
    toast.success("Conta criada! Preencha sua ficha de anamnese.");
    router.replace("/anamnese");
  };

  const handleNutri = async () => {
    const obrigatorios = [nutri.nome, nutri.email, nutri.crn, nutri.especialidade, nutri.telefone, nutri.senha, nutri.confirmar];
    if (obrigatorios.some(v => !v)) { toast.error("Preencha todos os campos."); return; }
    if (nutri.telefone.replace(/\D/g, "").length < 10) { toast.error("Telefone inválido. Use o formato (00) 00000-0000."); return; }
    if (nutri.senha !== nutri.confirmar) { toast.error("As senhas não coincidem."); return; }
    if (crnStatus === "erro") { toast.error("CRN já cadastrado no sistema."); return; }

    setEnviando(true);
    const resultado = await cadastrarNutricionista({
      nome: nutri.nome, email: nutri.email.trim(), crn: nutri.crn, especialidade: nutri.especialidade, telefone: nutri.telefone, senha: nutri.senha,
    });
    setEnviando(false);
    if (!resultado.ok) { toast.error(resultado.erro); return; }
    toast.success("Conta profissional criada!");
    // vai para o login já com e-mail e senha preenchidos (só desta vez)
    guardarPrefill(nutri.email.trim(), nutri.senha);
    router.replace({ pathname: "/login", params: { type: "nutritionist" } });
  };

  return (
    <Screen bg={c.green50}>
      <View style={{ alignItems: "center", marginTop: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: c.green600 }}>NutriLife</Text>
        <Text style={{ color: c.gray600, marginTop: 4 }}>Crie sua conta e comece sua transformação</Text>
      </View>

      <Card style={{ gap: 14, padding: 20 }}>
        <Text style={{ textAlign: "center", fontSize: 20, fontWeight: "800", color: c.gray900 }}>Criar Nova Conta</Text>
        <Segmented options={[{ value: "patient", label: "Paciente" }, { value: "nutritionist", label: "Nutricionista" }]} value={aba} onChange={setAba} />

        {aba === "patient" ? (
          <>
            <Input label="Nome Completo" placeholder="João Silva" value={paciente.nome} onChangeText={setP("nome")} autoCapitalize="words" />
            <Input label="CPF" placeholder="000.000.000-00" keyboardType="number-pad" value={paciente.cpf} onChangeText={setP("cpf", maskCpf)} />
            <Input label="Data de Nascimento" placeholder="DD/MM/AAAA" keyboardType="number-pad" value={paciente.dataNascimento} onChangeText={setP("dataNascimento", maskData)} />
            <Input label="Telefone" placeholder="(00) 00000-0000" keyboardType="phone-pad" value={paciente.telefone} onChangeText={setP("telefone", maskTelefone)} />
            <Input label="E-mail" placeholder="joao@email.com" keyboardType="email-address" autoCorrect={false} value={paciente.email} onChangeText={setP("email")} />
            <Input label="Senha" placeholder="••••••••" secureTextEntry value={paciente.senha} onChangeText={setP("senha")} />
            <Input label="Confirmar Senha" placeholder="••••••••" secureTextEntry value={paciente.confirmar} onChangeText={setP("confirmar")} />
            <Button title="Criar Conta" onPress={handlePaciente} loading={enviando} />
          </>
        ) : (
          <>
            <Input label="Nome Completo" placeholder="Dra. Maria Santos" value={nutri.nome} onChangeText={setN("nome")} autoCapitalize="words" />
            <Input label="E-mail" placeholder="maria@email.com" keyboardType="email-address" autoCorrect={false} value={nutri.email} onChangeText={setN("email")} />
            <Input
              label="CRN" placeholder="12345/P" value={nutri.crn} error={crnStatus === "erro"} ok={crnStatus === "ok"}
              hint={crnStatus === "erro" ? "CRN já cadastrado." : crnStatus === "ok" ? "CRN disponível." : undefined}
              onChangeText={(v) => { setN("crn")(v); verificarCrn(v); }}
            />
            <Input label="Especialidade" placeholder="Ex: Nutrição Esportiva" value={nutri.especialidade} onChangeText={setN("especialidade")} />
            <Input label="Telefone" placeholder="(00) 00000-0000" keyboardType="phone-pad" value={nutri.telefone} onChangeText={setN("telefone", maskTelefone)} />
            <Input label="Senha" placeholder="••••••••" secureTextEntry value={nutri.senha} onChangeText={setN("senha")} />
            <Input label="Confirmar Senha" placeholder="••••••••" secureTextEntry value={nutri.confirmar} onChangeText={setN("confirmar")} />
            <Button title="Criar Conta Profissional" onPress={handleNutri} loading={enviando} />
          </>
        )}

        <Text style={{ textAlign: "center", color: c.gray600 }}>
          Já tem uma conta? <Text onPress={() => router.replace("/login")} style={{ color: c.green600, fontWeight: "700" }}>Faça login</Text>
        </Text>
      </Card>
      <Text onPress={() => router.replace("/")} style={{ textAlign: "center", color: c.gray600 }}>← Voltar para a página inicial</Text>
    </Screen>
  );
}
