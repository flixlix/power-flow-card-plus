import { describe, expect, test } from "@jest/globals";

import en from "../src/localize/languages/en.json";

import cs from "../src/localize/languages/cs.json";
import de from "../src/localize/languages/de.json";
import dk from "../src/localize/languages/dk.json";
import es from "../src/localize/languages/es.json";
import fi from "../src/localize/languages/fi.json";
import fr from "../src/localize/languages/fr.json";
import it from "../src/localize/languages/it.json";
import nl from "../src/localize/languages/nl.json";
import pl from "../src/localize/languages/pl.json";
import ptBR from "../src/localize/languages/pt-BR.json";
import pt from "../src/localize/languages/pt-PT.json";
import ru from "../src/localize/languages/ru.json";
import sk from "../src/localize/languages/sk.json";

function getAllKeys(obj: { [key: string]: any }): string[] {
  let keys: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
      if (typeof obj[key] === "object") {
        const nestedKeys = getAllKeys(obj[key]);
        keys = keys.concat(nestedKeys.map((nestedKey) => `${key}.${nestedKey}`));
      }
    }
  }

  return keys;
}

describe("Language files", () => {
  const enKeys = getAllKeys(en);
  test("cs.json should have the same properties as en.json", () => {
    const csKeys = getAllKeys(cs);
    expect(csKeys).toEqual(enKeys);
  });
  test("de.json should have the same properties as en.json", () => {
    const deKeys = getAllKeys(de);
    expect(deKeys).toEqual(enKeys);
  });
  test("dk.json should have the same properties as en.json", () => {
    const dkKeys = getAllKeys(dk);
    expect(dkKeys).toEqual(enKeys);
  });
  test("es.json should have the same properties as en.json", () => {
    const esKeys = getAllKeys(es);
    expect(esKeys).toEqual(enKeys);
  });
  test("fi.json should have the same properties as en.json", () => {
    const fiKeys = getAllKeys(fi);
    expect(fiKeys).toEqual(enKeys);
  });
  test("fr.json should have the same properties as en.json", () => {
    const frKeys = getAllKeys(fr);
    expect(frKeys).toEqual(enKeys);
  });
  test("it.json should have the same properties as en.json", () => {
    const itKeys = getAllKeys(it);
    expect(itKeys).toEqual(enKeys);
  });
  test("nl.json should have the same properties as en.json", () => {
    const nlKeys = getAllKeys(nl);
    expect(nlKeys).toEqual(enKeys);
  });
  test("pl.json should have the same properties as en.json", () => {
    const plKeys = getAllKeys(pl);
    expect(plKeys).toEqual(enKeys);
  });
  test("pt-BR.json should have the same properties as en.json", () => {
    const ptBRKeys = getAllKeys(ptBR);
    expect(ptBRKeys).toEqual(enKeys);
  });
  test("pt-PT.json should have the same properties as en.json", () => {
    const ptKeys = getAllKeys(pt);
    expect(ptKeys).toEqual(enKeys);
  });
  test("ru.json should have the same properties as en.json", () => {
    const ruKeys = getAllKeys(ru);
    expect(ruKeys).toEqual(enKeys);
  });
  test("sk.json should have the same properties as en.json", () => {
    const skKeys = getAllKeys(sk);
    expect(skKeys).toEqual(enKeys);
  });
});
