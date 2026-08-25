'use strict';

const MAX_NOTICE_ID_LENGTH = 256;
const NOTICE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

/**
 * Returns normalized contract-search criteria without mutating the input.
 * Existing criteria fields are preserved as provided.
 *
 * @param {object} criteria
 * @returns {object}
 */
function normalizeContractSearchCriteria(criteria) {
  const normalized = {
    keyword: criteria.keyword,
    agency: criteria.agency,
    minAmount: criteria.minAmount,
    maxAmount: criteria.maxAmount,
  };

  if (hasOwn(criteria, 'noticeId')) {
    const noticeId = criteria.noticeId;

    if (typeof noticeId !== 'string') {
      throw new TypeError('noticeId must be a primitive string');
    }

    const trimmedNoticeId = noticeId.trim();

    if (trimmedNoticeId.length === 0) {
      throw new RangeError('noticeId must not be empty after trimming');
    }

    if (trimmedNoticeId.length > MAX_NOTICE_ID_LENGTH) {
      throw new RangeError(`noticeId must not exceed ${MAX_NOTICE_ID_LENGTH} characters`);
    }

    if (!NOTICE_ID_PATTERN.test(trimmedNoticeId)) {
      throw new RangeError('noticeId contains unsupported characters');
    }

    normalized.noticeId = trimmedNoticeId;
  }

  return normalized;
}


export {
  MAX_NOTICE_ID_LENGTH,
  normalizeContractSearchCriteria,
};

