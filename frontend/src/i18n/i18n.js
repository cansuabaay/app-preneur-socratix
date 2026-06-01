import en from "./en.json";
import tr from "./tr.json";

const catalogs = { en, tr };

function resolveNode(catalog, key) {
  if (catalog == null || key == null) return undefined;
  if (Object.prototype.hasOwnProperty.call(catalog, key) && typeof catalog[key] === "string") {
    return catalog[key];
  }
  const parts = String(key).split(".");
  let node = catalog;
  for (const part of parts) {
    node = node?.[part];
    if (node === undefined) return undefined;
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(lang, key, vars = {}) {
  const catalog = catalogs[lang] ?? catalogs.en;
  let text = resolveNode(catalog, key) ?? resolveNode(catalogs.en, key) ?? key;

  if (vars && typeof vars === "object") {
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value ?? ""));
    });
  }
  return text;
}
