# AI / developer context prompt

Use this file to contextualize a future AI or developer working on the **public project**. It is not an employee-specific handoff document.

## Project

This repository implements a research internship/new-member management system using Google Apps Script, Google Sheets/Drive, a management web interface, and a separate schedule-submission page.

The system was designed progressively because the original operational environment did not have a single complete onboarding route.

## Core routes

Preserve three distinct routes:

1. standard internship;
2. internship with potential employment transition;
3. direct onboarding through another authoritative administrative source.

Do not fabricate internship history for direct members. An internship does not guarantee employment.

## Intake abstraction

Do not treat Google Forms as a conceptual dependency. Intake can come from any structured retrievable source through an adapter. A submitted application must not create an operational internship record before documented acceptance.

## Activity Planner

“Planner” means an activity/task log with hours and evidence; it is not necessarily Microsoft Planner.

## Periods and reporting

The intended current architecture is:

- intermediate periods are automated monitoring checkpoints;
- when data are coherent, the existing automation motor closes the intermediate period, freezes snapshots, updates the report registry, and generates the periodic report automatically;
- blocking inconsistencies become explicit review/exception states;
- final closure requires authorized human review from the management portal;
- normal operators must not run Apps Script functions manually;
- report access/regeneration must be exposed through controlled web/API actions;
- `Registro_Informes` is authoritative for report state/artifacts.

Do not introduce a separate fourth production trigger merely for reports unless the architecture is explicitly redesigned and validated.

## Schedule versioning

The application schedule is provisional. H1 is the first official schedule from the real start date. Later H2/H3 versions must preserve prior schedules. A dedicated post-start schedule-change workflow is future work until implemented.

## Security

Never add production credentials, Secret Keys, real IDs, personal data, operational evidence, private URLs, or organization-specific confidential data to the public repository.

Turnstile Site Keys are browser-visible/public; Secret Keys remain server-side. Turnstile is anti-abuse verification, not authentication.

The management portal should live behind organization-controlled authentication and authorization. External applicant surfaces may add invitation or verification layers when required.

## Public repository conventions

- README is a professional project overview, not an operator manual.
- Detailed operation/architecture belongs in `docs/`.
- Public examples use fictitious data.
- Keep Spanish canonical and English documentation workbooks aligned semantically.
- Preserve a clear distinction between implemented capabilities and future work.
- When code, API, web UI, or data model changes, update the corresponding documentation together.
- Before claiming a feature exists, inspect the actual source and acceptance behavior.

## Reference operational rules

The public reference currently documents 5 induction courses, `score >= 70`, a 14-day training deadline, and 30-day monitoring periods. These are configurable reference rules, not universal policy.

## Licensing/provenance

The sanitized public release is distributed under the MIT License; the published GitHub repository carries the `LICENSE` file. Organizational data, infrastructure, trademarks, credentials, private documents, and other non-public assets are outside the public license scope.
