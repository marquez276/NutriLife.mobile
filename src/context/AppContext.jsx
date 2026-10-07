import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "../toast";
import { hojeIso } from "../utils";
import {
  JSON_HEADERS, apiFetch, carregarSessao, getToken, limparSessao, registrarAoExpirar, salvarSessao, setToken, urlCompleta,
} from "../api";

// Mesma lógica do AppContext do web; troca localStorage por AsyncStorage e usa a mesma API.
const AppContext = createContext(null);

async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
const save = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

// Revoga um JWT no backend (melhor esforço)
const revogarToken = (token) => token && fetch(urlCompleta("/auth/logout"), { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});

const tryParseJson = (str, fallback) => { try { return JSON.parse(str); } catch { return fallback; } };

export function AppProvider({ children }) {
  const [pronto, setPronto] = useState(false); // sessão salva já foi lida?
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [anamnese, setAnamneseState] = useState(null);
  const [anamneseCarregada, setAnamneseCarregada] = useState(false); // já tentou buscar a ficha? (evita mandar para a anamnese antes da resposta)
  const [refeicoes, setRefeicoesState] = useState([]);
  const [pesagens, setPesagensState] = useState([]);
  const [agendamentos, setAgendamentosState] = useState([]);
  const [vinculos, setVinculosState] = useState([]);
  const [pacientesExternos, setPacientesExternosState] = useState([]);
  const [nutricionistas, setNutricionistasState] = useState([]);
  const [metas, setMetasState] = useState(null);

  function limparEstado() {
    setUsuarioLogado(null);
    setAnamneseState(null);
    setAnamneseCarregada(false);
    setRefeicoesState([]);
    setPesagensState([]);
    setAgendamentosState([]);
    setVinculosState([]);
    setPacientesExternosState([]);
    setNutricionistasState([]);
    setMetasState(null);
  }

  // Restaura a sessão ao abrir o app; se o backend devolver 401 no meio do uso, volta ao login
  useEffect(() => {
    registrarAoExpirar(() => { limparEstado(); toast.error("Sua sessão expirou. Faça login novamente."); });
    carregarSessao().then(sessao => { setUsuarioLogado(sessao); setPronto(true); });
  }, []);

  function atualizarUsuarioLogado(campos) {
    setUsuarioLogado(prev => {
      const atualizado = { ...prev, ...campos };
      salvarSessao(atualizado);
      return atualizado;
    });
  }

  function carregarMetas(id) {
    return apiFetch(`/anamnese/cliente/${id}/metas`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setMetasState(d); })
      .catch(() => {});
  }

  function carregarNutricionistas() {
    apiFetch("/nutricionistas/perfis")
      .then(r => r.json())
      .then(perfis => {
        if (!Array.isArray(perfis)) return;
        const lista = perfis.map(p => ({
          id: p.nutricionista?.id,
          nome: p.nutricionista?.nomeCompleto || p.nutricionista?.nome || "",
          email: p.nutricionista?.email || "",
          crn: p.nutricionista?.crn || "",
          telefone: p.nutricionista?.telefone || "",
          fotoUrl: p.nutricionista?.id ? urlCompleta(`/usuarios/${p.nutricionista.id}/imagem`) : null,
          specialty: p.especialidade || p.nutricionista?.especialidade || "",
          bio: p.bio || "",
          whatsapp: p.whatsapp || "",
          instagram: p.instagram || "",
          linkedin: p.linkedin || "",
          website: p.website || "",
          precos: p.precos ? tryParseJson(p.precos, []) : [],
          experiencia: p.experiencia ? p.experiencia.split("\n").filter(Boolean) : [],
          portfolio: p.portfolio ? p.portfolio.split("\n").filter(Boolean) : [],
          videos: p.videos ? p.videos.split("\n").filter(Boolean) : [],
          reviews: [],
        }));
        setNutricionistasState(lista);
        lista.forEach(n => {
          apiFetch(`/avaliacoes/nutricionista/${n.id}`)
            .then(r => r.json())
            .then(avs => {
              if (!Array.isArray(avs)) return;
              setNutricionistasState(prev => prev.map(x =>
                x.id === n.id
                  ? {
                      ...x,
                      reviews: avs.map(a => ({ id: a.id, userName: a.clienteNome || "Paciente", rating: a.nota, comment: a.comentario, date: a.dataAvaliacao })),
                      rating: avs.length ? avs.reduce((sum, a) => sum + a.nota, 0) / avs.length : 0,
                    }
                  : x
              ));
            })
            .catch(() => {});
        });
      })
      .catch(() => {});
  }

  function carregarRefeicoes(id) {
    return apiFetch(`/registros/refeicoes/${id}`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => { setRefeicoesState(Array.isArray(d) ? d : []); save(`refeicoes_data_${id}`, hojeIso()); })
      .catch(() => setRefeicoesState([]));
  }

  async function carregarDadosPaciente(id) {
    const aRes = await apiFetch(`/anamnese/cliente/${id}`).catch(() => null);
    if (aRes && aRes.ok) {
      const d = await aRes.json();
      setAnamneseState(d);
      save(`anamnese_${id}`, d);
    } else {
      setAnamneseState(await load(`anamnese_${id}`, null));
    }
    setAnamneseCarregada(true);
    carregarRefeicoes(id);
    apiFetch(`/clientes/${id}/progresso`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return;
        setPesagensState(Array.isArray(d.historico) ? d.historico : []);
        setMetasState(prev => ({ ...prev, pesoInicial: d.pesoInicial, pesoIdeal: d.pesoIdeal, imc: d.imc, statusPeso: d.statusPeso }));
      })
      .catch(() => {
        apiFetch(`/registros/pesagens/${id}`)
          .then(r => r.json()).then(d => setPesagensState(Array.isArray(d) ? d : []))
          .catch(() => setPesagensState([]));
      });
    carregarMetas(id);
    apiFetch(`/consultas/cliente/${id}`)
      .then(r => r.json()).then(d => setAgendamentosState(Array.isArray(d) ? d : []))
      .catch(() => setAgendamentosState([]));
  }

  // ── Carrega dados conforme o tipo de usuário (ao abrir o app ou logar) ──
  const uid = usuarioLogado?.id;
  const tipo = usuarioLogado?.tipo;
  useEffect(() => {
    if (!uid) return;
    if (tipo === "patient") carregarDadosPaciente(uid);
    if (tipo === "nutritionist") {
      apiFetch(`/consultas/nutricionista/${uid}`)
        .then(r => r.json()).then(d => setAgendamentosState(Array.isArray(d) ? d : []))
        .catch(() => setAgendamentosState([]));
      carregarPacientesExternos(uid);
    }
    if (tipo === "patient" || tipo === "nutritionist") carregarVinculos(uid, tipo);
    carregarNutricionistas();
  }, [uid, tipo]);

  // ── Reset diário de calorias à meia-noite ─────────────────────────
  useEffect(() => {
    if (tipo !== "patient" || !uid) return;
    load(`refeicoes_data_${uid}`, null).then(ultima => { if (ultima && ultima !== hojeIso()) carregarRefeicoes(uid); });
    const agora = new Date();
    const meianoite = new Date(agora);
    meianoite.setHours(24, 0, 0, 0);
    const timer = setTimeout(() => carregarRefeicoes(uid), meianoite - agora);
    return () => clearTimeout(timer);
  }, [uid, tipo]);

  // ── Auth ──────────────────────────────────────────────────────────
  async function login(email, senha, tipoEsperado) {
    try {
      const res = await apiFetch("/auth/login", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ email, senha }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, erro: err.message || "E-mail ou senha incorretos." };
      }
      const { usuario, access_token } = await res.json();

      let tipoMapeado;
      if (usuario.tipoUsuario === "ADMIN") tipoMapeado = "admin";
      else if (usuario.tipoUsuario === "NUTRICIONISTA") tipoMapeado = "nutritionist";
      else tipoMapeado = "patient";

      if (tipoEsperado && tipoEsperado !== tipoMapeado) {
        revogarToken(access_token);
        return { ok: false, erro: "Este e-mail pertence a outro tipo de conta. Selecione a aba correta." };
      }

      await setToken(access_token);
      const sessao = { ...usuario, nome: usuario.nomeCompleto, tipo: tipoMapeado };
      await salvarSessao(sessao);

      let hasAnamnese = true;
      if (tipoMapeado === "patient") {
        const aRes = await apiFetch(`/anamnese/cliente/${sessao.id}`).catch(() => null);
        hasAnamnese = !!(aRes && aRes.ok);
        if (hasAnamnese) setAnamneseState(await aRes.json());
        else setAnamneseState(null);
        setAnamneseCarregada(true);
      }
      setUsuarioLogado(sessao); // dispara o carregamento dos demais dados
      return { ok: true, tipo: tipoMapeado, hasAnamnese };
    } catch {
      return { ok: false, erro: "Erro ao conectar com o servidor." };
    }
  }

  async function logout() {
    revogarToken(getToken());
    await limparSessao();
    limparEstado();
  }

  // ── Cadastro ──────────────────────────────────────────────────────
  async function cadastrarPaciente(d) {
    try {
      const res = await apiFetch("/usuarios/paciente", {
        method: "POST", headers: JSON_HEADERS,
        body: JSON.stringify({ nomeCompleto: d.nome, email: d.email, senha: d.senha, telefone: d.telefone || null, cpf: d.cpf || null, dataNascimento: d.dataNascimento || null }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, erro: err.message || "Erro ao criar conta." }; }
      return { ok: true, usuario: await res.json() };
    } catch { return { ok: false, erro: "Erro ao conectar com o servidor." }; }
  }

  async function cadastrarNutricionista(d) {
    try {
      const res = await apiFetch("/usuarios/nutricionista", {
        method: "POST", headers: JSON_HEADERS,
        body: JSON.stringify({ nomeCompleto: d.nome, email: d.email, senha: d.senha, telefone: d.telefone, crn: d.crn, especialidade: d.especialidade }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, erro: err.message || "Erro ao criar conta." }; }
      return { ok: true };
    } catch { return { ok: false, erro: "Erro ao conectar com o servidor." }; }
  }

  // ── Anamnese ──────────────────────────────────────────────────────
  async function salvarAnamnese(d) {
    const id = usuarioLogado?.id;
    if (!id) { setAnamneseState(d); return false; }
    try {
      const res = await apiFetch("/anamnese", {
        method: "POST", headers: JSON_HEADERS,
        body: JSON.stringify({
          peso: parseFloat(d.peso) || 0,
          altura: parseFloat(d.altura) || 0,
          idade: parseInt(d.idade) || null,
          sexo: d.sexo === "masculino" ? "M" : "F",
          objetivo: d.objetivo,
          atividade: d.nivelAtividade || d.atividade || "sedentario",
          sono: parseInt(d.horasSono || d.sono) || null,
          comorbidades: d.comorbidades || null,
          restricoes: d.restricoes || null,
          cliente: { id },
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); toast.error(err.message || "Erro ao salvar anamnese."); return false; }
      const salvo = await res.json();
      setAnamneseState(salvo);
      save(`anamnese_${id}`, salvo);
      carregarMetas(id);
      return true;
    } catch { toast.error("Erro ao conectar com o servidor."); return false; }
  }

  // ── Refeições ─────────────────────────────────────────────────────
  async function adicionarRefeicao(refeicao) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch("/registros/refeicoes", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ...refeicao, cliente: { id: usuarioLogado.id } }) });
      if (!res.ok) throw new Error(res.status);
      const salva = await res.json();
      setRefeicoesState(prev => [...prev, salva]);
    } catch { toast.error("Não foi possível salvar. Tente novamente."); }
  }
  async function editarRefeicao(id, dados) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch(`/registros/refeicoes/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(dados) });
      if (!res.ok) throw new Error(res.status);
      const atualizada = await res.json();
      setRefeicoesState(prev => prev.map(r => (r.id === id ? atualizada : r)));
    } catch { toast.error("Não foi possível salvar. Tente novamente."); }
  }
  async function removerRefeicao(id) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch(`/registros/refeicoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(res.status);
    } catch { toast.error("Não foi possível remover. Tente novamente."); return; }
    setRefeicoesState(prev => prev.filter(r => r.id !== id));
  }

  // ── Pesagens ──────────────────────────────────────────────────────
  async function adicionarPesagem(pesagem) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch("/registros/pesagens", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ...pesagem, cliente: { id: usuarioLogado.id } }) });
      if (!res.ok) throw new Error(res.status);
      const salva = await res.json();
      setPesagensState(prev => [...prev, salva]);
      carregarMetas(usuarioLogado.id);
    } catch { toast.error("Não foi possível salvar. Tente novamente."); }
  }
  async function removerPesagem(id) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch(`/registros/pesagens/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(res.status);
    } catch { toast.error("Não foi possível remover. Tente novamente."); return; }
    setPesagensState(prev => prev.filter(p => p.id !== id));
    carregarMetas(usuarioLogado.id);
  }

  // ── Agenda ────────────────────────────────────────────────────────
  const corpoAgendamento = (ag) => ({
    date: ag.date,
    time: ag.time,
    videoLink: ag.videoLink || null,
    observations: ag.observations || null,
    paciente: ag.paciente || null,
    nutritionist: ag.nutritionist || null,
    clienteId: usuarioLogado.tipo === "patient" ? usuarioLogado.id : null,
    nutricionistaId: usuarioLogado.tipo === "nutritionist" ? usuarioLogado.id : null,
  });
  async function adicionarAgendamento(ag) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch("/consultas", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(corpoAgendamento(ag)) });
      if (!res.ok) throw new Error(res.status);
      const salvo = await res.json();
      setAgendamentosState(prev => [...prev, salvo]);
    } catch { toast.error("Não foi possível salvar. Tente novamente."); }
  }
  async function editarAgendamento(id, dados) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch(`/consultas/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(corpoAgendamento(dados)) });
      if (!res.ok) throw new Error(res.status);
      const atualizada = await res.json();
      setAgendamentosState(prev => prev.map(a => (a.id === id ? atualizada : a)));
    } catch { toast.error("Não foi possível salvar. Tente novamente."); }
  }
  async function removerAgendamento(id) {
    try {
      const res = await apiFetch(`/consultas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(res.status);
    } catch { toast.error("Não foi possível remover. Tente novamente."); return; }
    setAgendamentosState(prev => prev.filter(a => a.id !== id));
  }

  // ── Vínculo paciente ↔ nutricionista ────────────────────────────────
  function carregarVinculos(id, tipoAtual) {
    const url = tipoAtual === "nutritionist" ? `/vinculos/nutricionista/${id}` : `/vinculos/cliente/${id}`;
    apiFetch(url)
      .then(r => (r.ok ? r.json() : []))
      .then(d => setVinculosState(Array.isArray(d) ? d : []))
      .catch(() => setVinculosState([]));
  }

  async function solicitarVinculo(nutricionistaId) {
    if (!usuarioLogado) return { ok: false };
    try {
      const res = await apiFetch("/vinculos/solicitar", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ nutricionistaId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || "Não foi possível enviar a solicitação."); return { ok: false }; }
      setVinculosState(prev => [...prev, data]);
      toast.success("Solicitação enviada.");
      return { ok: true };
    } catch { toast.error("Erro ao conectar com o servidor."); return { ok: false }; }
  }

  async function gerarConvite() {
    if (!usuarioLogado) return null;
    try {
      const res = await apiFetch("/vinculos/convite", { method: "POST" });
      if (!res.ok) { toast.error("Não foi possível gerar o convite."); return null; }
      const data = await res.json();
      setVinculosState(prev => [...prev, data]);
      return data.codigoConvite;
    } catch { toast.error("Erro ao conectar com o servidor."); return null; }
  }

  async function resgatarConvite(codigoConvite) {
    if (!usuarioLogado) return { ok: false };
    try {
      const res = await apiFetch("/vinculos/convite/resgatar", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ codigoConvite }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || "Código de convite inválido."); return { ok: false }; }
      setVinculosState(prev => [...prev, data]);
      toast.success("Vínculo realizado com sucesso.");
      return { ok: true };
    } catch { toast.error("Erro ao conectar com o servidor."); return { ok: false }; }
  }

  async function aceitarVinculo(id) {
    try {
      const res = await apiFetch(`/vinculos/${id}/aceitar`, { method: "PUT" });
      if (!res.ok) throw new Error(res.status);
      const atualizado = await res.json();
      setVinculosState(prev => prev.map(v => (v.id === id ? atualizado : v)));
    } catch { toast.error("Não foi possível aceitar. Tente novamente."); }
  }

  async function recusarVinculo(id) {
    try {
      const res = await apiFetch(`/vinculos/${id}/recusar`, { method: "PUT" });
      if (!res.ok) throw new Error(res.status);
      const atualizado = await res.json();
      setVinculosState(prev => prev.map(v => (v.id === id ? atualizado : v)));
    } catch { toast.error("Não foi possível recusar. Tente novamente."); }
  }

  // ── Pacientes sem conta (cadastrados manualmente pelo nutricionista) ──
  function carregarPacientesExternos(nutricionistaId) {
    apiFetch(`/pacientes-externos/nutricionista/${nutricionistaId}`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => setPacientesExternosState(Array.isArray(d) ? d : []))
      .catch(() => setPacientesExternosState([]));
  }

  async function cadastrarPacienteExterno(d) {
    if (!usuarioLogado) return { ok: false };
    try {
      const res = await apiFetch("/pacientes-externos", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ...d, nutricionistaId: usuarioLogado.id }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); toast.error(err.message || "Erro ao cadastrar paciente."); return { ok: false }; }
      const salvo = await res.json();
      setPacientesExternosState(prev => [...prev, salvo]);
      return { ok: true };
    } catch { toast.error("Erro ao conectar com o servidor."); return { ok: false }; }
  }

  // ── Avaliações ────────────────────────────────────────────────────
  async function adicionarAvaliacao(nutricionistaId, avaliacao) {
    if (!usuarioLogado) return;
    try {
      const res = await apiFetch("/avaliacoes", {
        method: "POST", headers: JSON_HEADERS,
        body: JSON.stringify({ nutricionista: { id: nutricionistaId }, cliente: { id: usuarioLogado.id }, nota: avaliacao.rating, comentario: avaliacao.comment }),
      });
      if (res.ok) {
        const salva = await res.json();
        const nova = { id: salva.id, userName: salva.clienteNome || usuarioLogado.nome || "Paciente", rating: salva.nota, comment: salva.comentario, date: salva.dataAvaliacao };
        setNutricionistasState(prev => prev.map(n => (n.id === nutricionistaId ? { ...n, reviews: [nova, ...(n.reviews || [])] } : n)));
      }
    } catch {}
  }

  return (
    <AppContext.Provider value={{
      pronto, usuarioLogado, login, logout, atualizarUsuarioLogado,
      nutricionistas, adicionarAvaliacao, recarregarNutricionistas: carregarNutricionistas,
      anamnese, anamneseCarregada, salvarAnamnese, recarregarDadosPaciente: carregarDadosPaciente,
      metas,
      refeicoes, adicionarRefeicao, editarRefeicao, removerRefeicao,
      pesagens, adicionarPesagem, removerPesagem,
      agendamentos, adicionarAgendamento, editarAgendamento, removerAgendamento,
      vinculos, carregarVinculos, solicitarVinculo, gerarConvite, resgatarConvite, aceitarVinculo, recusarVinculo,
      pacientesExternos, cadastrarPacienteExterno,
      cadastrarPaciente, cadastrarNutricionista,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
