# Deployment

## Management module

Deploy the management interface only inside an authenticated/authorized organizational environment when it is connected to real data.

The host must provide:

- user authentication;
- role/action authorization;
- controlled API access;
- audit context;
- secure session/credential handling.

The browser must not contain private backend credentials.

## Schedule module

The schedule page is static HTML/CSS/JavaScript and can be served by any compatible web-hosting environment or institutional web server.

Configure browser-safe values through `config.js`, including the public API endpoint and Turnstile Site Key when Turnstile is used. The Turnstile Secret Key remains server-side.

Search-index directives such as HTML `noindex` or `robots.txt` are not access control.

If stronger applicant identity control is needed, add an invitation/verification/authentication layer appropriate to the deployment.

## Backend

The backend may use Google Apps Script in the reference implementation or another service that satisfies the documented API/security contract.

Normal periodic processing should occur through the existing scheduled automation path, not by asking an operator to run functions from the script editor.

## Time zone

Review the deployment IANA time zone before enabling schedule/period automation. Date boundaries must be tested in staging.
