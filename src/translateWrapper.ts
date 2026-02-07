import { useTranslate } from "ra-core";
import { en } from "./i18n";

type UseTranslateFn = (key: string, args?: any) => string;

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, args: Record<string, any>): string {
  return template.replace(/%\{(\w+)\}/g, (_, key) =>
    args[key] != null ? String(args[key]) : `%{${key}}`,
  );
}

export const translateWrapper = (): UseTranslateFn => {
  const translateSystem = useTranslate();
  const translate = (key: string, args?: any): string => {
    const safeArgs = { ...args, _: "" };
    const res = translateSystem(key, safeArgs);
    if (res) {
      return res;
    }
    // Fallback to built-in English translations
    const fallback = getNestedValue(en, key);
    if (fallback) {
      return args ? interpolate(fallback, args) : fallback;
    }
    return key;
  };
  return translate;
};
