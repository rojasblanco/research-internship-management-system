# Architecture

## Overview

```text
Structured application source
form · portal · API · controlled import
              │
              ▼
Intake + interview + training + documentation
              │
              ▼
┌──────────────────────────────────────────────┐
│ Internship management data model             │
│ identity · schedules · activity · attendance │
│ periods · progress · reports · transitions   │
└──────────────┬───────────────────┬───────────┘
               │                   │
       scheduled motor         management API
               │                   │
               ▼                   ▼
period consolidation      authenticated portal
+ periodic reports        + controlled actions
```

## Three onboarding routes

The model distinguishes:

1. **standard internship**;
2. **internship with potential employment transition**;
3. **direct onboarding** through another authoritative administrative process.

Shared concepts may be reused, but direct onboarding must never be represented by fabricated internship history.

## Application-source abstraction

The intake layer is provider-neutral. Google Forms can be used as one adapter, but any source that exposes structured retrievable records with a stable identifier and the required intake fields can be integrated.

```text
external intake source
      ↓
adapter/import layer
      ↓
Seguimiento_Ingreso
```

## Period and reporting architecture

Intermediate periods are operational monitoring checkpoints and should not require an operator to execute Apps Script functions manually.

```text
period reaches end date
      ↓
automation motor validates sources
      ↓
┌───────────────────────┬────────────────────────┐
│ coherent              │ blocking inconsistency │
▼                       ▼
auto-close period       review/exception state
freeze snapshots        visible in management UI
register report
create periodic report
publish report metadata
```

The final period/closure follows a different trust boundary:

```text
final stage
   ↓
human review from management portal
   ↓
controlled final closure
   ↓
final evaluation / certificate / recommendation workflow
when supported by organizational policy
```

`Registro_Informes` is the report registry. The management portal should read report status and artifacts from this source rather than maintain a separate browser-only state.

## Target web integration

The management module is designed to live inside an **organization-owned authenticated platform**:

```text
Organization platform
├── authentication
├── authorization / roles
├── audit context
├── internship-management module
└── controlled backend/API
        └── data and automation services

Separate pre-onboarding surface
└── schedule submission page
    ├── anti-abuse verification
    └── optional applicant identity/invitation layer
```

Turnstile is anti-abuse verification, not authentication.

## Web surfaces

### Management portal

The browser should receive only the data and actions authorized for the current user. It should not contain private credentials or unrestricted access to the underlying spreadsheets.

The portal should expose reports, exceptions, final-review actions, and post-write verification without requiring normal operators to open Apps Script.

### Schedule submission page

The schedule page is a separate static interface used during application. It sends a provisional schedule to a controlled backend and generates a PDF after the backend accepts the request. It can be served by any compatible static web host or institutional server.

## Planner terminology

“Planner” means the operational **activity/task log** used for activities, hours, and evidence. It does not imply Microsoft Planner.

## Source-of-truth principles

- `Seguimiento_Ingreso`: application/onboarding state.
- `Variables_Internas`: stable operational attributes after acceptance/formalization.
- `Control_Cursos`: derived course state.
- `Documentacion_Pasantia`: normalized person-document controls.
- `Control_horarios`: official schedule history.
- `Registro_Planner`: normalized activity/task records.
- `Asistencia_Procesada`: normalized attendance.
- `Control_Periodos`: period boundaries, snapshots, and closure state.
- `Progreso_Pasantias`: derived progress.
- `Registro_Informes`: periodic/final report registry and artifact metadata.

## Automation boundaries

Normal operations should be either:

- triggered automatically by the existing automation motor; or
- performed through authenticated, authorized web actions.

The reference architecture avoids adding a dedicated fourth production trigger merely to run reports. Period closure/report automation belongs in the existing scheduled orchestration unless a future redesign explicitly changes the trigger model.

## Public workbook model

The repository provides two fictitious equivalents:

- `internship_management_database_example_es.xlsx` — canonical Spanish reference names;
- `internship_management_database_example_en.xlsx` — English documentation mirror.

The English workbook is for understanding the model; changing production sheet/header names requires an explicit migration of readers and writers.
