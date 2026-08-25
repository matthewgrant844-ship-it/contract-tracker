# Contract Tracker

Contract Tracker application managed by NIT Agents.

## Contract search criteria

`normalizeContractSearchCriteria(criteria)` accepts the existing `keyword`,
`agency`, `minAmount`, and `maxAmount` criteria without changing their values.
It returns a new normalized object and does not mutate the caller's input.

An optional `noticeId` may also be supplied as an own property on `criteria`.
When supplied, it must be a primitive string. The value is trimmed, must be
non-empty after trimming, must be no longer than 256 characters, and may contain
only ASCII letters, digits, hyphens (`-`), underscores (`_`), periods (`.`), and
colons (`:`). Internal whitespace is not permitted.

For example, `"  NIT-2026_A.B:42  "` is normalized to
`"NIT-2026_A.B:42"`.

A supplied non-string `noticeId` (including explicit `undefined`) throws a
`TypeError`. A supplied string that is empty after trimming, exceeds 256
characters, or contains a disallowed character throws a `RangeError`. An absent
or inherited `noticeId` is not included in normalized output.
