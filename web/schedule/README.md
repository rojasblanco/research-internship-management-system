# Schedule submission page

This page standardizes weekly availability during the application stage and generates a PDF only after the configured backend accepts the request.

## Deployment

The page is static HTML/CSS/JavaScript and can be deployed in any compatible static web-hosting environment or institutional web server. It has no architectural dependency on a specific hosting provider.

Host-level security/cache/indexing headers should be configured using the facilities provided by the chosen environment.

## Public configuration

Browser configuration may include:

- backend endpoint;
- public Turnstile Site Key when Turnstile is used;
- expected API/action names;
- minimum weekly hours for the reference workflow;
- generic program label.

The Turnstile Secret Key remains server-side.

## Access model

The page can be externally reachable during application. Search-index directives do not make it private, and Turnstile is not authentication.

Deployments that need stronger applicant identity control can add one-time/expiring links, tokens tied to an application record, email verification, authenticated applicant accounts, or another approved mechanism.

The page should refer to the organization's **application channel** rather than assume one specific form provider.
