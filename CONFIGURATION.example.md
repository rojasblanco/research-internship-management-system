# Configuration example

Production-specific values must remain outside the public repository.

## Example operational settings

The reference implementation should support configuration equivalent to:

| Setting | Reference value | Purpose |
|---|---:|---|
| period length | `30` days | standard monitoring period |
| automatic intermediate closure | enabled | closes intermediate periods after validation |
| automatic periodic-report generation | enabled | creates report after successful intermediate closure |
| final human review | enabled | prevents final closure without authorized review |
| training deadline | `14` days | deadline after actual training-link send date |
| recognition/progress threshold | `0.80` | reference progress indicator threshold |

The final source and the `Configuracion` sheet must use one documented set of canonical keys for these values before publication.

## Private deployment identifiers

Real deployments may require identifiers for:

- operational database;
- external intake source;
- attendance source;
- application/report Drive folders;
- deployment-specific web endpoints.

Do not commit real private identifiers to the public repository.

## Turnstile

The schedule browser configuration may contain a public Site Key. The Secret Key must remain server-side, for example in Apps Script Script Properties.

Never place a Turnstile Secret Key in browser code.

## Management portal

The host can inject an authenticated JavaScript adapter or configure a REST backend. Browser configuration must contain only values that are safe to expose to the authenticated client.

## Schedule page

Example browser-safe configuration:

```js
window.SCHEDULE_PORTAL_CONFIG = {
  apiUrl: "https://api.example.org/application-schedules",
  apiAction: "submit_application_schedule",
  turnstileSiteKey: "YOUR_PUBLIC_TURNSTILE_SITE_KEY",
  turnstileAction: "submit_schedule",
  minimumWeeklyHours: 12,
  programLabel: "Research Internship Program"
};
```

## Time zone

Use the appropriate IANA time zone for the deployment and test period/date boundaries before production use.
