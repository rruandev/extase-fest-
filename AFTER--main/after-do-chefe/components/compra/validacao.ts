/** Máscaras e validações do checkout. Mesmas regras da versão anterior do site. */

export function mascararCPF(valor: string): string {
  const v = valor.replace(/\D/g, "").slice(0, 11);
  if (v.length > 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  if (v.length > 6) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  if (v.length > 3) return `${v.slice(0, 3)}.${v.slice(3)}`;
  return v;
}

export function mascararTelefone(valor: string): string {
  const v = valor.replace(/\D/g, "").slice(0, 11);
  if (v.length > 7) return `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3, 7)}-${v.slice(7)}`;
  if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return v;
}

/** Validação de CPF pelos dois dígitos verificadores. */
export function cpfValido(entrada: string): boolean {
  const cpf = entrada.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10], 10);
}

export const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

export const nomeValido = (valor: string) => valor.trim().length >= 3 && valor.trim().includes(" ");

export const telefoneValido = (valor: string) => valor.replace(/\D/g, "").length >= 10;

export type CampoForm = "nome" | "cpf" | "whatsapp" | "email";

/** Mensagem de erro do campo, ou "" quando está válido ou ainda vazio. */
export function erroDoCampo(campo: CampoForm, valor: string): string {
  if (!valor.trim()) return "";

  switch (campo) {
    case "nome":
      return nomeValido(valor) ? "" : "Informe nome e sobrenome";
    case "cpf": {
      const digitos = valor.replace(/\D/g, "");
      if (digitos.length < 11) return "CPF incompleto";
      return cpfValido(digitos) ? "" : "CPF inválido";
    }
    case "whatsapp":
      return telefoneValido(valor) ? "" : "Número incompleto";
    case "email":
      return emailValido(valor) ? "" : "E-mail inválido";
  }
}

export function formularioCompleto(dados: Record<CampoForm, string>): boolean {
  return (
    nomeValido(dados.nome) &&
    cpfValido(dados.cpf) &&
    telefoneValido(dados.whatsapp) &&
    emailValido(dados.email)
  );
}
