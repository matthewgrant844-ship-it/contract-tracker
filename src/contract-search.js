/**
 * Maximum accepted Unicode code points for each text criterion.
 */
const MAX_TEXT_CODE_POINTS = 200;
const MAX_AMOUNT = 999999999999.99;
const ALLOWED_FIELDS = new Set(['keyword', 'agency', 'minAmount', 'maxAmount']);
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F-\u009F]/u;

/**
 * Stable error type for expected contract-search validation failures.
 */
export class ContractSearchValidationError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = 'ContractSearchValidationError';
    this.code = code;
    if (field !== undefined) {
      this.field = field;
    }
  }
}

function validationError(code, field, message) {
  return new ContractSearchValidationError(code, field, message);
}

function isSupportedInputObject(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

function validateText(input, field) {
  if (typeof input !== 'string') {
    throw validationError('INVALID_FIELD_TYPE', field, `${field} must be a primitive string.`);
  }

  const normalized = input.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  if (CONTROL_CHARACTER.test(normalized)) {
    throw validationError('INVALID_TEXT_CONTENT', field, `${field} must not contain control characters.`);
  }

  if (Array.from(normalized).length > MAX_TEXT_CODE_POINTS) {
    throw validationError('FIELD_TOO_LONG', field, `${field} must not exceed ${MAX_TEXT_CODE_POINTS} Unicode code points.`);
  }

  return normalized;
}

function hasAtMostTwoDecimalPlaces(value) {
  const scaled = value * 100;
  return Number.isSafeInteger(scaled) || Math.abs(scaled - Math.round(scaled)) < 1e-8;
}

function validateAmount(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError('INVALID_AMOUNT', field, `${field} must be a finite primitive number.`);
  }

  if (value < 0 || value > MAX_AMOUNT) {
    throw validationError('AMOUNT_OUT_OF_RANGE', field, `${field} must be between 0 and ${MAX_AMOUNT}.`);
  }

  if (!hasAtMostTwoDecimalPlaces(value)) {
    throw validationError('AMOUNT_PRECISION_INVALID', field, `${field} must have no more than two decimal places.`);
  }

  return value;
}

/**
 * Validates and normalizes allowlisted Contract Tracker search criteria.
 *
 * @param {object} input Search criteria containing only keyword, agency,
 *   minAmount, and maxAmount.
 * @returns {object} A newly created normalized criteria object.
 * @throws {ContractSearchValidationError} For expected validation failures.
 */
export function validateContractSearch(input) {
  if (!isSupportedInputObject(input)) {
    throw validationError('INVALID_INPUT', undefined, 'Search criteria must be a plain object.');
  }

  for (const field of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(field)) {
      throw validationError('UNKNOWN_FIELD', field, 'Search criteria contains an unsupported field.');
    }
  }

  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(input, 'keyword')) {
    const keyword = validateText(input.keyword, 'keyword');
    if (keyword !== undefined) {
      normalized.keyword = keyword;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'agency')) {
    const agency = validateText(input.agency, 'agency');
    if (agency !== undefined) {
      normalized.agency = agency;
    }
  }

  if (normalized.keyword === undefined && normalized.agency === undefined) {
    throw validationError('EMPTY_SEARCH', undefined, 'At least one non-empty text search criterion is required.');
  }

  if (Object.prototype.hasOwnProperty.call(input, 'minAmount')) {
    normalized.minAmount = validateAmount(input.minAmount, 'minAmount');
  }

  if (Object.prototype.hasOwnProperty.call(input, 'maxAmount')) {
    normalized.maxAmount = validateAmount(input.maxAmount, 'maxAmount');
  }

  if (
    normalized.minAmount !== undefined &&
    normalized.maxAmount !== undefined &&
    normalized.minAmount > normalized.maxAmount
  ) {
    throw validationError('AMOUNT_RANGE_INVALID', undefined, 'minAmount must be less than or equal to maxAmount.');
  }

  return normalized;
}
