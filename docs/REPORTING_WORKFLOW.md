# Reporting workflow

## Purpose

Periodic reports are a monitoring output of the system, not a separate manual workflow. The design goal is that normal operators do not need to open Apps Script or run report functions.

## Intermediate periods

For each non-final monitoring period:

1. the period reaches its configured end date;
2. the automation motor refreshes the required sources;
3. validation checks whether the period can be consolidated safely;
4. if valid, the system freezes the period snapshots and marks it closed;
5. `Registro_Informes` is created/updated for that period;
6. the periodic report is generated automatically;
7. report metadata and artifact links become available to the management API;
8. the portal shows the report as available.

If a blocking inconsistency exists, the period/report becomes an **exception requiring review** rather than failing silently.

## Final closure

Final closure is intentionally different from intermediate monitoring. It should require an authorized human review from the management portal before finalizing data that may support a final evaluation, certificate, letter, or recommendation.

The exact final document set is organization-specific and must not be claimed as validated until implemented and tested.

## Management portal requirements

The Reports area should support, subject to authorization:

- report list by person;
- period identifier and report type;
- generation status;
- generated/updated timestamp;
- artifact link;
- open/download behavior where supported;
- controlled regeneration;
- visible generation errors/exceptions;
- distinction between periodic monitoring reports and final/closure outputs.

The browser should not invent report state. `Registro_Informes` and the backend/API remain authoritative.

## Regeneration

Regeneration should be a controlled web action. It must:

1. authenticate/authorize the operator;
2. identify the person/report by stable ID;
3. preserve audit/version context;
4. regenerate only the permitted report;
5. update the report registry;
6. reread the authoritative state and return verification.

## Traceability

Closed-period snapshots should remain immutable historical evidence. Later corrections should use the system's adjustment/versioning mechanisms rather than silently rewriting the original snapshot.
