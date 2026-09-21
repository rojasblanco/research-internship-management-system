# Maintenance

## General rules

- Do not modify or delete canonical sheets/columns without checking all readers and writers.
- Do not identify people only by name.
- Do not edit derived control tables as if they were source data.
- Preserve schedule/report/history versioning.
- Prefer configuration/catalogs over hard-coded organization-specific values.
- Do not add production triggers casually; the reference architecture is designed around a small controlled trigger set.

## Period/report changes

Changes to period automation must be reviewed together across:

- period boundary/state logic;
- snapshot/closure logic;
- report registry;
- report generator;
- automation motor;
- management API;
- management portal;
- acceptance test.

A normal operator should never need to compensate for a missing integration by executing backend functions manually.

## Data corrections

Do not silently rewrite closed-period snapshots. Use adjustment/versioning mechanisms that preserve historical context.

## Public-release maintenance

Before every public release:

1. sanitize IDs, URLs, keys, names, emails, and organization-specific values;
2. verify public example workbooks contain only fictitious data;
3. run syntax checks and duplicate-global checks;
4. run the acceptance test in staging;
5. verify documentation matches actual code/API/UI behavior;
6. verify all relative documentation links;
7. create release checksums for distributed archives if used.
