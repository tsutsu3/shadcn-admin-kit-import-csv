import { ErrorCallback, PrecommitCallback } from "./config.interface";
import { SimpleLogger } from "./SimpleLogger";
import { DataProvider } from "ra-core";

const logger = new SimpleLogger("uploader", false);

/**
 * Creates new records in the data provider from CSV values.
 * Applies the preCommitCallback before sending and the postCommitCallback after completion.
 * @param logging - Whether to enable debug logging.
 * @param disableCreateMany - If true, falls back to individual create calls.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param resource - The target resource name.
 * @param values - Array of row objects to create.
 * @param preCommitCallback - Optional callback to transform values before creation.
 * @param postCommitCallback - Optional callback invoked with report items after creation.
 */
export async function create(
  logging: boolean,
  disableCreateMany: boolean | undefined,
  dataProvider: DataProvider,
  resource: string,
  values: any[],
  preCommitCallback?: PrecommitCallback,
  postCommitCallback?: ErrorCallback,
) {
  const parsedValues = preCommitCallback ? await preCommitCallback("create", values) : values;
  const reportItems = await createInDataProvider(
    logging,
    !!disableCreateMany,
    dataProvider,
    resource,
    parsedValues,
  );
  if (postCommitCallback) {
    postCommitCallback(reportItems);
  }
  const shouldReject = !postCommitCallback && reportItems.some((r) => !r.success);
  if (shouldReject) {
    return Promise.reject(reportItems.map((r) => r.response));
  }
}

/**
 * Updates existing records in the data provider from CSV values.
 * Applies the preCommitCallback before sending and the postCommitCallback after completion.
 * @param logging - Whether to enable debug logging.
 * @param disableUpdateMany - If true, falls back to individual update calls.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param resource - The target resource name.
 * @param values - Array of row objects to update (must include `id`).
 * @param preCommitCallback - Optional callback to transform values before update.
 * @param postCommitCallback - Optional callback invoked with report items after update.
 */
export async function update(
  logging: boolean,
  disableUpdateMany: boolean | undefined,
  dataProvider: DataProvider,
  resource: string,
  values: any[],
  preCommitCallback?: PrecommitCallback,
  postCommitCallback?: ErrorCallback,
) {
  const parsedValues = preCommitCallback ? await preCommitCallback("overwrite", values) : values;
  const reportItems = await updateInDataProvider(
    logging,
    !!disableUpdateMany,
    dataProvider,
    resource,
    parsedValues,
  );
  if (postCommitCallback) {
    postCommitCallback(reportItems);
  }
  const shouldReject = !postCommitCallback && reportItems.some((r) => !r.success);
  if (shouldReject) {
    return Promise.reject(reportItems.map((r) => r.response));
  }
}

/** Represents the outcome of a single create or update operation. */
interface ReportItem {
  value: any;
  success: boolean;
  err?: any;
  response?: any;
}

/**
 * Sends create requests to the data provider, attempting createMany first.
 * Falls back to individual create calls if createMany is disabled or not supported.
 * @param logging - Whether to enable debug logging.
 * @param disableCreateMany - If true, skips createMany and uses individual calls.
 * @param dataProvider - The ra-core DataProvider instance.
 * @param resource - The target resource name.
 * @param values - Array of row objects to create.
 * @returns An array of report items describing each operation's result.
 */
