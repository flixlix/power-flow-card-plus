import { describe, expect, test } from "@jest/globals";

import * as fs from "node:fs";
import * as path from "node:path";

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
  const languagesDir = path.resolve(__dirname, "../src/localize/languages");
  const languageFiles = fs
    .readdirSync(languagesDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const readLanguage = (file: string): { [key: string]: any } => {
    const jsonText = fs.readFileSync(path.join(languagesDir, file), "utf8");
    return JSON.parse(jsonText) as { [key: string]: any };
  };

  const enFile = "en.json";
  const enKeys = getAllKeys(readLanguage(enFile));

  test.each(languageFiles.filter((file) => file !== enFile))("%s should have the same properties as en.json", (languageFile) => {
    const languageKeys = getAllKeys(readLanguage(languageFile));
    expect(languageKeys).toEqual(enKeys);
  });
});
