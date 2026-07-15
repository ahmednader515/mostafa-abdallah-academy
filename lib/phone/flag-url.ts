/** PNG flags from flagcdn.com (ISO 3166-1 alpha-2 lowercase). */
export function countryFlagUrl(iso2: string, width: 40 | 80 = 40): string {
  return `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`;
}