export async function createInDataProvider(
  logging: boolean,
  disableCreateMany: boolean,
  dataProvider: DataProvider,
  resource: string,
  values: any[],
): Promise<ReportItem[]> {
  logger.setEnabled(logging);
  logger.log("createInDataProvider", { dataProvider, resource, values });
  const reportItems: ReportItem[] = [];
  if (disableCreateMany) {
    const items = await createInDataProviderFallback(dataProvider, resource, values);
    reportItems.push(...items);
    return items;
  }
  try {
    const response = await (dataProvider as any).createMany(resource, { data: values });
    reportItems.push({
      value: null,
      success: true,
      response: response,
    });
  } catch (error) {
    const providerMethodNotFoundErrors = ["Unknown dataProvider", "createMany"];
    const shouldTryFallback = doesErrorContainString(error, providerMethodNotFoundErrors);
    const apiError = !shouldTryFallback;
    if (apiError) {
      reportItems.push({
        value: null,
        err: error,
        success: false,
        response: null,
      });
    }
    if (shouldTryFallback) {
      logger.log(
        "createInDataProvider",
        "createMany not found on data provider (you may need to implement it see: https://github.com/benwinding/react-admin-import-csv#reducing-requests): using fallback instead",
      );
      try {
        const items = await createInDataProviderFallback(dataProvider, resource, values);
        reportItems.push(...items);
      } catch (error) {
        logger.error("createInDataProvider", error);
      }
    }
  }
  return reportItems;
}

/** Fallback that creates records one-by-one using individual `dataProvider.create` calls. */
async function createInDataProviderFallback(
  dataProvider: DataProvider,
  resource: string,
  values: any[],
): Promise<ReportItem[]> {
  const reportItems: ReportItem[] = [];
  await Promise.all(
    values.map((value) =>
      dataProvider
        .create(resource, { data: value })
        .then((res) => reportItems.push({ value: value, success: true, response: res }))
        .catch((err) => reportItems.push({ value, success: false, err: err })),
    ),
  );
  return reportItems;
}

/**
 * Sends update requests to the data provider, attempting updateManyArray first.
 * Falls back to individual update calls if updateManyArray is disabled or not supported.
 */
async function updateInDataProvider(
  logging: boolean,
  disableUpdateMany: boolean,
  dataProvider: DataProvider,
  resource: string,
  values: any[],
) {
  const ids = values.map((v) => v.id);
  logger.setEnabled(logging);
  logger.log("updateInDataProvider", {
    dataProvider,
    resource,
    values,
    logging,
    ids,
  });
  if (disableUpdateMany) {
    const items = await updateInDataProviderFallback(dataProvider, resource, values);
    return items;
  }
  const reportItems: ReportItem[] = [];
  try {
    const response = await (dataProvider as any).updateManyArray(resource, {
      ids: ids,
      data: values,
    });
    reportItems.push({
      value: null,
      success: true,
      response: response,
    });
  } catch (error) {
    const providerMethodNotFoundErrors = ["Unknown dataProvider", "updateMany"];
    const shouldTryFallback = doesErrorContainString(error, providerMethodNotFoundErrors);
    const apiError = !shouldTryFallback;
    if (apiError) {
      reportItems.push({
        value: null,
        err: error,
        success: false,
        response: null,
      });
    }
    if (shouldTryFallback) {
      logger.log(
        "updateInDataProvider",
        "updateManyArray not found on data provider (you may need to implement it see: https://github.com/benwinding/react-admin-import-csv#reducing-requests): using fallback instead",
      );
      try {
        const items = await updateInDataProviderFallback(dataProvider, resource, values);
        reportItems.push(...items);
      } catch (error) {
        logger.error("updateInDataProvider", error);
      }
    }
  }
  return reportItems;
}

/** Fallback that updates records one-by-one using individual `dataProvider.update` calls. */
async function updateInDataProviderFallback(
  dataProvider: DataProvider,
  resource: string,
  values: any[],
): Promise<ReportItem[]> {
  const reportItems: ReportItem[] = [];
  await Promise.all(
    values.map((value) =>
      dataProvider
        .update(resource, { id: value.id, data: value, previousData: null as any })
        .then((res) => reportItems.push({ value: value, success: true, response: res }))
        .catch((err) => reportItems.push({ value: value, success: false, err })),
    ),
  );
  return reportItems;
}

/** Checks whether an error's string representation contains any of the given substrings. */
function doesErrorContainString(error: any, stringsToCheck: string[]): boolean {
  const errorString = (!!error && typeof error === "object" && error?.toString()) || "";
  const shouldTryFallback = stringsToCheck.some((stringToCheck) =>
    errorString.includes(stringToCheck),
  );
  return shouldTryFallback;
}
