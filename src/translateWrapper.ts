import { useTranslate } from "ra-core";
import { en } from "./i18n";

/** Translation function signature. */
type UseTranslateFn = (key: string, args?: any) => string;

/**
 * Retrieves a deeply nested string value from an object using a dot-delimited path.
 * @param obj - The object to traverse.
 * @param path - Dot-delimited path (e.g. "csv.parsing.error").
 * @returns The string value at the path, or undefined if not found.
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Replaces `%{key}` placeholders in a template string with values from the args object.
 * @param template - The template string containing `%{key}` placeholders.
 * @param args - Key-value pairs for substitution.
 * @returns The interpolated string.
 */
function interpolate(template: string, args: Record<string, any>): string {
  return template.replace(/%\{(\w+)\}/g, (_, key) =>
    args[key] != null ? String(args[key]) : `%{${key}}`,
  );
}

/**
 * Creates a translation function that wraps ra-core's `useTranslate`.
 * Falls back to built-in English translations when the system translator returns no result.
 * @returns A translate function that resolves keys to localized strings.
 */
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
