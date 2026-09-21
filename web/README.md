# Web modules

The project uses two separate web surfaces with different trust boundaries:

- `management/` — internal administrative interface intended for an authenticated organization-owned platform;
- `schedule/` — external/pre-onboarding schedule submission and PDF interface.

They should not be deployed as one anonymous monolithic application.

The management portal must expose report status/artifacts and final-review actions through controlled backend/API operations. The schedule page remains independent and host-agnostic.
