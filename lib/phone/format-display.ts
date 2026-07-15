import { PHONE_COUNTRIES, digitsOnly, getPhoneCountry, type PhoneCountry } from "./countries";

const BY_DIAL_LONGEST_FIRST = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

export type SplitPhone = {
  dial: string;
  /** National digits as entered / shown to the user (may include trunk 0). */
  national: string;
  country?: PhoneCountry;
};

/** Split a stored phone (international digits, 00…, or local) into dial + national. */
export function splitStoredPhone(raw: string): SplitPhone | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let d = digitsOnly(trimmed);
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);

  for (const c of BY_DIAL_LONGEST_FIRST) {
    if (d.startsWith(c.dial) && d.length > c.dial.length) {
      let national = d.slice(c.dial.length);
      if (c.code === "EG" && c.allowLeadingZero && national.length === 10 && !national.startsWith("0")) {
        national = `0${national}`;
      }
      return { dial: c.dial, national, country: c };
    }
  }

  if (d.length === 11 && d.startsWith("0")) {
    const eg = getPhoneCountry("EG");
    return { dial: eg.dial, national: d, country: eg };
  }

  if (d.length === 10 && d.startsWith("1")) {
    const eg = getPhoneCountry("EG");
    return { dial: eg.dial, national: `0${d}`, country: eg };
  }

  return { dial: "", national: d };
}

/** Display: `+ {dial} {national}` or `+ - {national}` when country code is unknown. */
export function formatPhoneForDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const split = splitStoredPhone(raw);
  if (!split) return "";
  if (split.dial) return `+ ${split.dial} ${split.national}`;
  return `+ - ${split.national}`;
}
