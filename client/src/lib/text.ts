/** Remove acentos e deixa minúsculo, para a busca achar "habitos" em "Hábitos". */
export const normalizeText = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
