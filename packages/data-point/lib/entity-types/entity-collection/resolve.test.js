/* eslint-env jest */

const resolveCollectionEntity = require("./resolve").resolve;

const FixtureStore = require("../../../test/utils/fixture-store");
const testData = require("../../../test/data.json");

const helpers = require("../../helpers");

let dataPoint;
let resolveReducerBound;

function transform(entityId, value, options) {
  const reducer = dataPoint.entities.get(entityId);
  const accumulator = helpers.createAccumulator(
    value,
    Object.assign(
      {
        context: reducer
      },
      options
    )
  );
  return resolveCollectionEntity(accumulator, resolveReducerBound);
}

beforeAll(() => {
  dataPoint = FixtureStore.create();
  resolveReducerBound = helpers.createReducerResolver(dataPoint);
});

beforeEach(() => {
  dataPoint.middleware.clear();
});

describe("Collection entity type checking", () => {
  async function resolveInvalid(entity, data) {
    await expect(
      dataPoint.resolve(entity, data)
    ).rejects.toThrowErrorMatchingSnapshot();
  }
  test("should throw error from default outputType reducer when output is not valid", () => {
    return resolveInvalid("collection:ObjectsNotAllowed", testData);
  });
  test("should throw error from a custom outputType reducer", () => {
    return resolveInvalid("collection:CustomOutputType", []);
  });
  test("should execute the default outputType reducer before a custom outputType reducer ", () => {
    return resolveInvalid("collection:CustomOutputType", {});
  });
});

describe("entity.collection.map", () => {
  test("should resolve map Transform", async () => {
    const result = await transform("collection:b.1", testData.a.d);
    expect(result).toEqual([2, 4]);
  });

  test("should return array with undefined elements if map reducer is empty list", async () => {
    const result = await transform("collection:b.2", testData.a.b.c);
    expect(result).toEqual([undefined, undefined, undefined]);
  });
});

describe("entity.collection.filter", () => {
  test("should resolve filter Transform", async () => {
    const result = await transform("collection:c.1", testData.a.d);
    expect(result).toEqual([
      {
        d1: 2
      }
    ]);
  });

  test("it should resolve filter transform for collection containing filter property", async () => {
    const result = await transform("collection:c.2", testData.a.b.c);
    expect(result).toEqual([1, 3]);
  });

  test("should return empty array if filter reducer is empty list", async () => {
    const result = await transform("collection:c.3", testData.a.b.c);
    expect(result).toEqual([]);
  });
});

describe("entity.collection.find", () => {
  test("should resolve find Transform", async () => {
    const result = await transform("collection:d.1", testData.a.b.c);
    expect(result).toEqual(1);
  });

  test("should resolve to undefined if none found", async () => {
    const result = await transform("collection:d.2", testData.a.b.c);
    expect(result).toBeUndefined();
  });

  test("should return undefined if find reducer is empty list", async () => {
    const result = await transform("collection:d.3", testData.a.b.c);
    expect(result).toEqual(undefined);
  });
});

describe("entity.collection.compose", () => {
  test("should resolve one modifier", async () => {
    const result = await transform("collection:j.1", testData.a.d);
    expect(result).toEqual([2, 4]);
  });

  test("should resolve multiple modifiers", async () => {
    const result = await transform("collection:j.2", testData.a.d);
    expect(result).toBe(10);
  });

  test("map should handle error and rethrow with appended information", async () => {
    await expect(
      transform("collection:j.3", testData)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot read property 'map' of undefined"`
    );
  });

  test("find should handle error and rethrow with appended information", async () => {
    await expect(
      transform("collection:j.4", testData)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot read property 'length' of undefined"`
    );
  });

  test("filter should handle error and rethrow with appended information", async () => {
    await expect(
      transform("collection:j.5", testData)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Expecting an array or an iterable object but got undefined"`
    );
  });
});
