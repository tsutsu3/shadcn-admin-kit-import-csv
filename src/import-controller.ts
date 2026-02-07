import { DataProvider, Identifier } from "ra-core";
import { processCsvFile } from "./csv-extractor";
import { SimpleLogger } from "./SimpleLogger";
import { ValidateRowFunction } from "./config.interface";

/** Translation function signature used throughout the import controller. */
type TranslateFn = (key: string, args?: any) => string;

/** Creates a SimpleLogger instance with the given logging flag. */
function makeLogger(logging: boolean) {
  const logger = new SimpleLogger("import-controller", true);
  logger.setEnabled(logging);
  return logger;
}

/**
 * Finds IDs from CSV values that already exist in the data provider.
 * Uses either getMany or individual getOne calls depending on the disableGetMany flag.
 * @param logging - Whether to enable debug logging.
 * @param translate - Translation function for error messages.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param csvValues - Parsed CSV row objects.
 * @param resourceName - The target resource name.
 * @param disableGetMany - If true, falls back to individual getOne calls.
 * @returns An array of IDs that collide with existing records.
 */
export async function GetIdsColliding(
  logging: boolean,
  translate: TranslateFn,
  dataProvider: DataProvider,
  csvValues: any[],
  resourceName: string,
  disableGetMany: boolean | undefined,
): Promise<Identifier[]> {
  const logger = makeLogger(logging);
  const hasIds = csvValues.some((v) => v.id);
  if (!hasIds) {
    return [];
  }
  try {
    const csvIds: Identifier[] = csvValues.filter((v) => !!v.id).map((v) => v.id);
    const recordsIdsColliding = await (disableGetMany
      ? GetIdsCollidingGetSingle(logging, translate, dataProvider, csvIds, resourceName)
      : GetIdsCollidingGetMany(logging, translate, dataProvider, csvIds, resourceName));
    return recordsIdsColliding;
  } catch (error) {
    logger.error("GetIdsColliding", { csvValues }, error);
    throw translate("csv.parsing.collidingIds");
  }
}

/**
 * Checks for colliding IDs by issuing individual getOne requests for each CSV ID.
 * @param logging - Whether to enable debug logging.
 * @param translate - Translation function for error messages.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param csvIds - Array of IDs extracted from CSV data.
 * @param resourceName - The target resource name.
 * @returns An array of IDs that already exist in the data provider.
 */
export async function GetIdsCollidingGetSingle(
  logging: boolean,
  translate: TranslateFn,
  dataProvider: DataProvider,
  csvIds: Identifier[],
  resourceName: string,
): Promise<Identifier[]> {
  const logger = makeLogger(logging);
  try {
    const recordsColliding = await Promise.all(
      csvIds.map((id) => IsIdColliding(dataProvider, id, resourceName)),
    );
    const recordIdsColliding = recordsColliding.filter(Boolean) as Identifier[];
    return recordIdsColliding;
  } catch (error) {
    logger.error("GetIdsCollidingGetSingle", { csvIds }, error);
    throw translate("csv.parsing.collidingIds");
  }
}

/**
 * Checks whether a single ID exists in the data provider.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param id - The ID to check.
 * @param resourceName - The target resource name.
 * @returns The ID if it exists, or undefined if not found.
 */
export async function IsIdColliding(
  dataProvider: DataProvider,
  id: Identifier,
  resourceName: string,
) {
  return dataProvider
    .getOne(resourceName, { id })
    .then((_) => id)
    .catch((_) => undefined);
}

/**
 * Checks for colliding IDs using a single getMany batch request.
 * @param logging - Whether to enable debug logging.
 * @param translate - Translation function for error messages.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param csvIds - Array of IDs extracted from CSV data.
 * @param resourceName - The target resource name.
 * @returns An array of IDs that already exist in the data provider.
 */
export async function GetIdsCollidingGetMany(
  logging: boolean,
  translate: TranslateFn,
  dataProvider: DataProvider,
  csvIds: Identifier[],
  resourceName: string,
): Promise<Identifier[]> {
  const logger = makeLogger(logging);
  try {
    const recordsColliding = await dataProvider.getMany(resourceName, {
      ids: csvIds,
    });
    const recordIdsColliding = recordsColliding.data.map((r) => r.id);
    return recordIdsColliding;
  } catch (error) {
    logger.log(
      "GetIdsCollidingGetMany",
      "getMany failed, falling back to individual getOne calls",
      error,
    );
    return GetIdsCollidingGetSingle(logging, translate, dataProvider, csvIds, resourceName);
  }
}

/**
 * Validates all CSV rows using the provided validation function.
 * @param logging - Whether to enable debug logging.
 * @param translate - Translation function for error messages.
 * @param csvValues - Parsed CSV row objects to validate.
 * @param validateRow - Optional async validation function applied to each row.
 */
export async function CheckCSVValidation(
  logging: boolean,
  translate: TranslateFn,
  csvValues: any[],
  validateRow?: ValidateRowFunction,
): Promise<void> {
  const logger = makeLogger(logging);
  if (!validateRow) {
    return;
  }
  try {
    await Promise.all(csvValues.map(validateRow));
  } catch (error) {
    logger.error("CheckCSVValidation", { csvValues }, error);
    throw error instanceof Error ? error.message : translate("csv.parsing.failedValidateRow");
  }
}

/**
 * Parses a CSV file and returns the extracted row objects.
 * @param logging - Whether to enable debug logging.
 * @param translate - Translation function for error messages.
 * @param file - The CSV file to parse.
 * @param parseConfig - PapaParse configuration options.
 * @returns An array of parsed row objects.
 */
export async function GetCSVItems(
  logging: boolean,
  translate: TranslateFn,
  file: File,
  parseConfig: any,
): Promise<any[]> {
  const logger = makeLogger(logging);
  let csvValues: any[] | undefined;
  try {
    csvValues = await processCsvFile(file, parseConfig);
    return csvValues || [];
  } catch (error) {
    logger.error("GetCSVItems", { csvValues }, error);
    throw translate("csv.parsing.invalidCsvDocument");
  }
}
