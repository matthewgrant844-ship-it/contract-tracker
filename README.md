# Contract Tracker

Contract Tracker is managed by NIT Agents. This repository currently provides a small, dependency-free validation foundation for future contract-search integrations. It does not provide an HTTP API, persistence, user interface, authentication, deployment, credentials, external-provider integration, or network behavior.

## Requirements

- Node.js **20 or later**
- No package installation or `node_modules` directory is required.

The project uses explicit JavaScript ES modules (`"type": "module"`).

## Contract search validation

Import the named validator from `src/contract-search.js`:

```js
import { validateContractSearch } from './src/contract-search.js';

const criteria = validateContractSearch({
  keyword: '  bridge repair  ',
  agency: 'Department of Transportation',
  minAmount: 0,
  maxAmount: 100000.25,
});

// {
//   keyword: 'bridge repair',
//   agency: 'Department of Transportation',
//   minAmount: 0,
//   maxAmount: 100000.25
// }
```

`validateContractSearch(input)` accepts a plain object containing only these allowlisted own properties:

- `keyword` (optional primitive string)
- `agency` (optional primitive string)
- `minAmount` (optional primitive number)
- `maxAmount` (optional primitive number)

`keyword` and `agency` are trimmed without mutating the input. At least one must be non-empty after trimming. Non-empty text is limited to 200 Unicode code points and must not contain control characters, including NUL. Valid Unicode text is otherwise preserved without Unicode normalization.

Amounts must be finite, non-negative primitive numbers from `0` through `999999999999.99` inclusive, with no more than two decimal places. When both values are supplied, `minAmount` must be less than or equal to `maxAmount`.

The validator rejects unknown own properties, ignores inherited properties, and returns a newly created object containing only normalized, accepted allowlisted fields. Empty trimmed text fields are omitted. It never mutates or returns the caller input object.

Expected validation failures throw `ContractSearchValidationError`, which includes a stable `code`, an applicable `field` where relevant, and a safe message that does not echo untrusted values. Supported codes are:

- `INVALID_INPUT`
- `UNKNOWN_FIELD`
- `INVALID_FIELD_TYPE`
- `EMPTY_SEARCH`
- `FIELD_TOO_LONG`
- `INVALID_TEXT_CONTENT`
- `INVALID_AMOUNT`
- `AMOUNT_PRECISION_INVALID`
- `AMOUNT_OUT_OF_RANGE`
- `AMOUNT_RANGE_INVALID`

## Local verification

All checks are offline and use Node built-ins only:

```sh
npm test
npm run check:syntax
npm run check
```

## Integration caution

This validator does not itself make downstream API or database query construction safe. Future integrations must build requests from allowlisted values, use trusted endpoint configuration and parameterized query mechanisms, apply bounded timeouts, result sizes, and pagination, validate downstream responses, and use managed secrets. Any expansion into external APIs, authentication, credentials, persistence, deployment, command execution, or user-controlled URL/path/host handling requires separate security review.
