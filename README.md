# Contract Tracker

Contract Tracker application managed by NIT Agents.

## Contract search validation

`normalizeContractSearchCriteria(criteria)` provides a dependency-free validation and normalization boundary for contract searches.

A search requires at least one of:

- `keyword`
- `agency`

`keyword` and `agency` must be strings when supplied. Values are trimmed, blank values are treated as absent, and values longer than 256 characters are rejected.

Optional amount filters:

- `minAmount`
- `maxAmount`

Amounts must be JavaScript numbers. Numeric strings are not coerced. Amounts must be finite and non-negative, and `minAmount` cannot exceed `maxAmount`.

### Notice ID

An optional `noticeId` may accompany a search.

It is trimmed and must:

- be a primitive string
- be non-empty after trimming
- contain no more than 256 characters
- contain only ASCII letters, digits, hyphens, underscores, periods, and colons

Example:

    normalizeContractSearchCriteria({
      keyword: " cloud services ",
      agency: " GSA ",
      minAmount: 1000,
      maxAmount: 100000,
      noticeId: " NIT-2026_A.B:42 ",
    });

Returns:

    {
      keyword: "cloud services",
      agency: "GSA",
      minAmount: 1000,
      maxAmount: 100000,
      noticeId: "NIT-2026_A.B:42"
    }

The caller input is never mutated.

## Errors

`TypeError` is used for invalid supplied types.

`RangeError` is used for invalid values, including:

- missing usable keyword/agency
- overlong strings
- non-finite amounts
- negative amounts
- reversed amount ranges
- invalid notice IDs

## Testing

Tests are executed inside the hardened NIT Node sandbox using Node's built-in test runner.

The project has no third-party dependencies.
