import { useState } from "react";
import { Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Screen, Card, Button, Input, Select, CheckList, Icon, Row } from "../components/ui";
import { useApp } from "../context/AppContext";
import { toast } from "../toast";
import { ATIVIDADES, COMORBIDADES, HORAS_SONO, OBJETIVOS, RESTRICOES, alternarItem } from "../utils";
import { HOME, c } from "../theme";

const SEXOS = [{ value: "masculino", label: "Masculino" }, { value: "feminino", label: "Feminino" }];

export default function FichaAnamnese() {
  const router = useRouter();
  const { salvarAnamnese, anamnese, usuarioLogado } = useApp();
  const [step, setStep] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    peso: "", altura: "", idade: "", objetivo: "", sexo: "",
    comorbidades: [], restricoes: [], nivelAtividade: "", horasSono: "",
  });
  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  // Só paciente sem ficha preenche a anamnese
  if (!usuarioLogado) return <Redirect href="/login" />;
  if (usuarioLogado.tipo !== "patient") return <Redirect href={HOME[usuarioLogado.tipo]} />;
  if (anamnese?.id) return <Redirect href="/dashboard" />;

  const handleNext = async () => {
    if (step === 1) {
      if (!form.peso || !form.altura || !form.idade || !form.objetivo || !form.sexo) { toast.error("Preencha todos os campos do Passo 1."); return; }
      const idade = parseInt(form.idade);
      if (isNaN(idade) || idade < 1 || idade > 120) { toast.error("Idade deve ser entre 1 e 120 anos."); return; }
    }
    if (step === 3 && (!form.nivelAtividade || !form.horasSono)) { toast.error("Preencha o nível de atividade e as horas de sono."); return; }
    if (step < 3) { setStep(step + 1); return; }

    setSalvando(true);
    const ok = await salvarAnamnese({ ...form, comorbidades: form.comorbidades.join(", "), restricoes: form.restricoes.join(", ") });
    setSalvando(false);
    if (!ok) return;
    toast.success("Ficha preenchida! Bem-vindo ao NutriLife.");
    router.replace("/dashboard");
  };

  const titulo = step === 1 ? ["user", "Passo 1: Dados Físicos"] : step === 2 ? ["activity", "Passo 2: Saúde e Restrições"] : ["moon", "Passo 3: Estilo de Vida"];

  return (
    <Screen>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ backgroundColor: c.green600, padding: 24, gap: 6 }}>
          <Row style={{ gap: 10 }}>
            <Icon name="clipboard" size={28} color="#fff" />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>Ficha de Anamnese</Text>
          </Row>
          <Text style={{ color: c.green50 }}>Complete sua ficha para liberar o acesso ao sistema.</Text>
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[1, 2, 3].map(n => <View key={n} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: n <= step ? c.green600 : c.gray200 }} />)}
          </View>
          <Row><Icon name={titulo[0]} size={18} color={c.green700} /><Text style={{ color: c.green700, fontWeight: "700" }}>{titulo[1]}</Text></Row>

          {step === 1 && (
            <View style={{ gap: 14 }}>
              <Input label="Peso Atual (kg)" placeholder="75.5" keyboardType="decimal-pad" value={form.peso} onChangeText={v => set("peso", v.replace(",", "."))} />
              <Input label="Altura (cm)" placeholder="175" keyboardType="number-pad" value={form.altura} onChangeText={v => set("altura", v)} />
              <Input
                label="Idade" placeholder="25" keyboardType="number-pad" hint="Máximo: 120 anos" value={form.idade}
                onChangeText={v => { const n = parseInt(v); if (v === "" || (n >= 1 && n <= 120)) set("idade", v); }}
              />
              <Select label="Sexo Biológico" value={form.sexo} options={SEXOS} onChange={v => set("sexo", v)} />
              <Select label="Objetivo Principal" value={form.objetivo} options={OBJETIVOS} onChange={v => set("objetivo", v)} />
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 18 }}>
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: c.gray900 }}>Comorbidades / Problemas de Saúde</Text>
                <CheckList options={COMORBIDADES} values={form.comorbidades} onToggle={i => set("comorbidades", alternarItem(form.comorbidades, i))} />
              </View>
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: c.gray900 }}>Restrições Alimentares / Alergias</Text>
                <CheckList options={RESTRICOES} values={form.restricoes} onToggle={i => set("restricoes", alternarItem(form.restricoes, i))} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 14 }}>
              <Select label="Nível de Atividade Física" placeholder="Como é sua rotina?" value={form.nivelAtividade} options={ATIVIDADES} onChange={v => set("nivelAtividade", v)} />
              <Select label="Horas de Sono por Noite" value={form.horasSono} options={HORAS_SONO} onChange={v => set("horasSono", v)} />
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10, paddingTop: 8 }}>
            {step > 1 && <Button title="Voltar" variant="outline" style={{ flex: 1 }} onPress={() => setStep(step - 1)} />}
            <Button title={step === 3 ? "Finalizar" : "Próximo Passo"} style={{ flex: 1 }} onPress={handleNext} loading={salvando} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
