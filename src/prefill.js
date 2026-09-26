// Credenciais recém-cadastradas, lidas uma única vez pela tela de login (não vão para a rota nem para o disco).
let guardado = null;
export const guardarPrefill = (email, senha) => { guardado = { email, senha }; };
export const consumirPrefill = () => { const v = guardado; guardado = null; return v; };
