import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_NOTICE_ID_LENGTH,
  MAX_TEXT_LENGTH,
  normalizeContractSearchCriteria,
} from "../src/contract-search.js";


test("accepts and trims keyword-only searches", () => {
  assert.deepEqual(
    normalizeContractSearchCriteria({
      keyword: "  cloud services  ",
    }),
    {
      keyword: "cloud services",
    },
  );
});


test("accepts and trims agency-only searches", () => {
  assert.deepEqual(
    normalizeContractSearchCriteria({
      agency: "  GSA  ",
    }),
    {
      agency: "GSA",
    },
  );
});


test("accepts combined search criteria and amounts", () => {
  assert.deepEqual(
    normalizeContractSearchCriteria({
      keyword: " software ",
      agency: " GSA ",
      minAmount: 1000,
      maxAmount: 100000,
    }),
    {
      keyword: "software",
      agency: "GSA",
      minAmount: 1000,
      maxAmount: 100000,
    },
  );
});


test("requires at least keyword or agency", () => {
  assert.throws(
    () => normalizeContractSearchCriteria({}),
    RangeError,
  );

  assert.throws(
    () =>
      normalizeContractSearchCriteria({
        keyword: "   ",
        agency: "\t",
      }),
    RangeError,
  );
});


test("rejects invalid text values", () => {
  const invalidValues = [
    null,
    42,
    true,
    {},
    [],
    undefined,
  ];

  for (const value of invalidValues) {
    assert.throws(
      () =>
        normalizeContractSearchCriteria({
          keyword: value,
        }),
      TypeError,
    );
  }

  assert.throws(
    () =>
      normalizeContractSearchCriteria({
        keyword: "A".repeat(
          MAX_TEXT_LENGTH + 1,
        ),
      }),
    RangeError,
  );
});


test("accepts valid finite non-negative amounts", () => {
  assert.deepEqual(
    normalizeContractSearchCriteria({
      keyword: "software",
      minAmount: 0,
      maxAmount: 125000.50,
    }),
    {
      keyword: "software",
      minAmount: 0,
      maxAmount: 125000.50,
    },
  );
});


test("rejects non-number amounts with TypeError", () => {
  for (const value of [
    "100",
    null,
    true,
    {},
    [],
    undefined,
  ]) {
    assert.throws(
      () =>
        normalizeContractSearchCriteria({
          keyword: "software",
          minAmount: value,
        }),
      TypeError,
    );
  }
});


test("rejects invalid numeric ranges with RangeError", () => {
  for (const value of [
    NaN,
    Infinity,
    -Infinity,
    -1,
  ]) {
    assert.throws(
      () =>
        normalizeContractSearchCriteria({
          agency: "GSA",
          minAmount: value,
        }),
      RangeError,
    );
  }

  assert.throws(
    () =>
      normalizeContractSearchCriteria({
        keyword: "cloud",
        minAmount: 5000,
        maxAmount: 1000,
      }),
    RangeError,
  );
});


test("accepts and normalizes a valid noticeId", () => {
  const input = Object.freeze({
    keyword: " software ",
    noticeId: " NIT-2026_A.B:42 ",
  });

  const result =
    normalizeContractSearchCriteria(input);

  assert.deepEqual(
    result,
    {
      keyword: "software",
      noticeId: "NIT-2026_A.B:42",
    },
  );

  assert.equal(
    input.noticeId,
    " NIT-2026_A.B:42 ",
  );

  assert.notStrictEqual(
    result,
    input,
  );
});


test("accepts noticeId boundary and approved punctuation", () => {
  const valid = "A-1_b.c:d";

  assert.equal(
    normalizeContractSearchCriteria({
      agency: "GSA",
      noticeId: valid,
    }).noticeId,
    valid,
  );

  const maximum =
    "A".repeat(MAX_NOTICE_ID_LENGTH);

  assert.equal(
    normalizeContractSearchCriteria({
      keyword: "software",
      noticeId: maximum,
    }).noticeId.length,
    MAX_NOTICE_ID_LENGTH,
  );
});


test("rejects non-string noticeId values with TypeError", () => {
  for (const noticeId of [
    42,
    true,
    null,
    {},
    [],
    undefined,
  ]) {
    assert.throws(
      () =>
        normalizeContractSearchCriteria({
          keyword: "software",
          noticeId,
        }),
      TypeError,
    );
  }
});


test("rejects invalid noticeId strings with RangeError", () => {
  const invalidValues = [
    "",
    "   ",
    "A B",
    "A/B",
    "A\\B",
    "A?B",
    "A#B",
    "Å",
    "😀",
    "A".repeat(
      MAX_NOTICE_ID_LENGTH + 1,
    ),
  ];

  for (const noticeId of invalidValues) {
    assert.throws(
      () =>
        normalizeContractSearchCriteria({
          agency: "GSA",
          noticeId,
        }),
      RangeError,
    );
  }
});


test("ignores inherited noticeId", () => {
  const inherited = Object.create({
    noticeId: "INHERITED",
  });

  inherited.keyword = "software";

  const result =
    normalizeContractSearchCriteria(
      inherited,
    );

  assert.deepEqual(
    result,
    {
      keyword: "software",
    },
  );

  assert.equal(
    Object.hasOwn(result, "noticeId"),
    false,
  );
});


test("safely handles shadowed hasOwnProperty", () => {
  const input = {
    keyword: "software",
    noticeId: " SAFE-1 ",
    hasOwnProperty: "shadowed",
  };

  const result =
    normalizeContractSearchCriteria(
      input,
    );

  assert.deepEqual(
    result,
    {
      keyword: "software",
      noticeId: "SAFE-1",
    },
  );
});


test("rejects invalid top-level criteria", () => {
  for (const value of [
    null,
    "search",
    42,
    true,
    [],
  ]) {
    assert.throws(
      () =>
        normalizeContractSearchCriteria(
          value,
        ),
      TypeError,
    );
  }
});
