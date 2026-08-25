import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_NOTICE_ID_LENGTH,
  normalizeContractSearchCriteria,
} from "../src/contract-search.js";

'use strict';

const baseCriteria = {
  keyword: 'software',
  agency: 'NIT',
  minAmount: 1000,
  maxAmount: 5000,
};

test('omits absent noticeId and preserves existing criteria fields', () => {
  const input = { ...baseCriteria };
  const result = normalizeContractSearchCriteria(input);

  assert.notStrictEqual(result, input);
  assert.deepEqual(result, baseCriteria);
  assert.equal(Object.hasOwn(result, 'noticeId'), false);
});

test('normalizes a valid noticeId without mutating a frozen input', () => {
  const input = Object.freeze({
    ...baseCriteria,
    noticeId: '  NIT-2026_A.B:42  ',
  });

  const result = normalizeContractSearchCriteria(input);

  assert.notStrictEqual(result, input);
  assert.equal(result.noticeId, 'NIT-2026_A.B:42');
  assert.equal(input.noticeId, '  NIT-2026_A.B:42  ');
  assert.equal(result.keyword, baseCriteria.keyword);
  assert.equal(result.agency, baseCriteria.agency);
  assert.equal(result.minAmount, baseCriteria.minAmount);
  assert.equal(result.maxAmount, baseCriteria.maxAmount);
});

test('accepts all approved noticeId punctuation and a 256-character value', () => {
  assert.equal(
    normalizeContractSearchCriteria({ noticeId: 'A-1_b.c:d' }).noticeId,
    'A-1_b.c:d',
  );
  assert.equal(
    normalizeContractSearchCriteria({ noticeId: 'A'.repeat(MAX_NOTICE_ID_LENGTH) }).noticeId.length,
    MAX_NOTICE_ID_LENGTH,
  );
});

test('rejects supplied non-string noticeId values with TypeError', () => {
  const values = [
    undefined,
    null,
    42,
    true,
    [],
    {},
    new String('valid'),
    () => 'valid',
    Symbol('valid'),
    1n,
    { trim: () => 'valid' },
  ];

  for (const noticeId of values) {
    assert.throws(
      () => normalizeContractSearchCriteria({ noticeId }),
      TypeError,
    );
  }
});

test('rejects invalid string noticeId values with RangeError', () => {
  const invalidValues = [
    '',
    ' \t\n ',
    'A'.repeat(MAX_NOTICE_ID_LENGTH + 1),
    'A B',
    'A\tB',
    'A\nB',
    'A/B',
    'A\\B',
    'A"B',
    'A?B',
    'A[B]',
    'A\u0000B',
    'Å',
    'Ａ',
    'A😀B',
  ];

  for (const noticeId of invalidValues) {
    assert.throws(
      () => normalizeContractSearchCriteria({ noticeId }),
      RangeError,
    );
  }
});

test('ignores inherited noticeId and safely handles shadowed hasOwnProperty', () => {
  const inherited = Object.create({ noticeId: 'INHERITED' });
  inherited.keyword = 'software';

  const inheritedResult = normalizeContractSearchCriteria(inherited);
  assert.equal(Object.hasOwn(inheritedResult, 'noticeId'), false);

  const shadowed = {
    noticeId: 'SAFE-1',
    hasOwnProperty: () => false,
  };
  assert.equal(normalizeContractSearchCriteria(shadowed).noticeId, 'SAFE-1');
});
