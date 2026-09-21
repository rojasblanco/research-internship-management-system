# Future work

This roadmap intentionally contains only extensions that arose from the real project and remain broadly reusable. It is not a list of internal handoff tasks.

## 1. Stronger institutional authentication and applicant access control

Integrate the management module into an organization-owned authenticated platform using the organization's preferred identity mechanism and role-based authorization.

For external applicant surfaces, consider invitation links, expiring tokens, email verification, authenticated applicant accounts, or another organization-approved mechanism when preventing unrelated third-party submissions is required. Turnstile can remain as anti-abuse protection but is not identity verification.

## 2. Dedicated schedule-change workflow

The provisional schedule is created during the application stage and H1 becomes the first official schedule after the real start date. A future dedicated workflow should allow an active person to submit a schedule change without reusing the full application process, creating H2/H3 while preserving H1 and all prior versions.

## 3. Optional external training/LMS integration

Allow course completion data to be obtained from an external learning-management or training platform while retaining a controlled fallback/import path until the integration is validated. The architecture should not assume any specific vendor.

## 4. Configurable onboarding requirements

Support additional onboarding requirements beyond the core training courses, such as readings, briefings, certificates, acknowledgements, videos, or organization-specific induction steps, without hard-coding one format.

## 5. Final evaluation and closure module

Extend the final-stage workflow when an organization needs a structured final evaluation, recommendation, certificate, or closing report. Final outputs should remain subject to human review and organizational policy.

## 6. Direct-onboarding integration

Expand the direct-onboarding route once an authoritative administrative source is available, without forcing direct members through internship-only steps.

## 7. Optional operational visualization

Where useful, add dashboards for intake progress, period exceptions, hours, reporting status, and workload. Dashboards should derive from existing canonical data rather than create a second manual source of truth.
