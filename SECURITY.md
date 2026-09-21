# Security Policy

## Public repository boundary

This repository contains a sanitized public reference implementation. Never commit production credentials, private organizational configuration, operational evidence, personal data, private resource identifiers, or confidential internal documents.

## Management portal

A real management deployment must sit behind organization-controlled authentication and authorization. The host should enforce role-based access, write allowlists, stable record identification, audit context, locking/transaction controls where appropriate, and post-write verification.

URL obscurity, `noindex`, or static hosting alone are not access control.

## External schedule surface

The schedule page can be externally reachable because it is used before onboarding. Treat every request as untrusted and expose only the narrow submission behavior intended for applicants.

### Turnstile

The Turnstile **Site Key is public by design**. The **Secret Key is confidential** and must remain server-side.

Turnstile is anti-bot/anti-abuse verification, not authentication. When stronger identity control is required, add an organization-approved invitation or verification mechanism such as expiring links/tokens, email verification, or authenticated applicant accounts.

## Static hosting

The schedule page is ordinary static HTML/CSS/JavaScript and is host-agnostic. Security headers should be configured using the facilities provided by the chosen hosting environment.

## Reports and artifacts

Report links may lead to private organizational documents. The backend/hosting permissions must ensure that report artifacts are accessible only to authorized users. The public repository must contain only fictitious/example report references.

## Before every release

- scan the working tree for keys, tokens, private IDs, real emails/names, and production URLs;
- review Git history if the repository has already been published;
- rotate any credential that was exposed;
- verify example workbooks contain only fictitious data;
- verify public browser configuration contains no private backend secret;
- run the acceptance test and confirm documentation matches actual behavior.

## Reporting security issues

Report deployment-specific security issues privately to the relevant maintainer/organization. Never paste credentials or private operational information into a public issue.
