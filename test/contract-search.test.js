import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContractSearchValidationError,
  validateContractSearch,
} from '../src/contract-search.js';

function assertValidationError(callback, code, field) {
  assert.throws(callback, (error) => {
    assert.ok(error instanceof ContractSearchValidationError);
    assert.equal(error.code, code);
    if (field !== undefined) {
      assert.equal(error.field, field);
    }
    return true;
  });
}

test('normalizes a keyword into a new object', () => {
  const input = { keyword: '  bridge repair  ' };
  const result = validateContractSearch(input);

  assert.deepEqual(result, { keyword: 'bridge repair' });
  assert.notStrictEqual(result, input);
});

test('normalizes an agency criterion', () => {
  assert.deepEqual(validateContractSearch({ agency: '  Department of Transportation  ' }), {
    agency: 'Department of Transportation',
  });
});

test('accepts normalized keyword and agency together', () => {
  assert.deepEqual(validateContractSearch({ keyword: 'roads', agency: 'City Works' }), {
    keyword: 'roads',
    agency: 'City Works',
  });
});

test('rejects searches without a non-empty keyword or agency', () => {
  assertValidationError(() => validateContractSearch({}), 'EMPTY_SEARCH');
  assertValidationError(() => validateContractSearch({ keyword: ' ', agency: '\t' }), 'EMPTY_SEARCH');
});

test('rejects negative amounts', () => {
  assertValidationError(() => validateContractSearch({ keyword: 'roads', minAmount: -1 }), 'AMOUNT_OUT_OF_RANGE', 'minAmount');
});

test('rejects non-finite amounts', () => {
  assertValidationError(() => validateContractSearch({ keyword: 'roads', minAmount: NaN }), 'INVALID_AMOUNT', 'minAmount');
  assertValidationError(() => validateContractSearch({ keyword: 'roads', maxAmount: Infinity }), 'INVALID_AMOUNT', 'maxAmount');
});

test('rejects an inverted amount range', () => {
  assertValidationError(
    () => validateContractSearch({ keyword: 'roads', minAmount: 200, maxAmount: 100 }),
    'AMOUNT_RANGE_INVALID',
  );
});

test('accepts a valid amount range including zero and two decimal places', () => {
  assert.deepEqual(
    validateContractSearch({ keyword: 'roads', minAmount: 0, maxAmount: 999999999999.99 }),
    { keyword: 'roads', minAmount: 0, maxAmount: 999999999999.99 },
  );
  assert.deepEqual(
    validateContractSearch({ agency: 'Works', minAmount: 10.25, maxAmount: 10.25 }),
    { agency: 'Works', minAmount: 10.25, maxAmount: 10.25 },
  );
});

test('does not mutate the caller input', () => {
  const input = { keyword: '  roads  ', agency: '  Works ', minAmount: 0, maxAmount: 10.5 };
  const original = { ...input };

  const result = validateContractSearch(input);

  assert.deepEqual(input, original);
  assert.deepEqual(result, { keyword: 'roads', agency: 'Works', minAmount: 0, maxAmount: 10.5 });
  assert.notStrictEqual(result, input);
});

test('enforces documented security validation boundaries', () => {
  assertValidationError(() => validateContractSearch(null), 'INVALID_INPUT');
  assertValidationError(() => validateContractSearch([]), 'INVALID_INPUT');
  assertValidationError(() => validateContractSearch('roads'), 'INVALID_INPUT');
  assertValidationError(() => validateContractSearch({ keyword: 1 }), 'INVALID_FIELD_TYPE', 'keyword');
  assertValidationError(() => validateContractSearch({ keyword: 'a'.repeat(201) }), 'FIELD_TOO_LONG', 'keyword');
  assertValidationError(() => validateContractSearch({ keyword: 'road\u0000work' }), 'INVALID_TEXT_CONTENT', 'keyword');
  assertValidationError(() => validateContractSearch({ keyword: 'roads', extra: true }), 'UNKNOWN_FIELD', 'extra');
  assertValidationError(() => validateContractSearch({ keyword: 'roads', minAmount: 1.001 }), 'AMOUNT_PRECISION_INVALID', 'minAmount');
});

test('accepts text at the 200 Unicode code point boundary', () => {
  const keyword = '😀'.repeat(200);
  assert.deepEqual(validateContractSearch({ keyword }), { keyword });
});
