# Integrations

## Intake/application source

The system is not conceptually tied to a single form provider. A deployment can integrate any application source that can provide structured, retrievable records with a stable identifier and the fields required by the intake contract.

Examples may include a web form, institutional portal, form service, API, or controlled import. The adapter maps the external record into `Seguimiento_Ingreso` without creating an operational internship record before acceptance.

## Google Sheets

The reference implementation uses Google Sheets as its structured operational datastore. Readers and writers should rely on canonical headers/contracts rather than arbitrary column positions whenever practical.

## Google Drive

Drive can store applicant files, personal folders, evidence, and generated report artifacts. Public repository examples must never include real private folder/file IDs.

## Activity Planner

The person's activity/task log is synchronized into `Registro_Planner`, where it can be compared with schedule, attendance, periods, and progress.

## Attendance

Attendance is imported from an external source and normalized into `Asistencia_Procesada`. The source identifier belongs to deployment configuration, not public code.

## Reports

Periodic reports are generated from closed intermediate-period snapshots and registered in `Registro_Informes`. The management API exposes report state and artifacts to the portal. Controlled regeneration is performed through an authorized backend action rather than manual execution from the script editor.

## Training platforms

The reference model can derive course status from its current training source. A future deployment may integrate an external LMS/training platform, provided the integration preserves a clear canonical source and validated fallback/import behavior.

## Turnstile

The external schedule surface may use Cloudflare Turnstile. The browser-visible Site Key is public by design; the Secret Key remains server-side. Turnstile is anti-abuse verification and does not authenticate an applicant.

## Organization-owned platform

The management portal is intended to be embedded or integrated into a larger authenticated organizational platform. The host should provide identity, authorization, audit context, and the controlled backend/API used for administrative writes.
