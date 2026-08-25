const MAX_TEXT_LENGTH = 256;
const MAX_NOTICE_ID_LENGTH = 256;

const NOTICE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

const hasOwn = (object, property) =>
  Object.prototype.hasOwnProperty.call(
    object,
    property,
  );


function requireCriteriaObject(criteria) {
  if (
    criteria === null
    || typeof criteria !== "object"
    || Array.isArray(criteria)
  ) {
    throw new TypeError(
      "criteria must be an object",
    );
  }
}


function normalizeText(
  criteria,
  field,
) {
  if (!hasOwn(criteria, field)) {
    return undefined;
  }

  const value = criteria[field];

  if (typeof value !== "string") {
    throw new TypeError(
      `${field} must be a string`,
    );
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new RangeError(
      `${field} must not exceed ${MAX_TEXT_LENGTH} characters`,
    );
  }

  return trimmed;
}


function normalizeAmount(
  criteria,
  field,
) {
  if (!hasOwn(criteria, field)) {
    return undefined;
  }

  const value = criteria[field];

  if (typeof value !== "number") {
    throw new TypeError(
      `${field} must be a number`,
    );
  }

  if (!Number.isFinite(value)) {
    throw new RangeError(
      `${field} must be finite`,
    );
  }

  if (value < 0) {
    throw new RangeError(
      `${field} must be non-negative`,
    );
  }

  return Object.is(value, -0)
    ? 0
    : value;
}


function normalizeNoticeId(criteria) {
  if (!hasOwn(criteria, "noticeId")) {
    return undefined;
  }

  const value = criteria.noticeId;

  if (typeof value !== "string") {
    throw new TypeError(
      "noticeId must be a primitive string",
    );
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new RangeError(
      "noticeId must not be empty after trimming",
    );
  }

  if (
    trimmed.length > MAX_NOTICE_ID_LENGTH
  ) {
    throw new RangeError(
      `noticeId must not exceed ${MAX_NOTICE_ID_LENGTH} characters`,
    );
  }

  if (!NOTICE_ID_PATTERN.test(trimmed)) {
    throw new RangeError(
      "noticeId contains unsupported characters",
    );
  }

  return trimmed;
}


function normalizeContractSearchCriteria(
  criteria,
) {
  requireCriteriaObject(criteria);

  const keyword = normalizeText(
    criteria,
    "keyword",
  );

  const agency = normalizeText(
    criteria,
    "agency",
  );

  /*
   * Contract Tracker search requires an actual
   * search selector. noticeId is supplemental and
   * does not silently replace this foundation rule.
   */
  if (
    keyword === undefined
    && agency === undefined
  ) {
    throw new RangeError(
      "at least keyword or agency is required",
    );
  }

  const minAmount = normalizeAmount(
    criteria,
    "minAmount",
  );

  const maxAmount = normalizeAmount(
    criteria,
    "maxAmount",
  );

  if (
    minAmount !== undefined
    && maxAmount !== undefined
    && minAmount > maxAmount
  ) {
    throw new RangeError(
      "minAmount must not exceed maxAmount",
    );
  }

  const noticeId = normalizeNoticeId(
    criteria,
  );

  const normalized = {};

  if (keyword !== undefined) {
    normalized.keyword = keyword;
  }

  if (agency !== undefined) {
    normalized.agency = agency;
  }

  if (minAmount !== undefined) {
    normalized.minAmount = minAmount;
  }

  if (maxAmount !== undefined) {
    normalized.maxAmount = maxAmount;
  }

  if (noticeId !== undefined) {
    normalized.noticeId = noticeId;
  }

  return normalized;
}


export {
  MAX_NOTICE_ID_LENGTH,
  MAX_TEXT_LENGTH,
  normalizeContractSearchCriteria,
};
