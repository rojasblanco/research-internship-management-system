# Google Apps Script modules

The final public source is organized by responsibility rather than internal development-version filenames.

Expected module responsibilities include:

- identity and intake;
- courses and documentation;
- official schedules;
- Activity Planner synchronization;
- attendance processing;
- period construction and automatic intermediate closure;
- hour adjustments;
- progress calculation;
- report registry and automatic periodic-report generation;
- automation orchestration;
- management API;
- schedule-submission backend;
- data dictionary and system-health validation.

## Naming

Public filenames should remain functional (`Periods.gs`, `PortalApi.gs`, `ReportRegistry.gs`, etc.). Some internal function names may retain historical suffixes when changing them would alter installed-trigger or cross-module contracts in the validated reference implementation. That implementation detail does not need to appear in the root README.

## Trigger principle

Do not create an extra production trigger solely for periodic reports. Intermediate closure/reporting should be orchestrated by the existing scheduled automation path unless a future architecture explicitly replaces the trigger model.

## Operator boundary

Normal operators should not execute Apps Script functions manually. Routine behavior is automatic or exposed through authenticated, controlled web actions.

## Public source scope

`core/` contains the sanitized reference implementation used by this repository. Deployment IDs, private URLs, credentials, institution-specific records, and operational evidence are intentionally externalized.
