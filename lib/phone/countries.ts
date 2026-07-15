export type PhoneCountry = {
  code: string;
  dial: string;
  /** National number length (without country code, without trunk 0). */
  nationalLength: number;
  placeholder: string;
  nameEn: string;
  nameAr: string;
  flag: string;
  /** If true, a leading 0 is stripped before length check (e.g. Egypt 01…). */
  allowLeadingZero?: boolean;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    code: "EG",
    dial: "20",
    nationalLength: 10,
    placeholder: "1012345678",
    nameEn: "Egypt",
    nameAr: "مصر",
    flag: "🇪🇬",
    allowLeadingZero: true,
  },
  {
    code: "SA",
    dial: "966",
    nationalLength: 9,
    placeholder: "501234567",
    nameEn: "Saudi Arabia",
    nameAr: "السعودية",
    flag: "🇸🇦",
  },
  {
    code: "AE",
    dial: "971",
    nationalLength: 9,
    placeholder: "501234567",
    nameEn: "UAE",
    nameAr: "الإمارات",
    flag: "🇦🇪",
  },
  {
    code: "US",
    dial: "1",
    nationalLength: 10,
    placeholder: "2025551234",
    nameEn: "United States",
    nameAr: "الولايات المتحدة",
    flag: "🇺🇸",
  },
  {
    code: "KW",
    dial: "965",
    nationalLength: 8,
    placeholder: "50123456",
    nameEn: "Kuwait",
    nameAr: "الكويت",
    flag: "🇰🇼",
  },
  {
    code: "QA",
    dial: "974",
    nationalLength: 8,
    placeholder: "33123456",
    nameEn: "Qatar",
    nameAr: "قطر",
    flag: "🇶🇦",
  },
  {
    code: "BH",
    dial: "973",
    nationalLength: 8,
    placeholder: "36123456",
    nameEn: "Bahrain",
    nameAr: "البحرين",
    flag: "🇧🇭",
  },
  {
    code: "OM",
    dial: "968",
    nationalLength: 8,
    placeholder: "92123456",
    nameEn: "Oman",
    nameAr: "عُمان",
    flag: "🇴🇲",
  },
  {
    code: "JO",
    dial: "962",
    nationalLength: 9,
    placeholder: "791234567",
    nameEn: "Jordan",
    nameAr: "الأردن",
    flag: "🇯🇴",
  },
];

export const DEFAULT_PHONE_COUNTRY = "EG";

const byCode = new Map(PHONE_COUNTRIES.map((c) => [c.code, c]));

export function getPhoneCountry(code: string | undefined | null): PhoneCountry {
  const c = code?.trim().toUpperCase();
  return (c && byCode.get(c)) || byCode.get(DEFAULT_PHONE_COUNTRY)!;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalize user input to national digits (no country code, no trunk 0 when configured). */
export function normalizeNationalDigits(country: PhoneCountry, raw: string): string {
  let d = digitsOnly(raw);
  if (country.allowLeadingZero && d.startsWith("0")) {
    d = d.slice(1);
  }
  return d;
}

/** Max characters allowed in the national input field. */
export function getNationalMaxLength(country: PhoneCountry): number {
  return country.allowLeadingZero ? country.nationalLength + 1 : country.nationalLength;
}

/** Stored value: country code + national digits (e.g. 201012345678). */
export function buildStoredPhone(country: PhoneCountry, rawNational: string): string {
  const national = normalizeNationalDigits(country, rawNational);
  return `${country.dial}${national}`;
}

export function validatePhoneForCountry(
  countryCode: string,
  rawNational: string,
): { ok: true; stored: string; country: PhoneCountry } | { ok: false; messageAr: string; messageEn: string } {
  const country = getPhoneCountry(countryCode);
  const national = normalizeNationalDigits(country, rawNational);
  if (national.length !== country.nationalLength) {
    return {
      ok: false,
      messageAr: `رقم الهاتف يجب أن يكون ${country.nationalLength} أرقام${country.allowLeadingZero ? " (بدون كود الدولة)" : ""}`,
      messageEn: `Phone number must be ${country.nationalLength} digits for ${country.nameEn}`,
    };
  }
  return { ok: true, stored: `${country.dial}${national}`, country };
}
