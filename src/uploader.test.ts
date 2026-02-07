import { describe, it, expect, vi } from "vitest";
import { create, update, createInDataProvider } from "./uploader";
import { DataProvider } from "ra-core";

function makeMockDataProvider(overrides: Partial<DataProvider> = {}): DataProvider {
  return {
    getList: vi.fn(),
    getOne: vi.fn(),
    getMany: vi.fn(),
    getManyReference: vi.fn(),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    ...overrides,
  } as unknown as DataProvider;
}

describe("createInDataProvider", () => {
  it("should use createMany when available", async () => {
    const createMany = vi.fn().mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    const dp = makeMockDataProvider();
    (dp as any).createMany = createMany;

    const values = [{ title: "A" }, { title: "B" }];
    const result = await createInDataProvider(false, false, dp, "posts", values);

    expect(createMany).toHaveBeenCalledWith("posts", { data: values });
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(true);
  });

  it("should fallback to create when createMany throws 'Unknown dataProvider'", async () => {
    const createMany = vi
      .fn()
      .mockRejectedValue(new Error("Unknown dataProvider function: createMany"));
    const createFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ create: createFn });
    (dp as any).createMany = createMany;

    const values = [{ title: "A" }, { title: "B" }];
    const result = await createInDataProvider(false, false, dp, "posts", values);

    expect(createFn).toHaveBeenCalledTimes(2);
    expect(result.every((r) => r.success)).toBe(true);
  });

  it("should use individual create when disableCreateMany is true", async () => {
    const createFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ create: createFn });

    const values = [{ title: "A" }, { title: "B" }, { title: "C" }];
    const result = await createInDataProvider(false, true, dp, "posts", values);

    expect(createFn).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.success)).toBe(true);
  });

  it("should report failures for individual creates", async () => {
    const createFn = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce(new Error("Server error"));
    const dp = makeMockDataProvider({ create: createFn });

    const values = [{ title: "OK" }, { title: "FAIL" }];
    const result = await createInDataProvider(false, true, dp, "posts", values);

    expect(result).toHaveLength(2);
    expect(result[0].success).toBe(true);
    expect(result[1].success).toBe(false);
  });
});

describe("create (high-level)", () => {
  it("should call preCommitCallback before creating", async () => {
    const createFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ create: createFn });
    const preCommit = vi.fn().mockResolvedValue([{ title: "Transformed" }]);

    await create(false, true, dp, "posts", [{ title: "Original" }], preCommit);

    expect(preCommit).toHaveBeenCalledWith("create", [{ title: "Original" }]);
    expect(createFn).toHaveBeenCalledWith("posts", { data: { title: "Transformed" } });
  });

  it("should call postCommitCallback with report items", async () => {
    const createFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ create: createFn });
    const postCommit = vi.fn();

    await create(false, true, dp, "posts", [{ title: "A" }], undefined, postCommit);

    expect(postCommit).toHaveBeenCalledTimes(1);
    const reportItems = postCommit.mock.calls[0][0];
    expect(reportItems).toHaveLength(1);
    expect(reportItems[0].success).toBe(true);
  });

  it("should reject when create fails and no postCommitCallback", async () => {
    const createFn = vi.fn().mockRejectedValue(new Error("fail"));
    const dp = makeMockDataProvider({ create: createFn });

    await expect(create(false, true, dp, "posts", [{ title: "A" }])).rejects.toBeDefined();
  });

  it("should not reject when create fails but postCommitCallback is set", async () => {
    const createFn = vi.fn().mockRejectedValue(new Error("fail"));
    const dp = makeMockDataProvider({ create: createFn });
    const postCommit = vi.fn();

    await create(false, true, dp, "posts", [{ title: "A" }], undefined, postCommit);

    expect(postCommit).toHaveBeenCalledTimes(1);
    const reportItems = postCommit.mock.calls[0][0];
    expect(reportItems[0].success).toBe(false);
  });
});

describe("update (high-level)", () => {
  it("should call preCommitCallback with 'overwrite' action", async () => {
    const updateFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ update: updateFn });
    const preCommit = vi.fn().mockResolvedValue([{ id: 1, title: "Transformed" }]);

    await update(false, true, dp, "posts", [{ id: 1, title: "Original" }], preCommit);

    expect(preCommit).toHaveBeenCalledWith("overwrite", [{ id: 1, title: "Original" }]);
  });

  it("should update records via dataProvider.update", async () => {
    const updateFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ update: updateFn });

    await update(false, true, dp, "posts", [{ id: 1, title: "Updated" }]);

    expect(updateFn).toHaveBeenCalledWith("posts", {
      id: 1,
      data: { id: 1, title: "Updated" },
      previousData: null,
    });
  });

  it("should call postCommitCallback with report items", async () => {
    const updateFn = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const dp = makeMockDataProvider({ update: updateFn });
    const postCommit = vi.fn();

    await update(false, true, dp, "posts", [{ id: 1, title: "A" }], undefined, postCommit);

    expect(postCommit).toHaveBeenCalledTimes(1);
    const reportItems = postCommit.mock.calls[0][0];
    expect(reportItems).toHaveLength(1);
    expect(reportItems[0].success).toBe(true);
  });

  it("should reject when update fails and no postCommitCallback", async () => {
    const updateFn = vi.fn().mockRejectedValue(new Error("fail"));
    const dp = makeMockDataProvider({ update: updateFn });

    await expect(update(false, true, dp, "posts", [{ id: 1, title: "A" }])).rejects.toBeDefined();
  });

  it("should not reject when update fails but postCommitCallback is set", async () => {
    const updateFn = vi.fn().mockRejectedValue(new Error("fail"));
    const dp = makeMockDataProvider({ update: updateFn });
    const postCommit = vi.fn();

    await update(false, true, dp, "posts", [{ id: 1, title: "A" }], undefined, postCommit);

    expect(postCommit).toHaveBeenCalledTimes(1);
    const reportItems = postCommit.mock.calls[0][0];
    expect(reportItems[0].success).toBe(false);
  });
});
