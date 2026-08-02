export type ExternalCredentialFieldNames = {
  username: string;
  password: string;
  officeId: string;
};

export type ExternalCredentialsAdmin = {
  username: string;
  password: string;
  officeId: string;
  fieldNames: ExternalCredentialFieldNames;
};

export const DEFAULT_CREDENTIAL_FIELD_NAMES: ExternalCredentialFieldNames = {
  username: "username",
  password: "password",
  officeId: "officeId",
};

type CredentialsMeta = {
  usernameField?: string;
  passwordField?: string;
  officeIdField?: string;
};

function sanitizeFieldName(raw: string, fallback: string): string {
  const v = raw.trim().replace(/\s+/g, "");
  if (!v || v.startsWith("_")) return fallback;
  return v.slice(0, 80);
}

export function buildCredentialsJson(input: {
  username: string;
  password: string;
  officeId?: string;
  fieldNames?: Partial<ExternalCredentialFieldNames>;
}): string {
  const fieldNames: ExternalCredentialFieldNames = {
    username: sanitizeFieldName(
      input.fieldNames?.username ?? DEFAULT_CREDENTIAL_FIELD_NAMES.username,
      DEFAULT_CREDENTIAL_FIELD_NAMES.username,
    ),
    password: sanitizeFieldName(
      input.fieldNames?.password ?? DEFAULT_CREDENTIAL_FIELD_NAMES.password,
      DEFAULT_CREDENTIAL_FIELD_NAMES.password,
    ),
    officeId: sanitizeFieldName(
      input.fieldNames?.officeId ?? DEFAULT_CREDENTIAL_FIELD_NAMES.officeId,
      DEFAULT_CREDENTIAL_FIELD_NAMES.officeId,
    ),
  };

  const payload: Record<string, unknown> = {
    _meta: {
      usernameField: fieldNames.username,
      passwordField: fieldNames.password,
      officeIdField: fieldNames.officeId,
    } satisfies CredentialsMeta,
    [fieldNames.username]: input.username.trim(),
    [fieldNames.password]: input.password,
  };

  const office = input.officeId?.trim() ?? "";
  if (office) {
    payload[fieldNames.officeId] = office;
  }

  return JSON.stringify(payload);
}

export function parseCredentialsForAdmin(
  credentialsJson: string | null | undefined,
): ExternalCredentialsAdmin {
  const empty: ExternalCredentialsAdmin = {
    username: "",
    password: "",
    officeId: "",
    fieldNames: { ...DEFAULT_CREDENTIAL_FIELD_NAMES },
  };
  if (!credentialsJson?.trim()) return empty;

  try {
    const parsed = JSON.parse(credentialsJson) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return empty;
    const obj = parsed as Record<string, unknown>;
    const meta = (obj._meta && typeof obj._meta === "object" && !Array.isArray(obj._meta)
      ? (obj._meta as CredentialsMeta)
      : {}) as CredentialsMeta;

    const fieldNames: ExternalCredentialFieldNames = {
      username: sanitizeFieldName(
        String(meta.usernameField ?? DEFAULT_CREDENTIAL_FIELD_NAMES.username),
        DEFAULT_CREDENTIAL_FIELD_NAMES.username,
      ),
      password: sanitizeFieldName(
        String(meta.passwordField ?? DEFAULT_CREDENTIAL_FIELD_NAMES.password),
        DEFAULT_CREDENTIAL_FIELD_NAMES.password,
      ),
      officeId: sanitizeFieldName(
        String(meta.officeIdField ?? DEFAULT_CREDENTIAL_FIELD_NAMES.officeId),
        DEFAULT_CREDENTIAL_FIELD_NAMES.officeId,
      ),
    };

    // Legacy: plain maps without _meta — try common keys
    if (!meta.usernameField && !meta.passwordField) {
      const keys = Object.keys(obj).filter((k) => !k.startsWith("_"));
      const lower = new Map(keys.map((k) => [k.toLowerCase(), k]));
      const userKey =
        lower.get("username") ?? lower.get("user") ?? lower.get("userid") ?? lower.get("email") ?? keys[0];
      const passKey =
        lower.get("password") ?? lower.get("pass") ?? lower.get("pwd") ?? keys.find((k) => k !== userKey);
      const officeKey =
        lower.get("officeid") ??
        lower.get("office_id") ??
        lower.get("office") ??
        lower.get("companyid") ??
        lower.get("company");
      if (userKey) fieldNames.username = userKey;
      if (passKey) fieldNames.password = passKey;
      if (officeKey) fieldNames.officeId = officeKey;
    }

    return {
      username: String(obj[fieldNames.username] ?? ""),
      password: String(obj[fieldNames.password] ?? ""),
      officeId: String(obj[fieldNames.officeId] ?? ""),
      fieldNames,
    };
  } catch {
    return empty;
  }
}

/** Keys starting with `_` are admin meta and must not be posted to external portals. */
export function credentialsForLaunch(
  credentialsJson: string | null | undefined,
): Record<string, string> {
  if (!credentialsJson?.trim()) return {};
  try {
    const parsed = JSON.parse(credentialsJson) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!key || key.startsWith("_")) continue;
      if (value == null) continue;
      const str = String(value);
      if (str === "") continue;
      out[key] = str;
    }
    return out;
  } catch {
    return {};
  }
}
