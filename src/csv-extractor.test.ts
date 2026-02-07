import { describe, it, expect } from "vitest";
import { processCsvData } from "./csv-extractor";

describe("processCsvData", () => {
  it("should parse array-of-arrays format (header row + data rows)", () => {
    const data: any[][] = [
      ["id", "title", "body"],
      ["1", "First Post", "Hello"],
      ["2", "Second Post", "World"],
    ];

    const result = processCsvData(data);
    expect(result).toEqual([
      { id: "1", title: "First Post", body: "Hello" },
      { id: "2", title: "Second Post", body: "World" },
    ]);
  });

  it("should handle nested dot-notation keys", () => {
    const data: any[][] = [
      ["id", "address.city", "address.zip"],
      ["1", "Tokyo", "100-0001"],
    ];

    const result = processCsvData(data);
    expect(result).toEqual([
      { id: "1", address: { city: "Tokyo", zip: "100-0001" } },
    ]);
  });

  it("should handle empty data (header only)", () => {
    const data: any[][] = [["id", "title"]];
    const result = processCsvData(data);
    expect(result).toEqual([]);
  });

  it("should handle object-format data (papaparse header mode)", () => {
    const data: any[] = [
      { id: "1", title: "First Post" },
      { id: "2", title: "Second Post" },
    ];

    const result = processCsvData(data);
    expect(result).toEqual([
      { id: "1", title: "First Post" },
      { id: "2", title: "Second Post" },
    ]);
  });

  it("should handle null keys gracefully", () => {
    const data: any[][] = [
      ["id", null, "title"],
      ["1", "ignored", "Hello"],
    ];

    const result = processCsvData(data);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(result[0].title).toBe("Hello");
  });

  it("should handle nested dot-notation in object format", () => {
    const data: any[] = [
      { id: "1", "meta.author": "Alice", "meta.date": "2025-01-01" },
    ];

    const result = processCsvData(data);
    expect(result).toEqual([
      { id: "1", meta: { author: "Alice", date: "2025-01-01" } },
    ]);
  });
});
