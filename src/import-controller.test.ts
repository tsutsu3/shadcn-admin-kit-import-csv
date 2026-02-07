import { describe, it, expect, vi } from "vitest";
import {
  GetIdsColliding,
  GetIdsCollidingGetMany,
  GetCSVItems,
  CheckCSVValidation,
} from "./import-controller";
import { DataProvider } from "ra-core";
// Mock processCsvFile to avoid FileReader dependency (no jsdom in this file)
vi.mock("./csv-extractor", () => ({
  processCsvFile: vi.fn(),
}));

function makeMockDataProvider(overrides: Partial<DataProvider> = {}): DataProvider {
  return {
    getList: vi.fn(),
    getOne: vi.fn(),
    getMany: vi.fn(),
    getManyReference: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    ...overrides,
  } as unknown as DataProvider;
}

const translate = (key: string) => key;

describe("GetIdsColliding", () => {
  it("should return empty array when no items have ids", async () => {
    const dp = makeMockDataProvider();
    const result = await GetIdsColliding(false, translate, dp, [{ title: "A" }], "posts", false);
    expect(result).toEqual([]);
  });

  it("should find colliding ids using getMany", async () => {
    const getMany = vi.fn().mockResolvedValue({ data: [{ id: 1 }, { id: 3 }] });
    const dp = makeMockDataProvider({ getMany });

    const csvValues = [
      { id: 1, title: "A" },
      { id: 2, title: "B" },
      { id: 3, title: "C" },
    ];
    const result = await GetIdsColliding(false, translate, dp, csvValues, "posts", false);

    expect(getMany).toHaveBeenCalledWith("posts", { ids: [1, 2, 3] });
    expect(result).toEqual([1, 3]);
  });

  it("should use getOne fallback when disableGetMany is true", async () => {
    const getOne = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce(new Error("Not found"));
    const dp = makeMockDataProvider({ getOne });

    const csvValues = [
      { id: 1, title: "A" },
      { id: 2, title: "B" },
    ];
    const result = await GetIdsColliding(false, translate, dp, csvValues, "posts", true);

    expect(getOne).toHaveBeenCalledTimes(2);
    expect(result).toEqual([1]);
  });

  it("should filter out items without ids", async () => {
    const getMany = vi.fn().mockResolvedValue({ data: [{ id: 1 }] });
    const dp = makeMockDataProvider({ getMany });

    const csvValues = [{ id: 1, title: "A" }, { title: "No ID" }, { id: 3, title: "C" }];
    await GetIdsColliding(false, translate, dp, csvValues, "posts", false);

    expect(getMany).toHaveBeenCalledWith("posts", { ids: [1, 3] });
  });
});

describe("GetIdsCollidingGetMany", () => {
  it("should fall back to getOne when getMany throws", async () => {
    const getMany = vi.fn().mockRejectedValue(new Error("No item with identifier 5"));
    const getOne = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce({ data: { id: 3 } });
    const dp = makeMockDataProvider({ getMany, getOne });

    const result = await GetIdsCollidingGetMany(false, translate, dp, [1, 2, 3], "posts");

    expect(getMany).toHaveBeenCalledTimes(1);
    expect(getOne).toHaveBeenCalledTimes(3);
    expect(result).toEqual([1, 3]);
  });

  it("should return getMany results when it succeeds", async () => {
    const getMany = vi.fn().mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    const getOne = vi.fn();
    const dp = makeMockDataProvider({ getMany, getOne });

    const result = await GetIdsCollidingGetMany(false, translate, dp, [1, 2, 3], "posts");

    expect(getMany).toHaveBeenCalledTimes(1);
    expect(getOne).not.toHaveBeenCalled();
    expect(result).toEqual([1, 2]);
  });
});

describe("GetCSVItems", () => {
  it("should return parsed items from processCsvFile", async () => {
    const { processCsvFile } = await import("./csv-extractor");
    vi.mocked(processCsvFile).mockResolvedValue([
      { id: "1", title: "Hello" },
      { id: "2", title: "World" },
    ]);
    const file = new File([""], "test.csv", { type: "text/csv" });

    const result = await GetCSVItems(false, translate, file, {});

    expect(processCsvFile).toHaveBeenCalledWith(file, {});
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1", title: "Hello" });
    expect(result[1]).toEqual({ id: "2", title: "World" });
  });

  it("should return empty array when processCsvFile returns empty", async () => {
    const { processCsvFile } = await import("./csv-extractor");
    vi.mocked(processCsvFile).mockResolvedValue([]);
    const file = new File([""], "empty.csv", { type: "text/csv" });

    const result = await GetCSVItems(false, translate, file, {});

    expect(result).toEqual([]);
  });

  it("should throw translation key when processCsvFile fails", async () => {
    const { processCsvFile } = await import("./csv-extractor");
    vi.mocked(processCsvFile).mockRejectedValue(new Error("Parse error"));
    const file = new File([""], "bad.csv", { type: "text/csv" });

    await expect(GetCSVItems(false, translate, file, {})).rejects.toBe(
      "csv.parsing.invalidCsvDocument",
    );
  });
});

describe("CheckCSVValidation", () => {
  it("should pass when no validateRow is provided", async () => {
    await expect(CheckCSVValidation(false, translate, [{ id: 1 }])).resolves.toBeUndefined();
  });

  it("should pass when all rows are valid", async () => {
    const validateRow = vi.fn().mockResolvedValue(undefined);
    await expect(
      CheckCSVValidation(false, translate, [{ id: 1 }, { id: 2 }], validateRow),
    ).resolves.toBeUndefined();
    expect(validateRow).toHaveBeenCalledTimes(2);
  });

  it("should throw original Error message when validateRow rejects with Error", async () => {
    const validateRow = vi.fn().mockRejectedValue(new Error("Invalid row"));
    await expect(CheckCSVValidation(false, translate, [{ id: 1 }], validateRow)).rejects.toBe(
      "Invalid row",
    );
  });

  it("should throw translation key when validateRow rejects with non-Error", async () => {
    const validateRow = vi.fn().mockRejectedValue("some string");
    await expect(CheckCSVValidation(false, translate, [{ id: 1 }], validateRow)).rejects.toBe(
      "csv.parsing.failedValidateRow",
    );
  });

  it("should reject with original message when CSV has wrong columns", async () => {
    const validateRow = async (row: any) => {
      if (row.title == null) throw new Error("'title' column is required");
    };
    const wrongColumnData = [
      { id: "1", name: "Alice", email: "alice@test.com" },
      { id: "2", name: "Bob", email: "bob@test.com" },
    ];
    await expect(CheckCSVValidation(false, translate, wrongColumnData, validateRow)).rejects.toBe(
      "'title' column is required",
    );
  });

  it("should pass when CSV rows have correct columns", async () => {
    const validateRow = async (row: any) => {
      if (row.title == null) throw new Error("'title' column is required");
    };
    const correctData = [
      { id: "1", title: "Hello" },
      { id: "2", title: "World" },
    ];
    await expect(
      CheckCSVValidation(false, translate, correctData, validateRow),
    ).resolves.toBeUndefined();
  });
});
