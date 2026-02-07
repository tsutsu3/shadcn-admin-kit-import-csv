import { parse as convertFromCSV, ParseConfig } from "papaparse";

type PapaString = string | null | number;

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

const setObjectValue = (object: any, path: PapaString, value: any): any => {
  const pathStr = path != null ? path + "" : "";
  if (!pathStr) return object || {};
  return setNestedValue(object || {}, pathStr, value);
};

export async function processCsvFile(
  file: File | any,
  parseConfig: ParseConfig = {}
) {
  if (!file) {
    return;
  }
  const csvData = await getCsvData(file, parseConfig);
  return processCsvData(csvData);
}

export async function getCsvData(
  file: File | any,
  inputConfig: ParseConfig = {}
) {
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
    })
  );
}

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
  }
  else {
    const dataRows: any[] = [];
    data.forEach( (obj) => {
        let value: any = {}
        for (let key in obj) value = setObjectValue(value, key, obj[key]);
        dataRows.push(value);
    });
    return dataRows;
  }
}
