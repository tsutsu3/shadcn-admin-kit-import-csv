import { parse as convertFromCSV, ParseConfig } from "papaparse";

/** Represents a cell value parsed by PapaParse. */
type PapaString = string | null | number;

/**
 * Sets a value at a nested path within an object, creating intermediate objects as needed.
 * @param obj - The source object to set the value in.
 * @param path - Dot-delimited path string (e.g. "a.b.c").
 * @param value - The value to set at the given path.
 * @returns A shallow copy of the object with the value set.
 */
function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split(".");
  const result = { ...obj };
  let current: any = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = current[key] != null ? { ...current[key] } : {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * Safely sets a value on an object at the given path, handling null/number path coercion.
 */
const setObjectValue = (object: any, path: PapaString, value: any): any => {
  const pathStr = path != null ? path + "" : "";
  if (!pathStr) return object || {};
  return setNestedValue(object || {}, pathStr, value);
};

/**
 * Parses a CSV file and converts it into an array of row objects keyed by header names.
 * @param file - The CSV file to process.
 * @param parseConfig - Optional PapaParse configuration overrides.
 * @returns An array of objects representing CSV rows, or undefined if file is falsy.
 */
export async function processCsvFile(file: File | any, parseConfig: ParseConfig = {}) {
  if (!file) {
    return;
  }
  const csvData = await getCsvData(file, parseConfig);
  return processCsvData(csvData);
}

/**
 * Reads and parses raw CSV data from a file using PapaParse.
 * @param file - The CSV file to read.
 * @param inputConfig - Optional PapaParse configuration overrides.
 * @returns A 2D array of parsed cell values.
 */
export async function getCsvData(file: File | any, inputConfig: ParseConfig = {}) {
  let config = {};
  const isObject = !!inputConfig && typeof inputConfig === "object";
  if (isObject) {
    config = inputConfig;
  }
  return new Promise<PapaString[][]>((resolve, reject) =>
    convertFromCSV(file, {
      // Defaults
      delimiter: ",",
      skipEmptyLines: true,
      // Configs (overwrites)
      ...config,
      // Callbacks
      complete: (result) => resolve(result.data as PapaString[][]),
      error: (error) => reject(error),
    }),
  );
}

/**
 * Converts raw 2D CSV data into an array of keyed objects.
 * If the first row is an array (header row), it is used as property keys for subsequent rows.
 * Otherwise, each row is treated as a pre-keyed object.
 * @param data - The 2D array of parsed CSV data.
 * @returns An array of row objects.
 */
export function processCsvData(data: PapaString[][]): any[] {
  if (Array.isArray(data[0])) {
    const topRowKeys: PapaString[] = data[0];

    const dataRows = data.slice(1).map((row) => {
      let value: any = {};

      topRowKeys.forEach((key, index) => {
        value = setObjectValue(value, key, row[index]);
      });

      return value;
    });
    return dataRows;
  } else {
    const dataRows: any[] = [];
    data.forEach((obj) => {
      let value: any = {};
      for (const key in obj) value = setObjectValue(value, key, obj[key]);
      dataRows.push(value);
    });
    return dataRows;
  }
}
