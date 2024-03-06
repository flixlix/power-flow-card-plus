import * as cs from "./languages/cs.json";
import * as en from "./languages/en.json";
import * as de from "./languages/de.json";
import * as dk from "./languages/dk.json";
import * as pt from "./languages/pt-PT.json";
import * as ptBR from "./languages/pt-BR.json";
import * as es from "./languages/es.json";
import * as nl from "./languages/nl.json";
import * as it from "./languages/it.json";
import * as fr from "./languages/fr.json";
import * as ru from "./languages/ru.json";
import * as fi from "./languages/fi.json";
import * as pl from "./languages/pl.json";
import * as sk from "./languages/sk.json";
import * as sv from "./languages/sv.json";

const languages: Record<string, unknown> = {
  cs,
  en,
  de,
  dk,
  pt,
  pt_BR: ptBR,
  es,
  nl,
  it,
  fr,
  ru,
  fi,
  pl,
  sk,
  sv,
};

const defaultLang = "en";

function getTranslatedString(key: string, lang: string): string | undefined {
  try {
    return key.split(".").reduce((o, i) => (o as Record<string, unknown>)[i], languages[lang]) as string;
  } catch (_) {
    return undefined;
  }
}

export function setupCustomlocalize(key: string) {
  const lang = (localStorage.getItem("selectedLanguage") || "en").replace(/['"]+/g, "").replace("-", "_");

  let translated = getTranslatedString(key, lang);
  if (!translated) translated = getTranslatedString(key, defaultLang);
  return translated ?? key;
}

export default setupCustomlocalize;
