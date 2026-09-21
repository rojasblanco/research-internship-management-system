# Management portal

The management interface is designed to be integrated into an authenticated host platform and connected through an injected adapter or controlled REST backend.

The final interface should provide:

- intake/onboarding status;
- interview, courses, formalization, documentation, schedules, periods, progress, transitions;
- visible period exceptions;
- a dedicated Reports area with periodic-report history, artifact access, generation status, and controlled regeneration;
- final-review actions that do not require opening Apps Script;
- post-write reread/verification.

“Planner” means the activity/task log used for hours/evidence tracking, not Microsoft Planner.

## Public interface scope

`index.html` is the sanitized management interface included in the public reference implementation. It contains no production credentials or private organizational data. A host platform must provide authentication, authorization, and the configured API/adapter.
