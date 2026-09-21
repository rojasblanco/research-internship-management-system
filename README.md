# Research Internship Management System

[Versión en español](README.es.md)

A modular system for managing **intake, formalization, monitoring, reporting, and closure of research internships and new-member onboarding** using Google Apps Script, Google Sheets, Google Drive, and two separate web interfaces.

This repository is a **sanitized public reference implementation**. It contains no real people, production credentials, private Google Workspace identifiers, production URLs, operational evidence, or source-organization data.

## The problem

The project originated in an environment where there was no single, consistent onboarding route. Standard internships, internships that could precede a possible employment transition, and direct onboarding could follow different administrative paths with different documents, training requirements, schedules, owners, and monitoring needs.

The workflow was therefore **designed and progressively refined from the ground up**. What began as small automations for form extraction and calculations evolved into a system that can show where each person is in the process, what is missing, which schedule is current, how many hours have been recognized, which activities are supported by evidence, and which reports exist.

The goal is not to replace human decisions, but to **make the process visible, reduce information loss, and preserve traceability**.

## What it covers

- application and intake tracking;
- interview and acceptance decision;
- induction courses and deadlines;
- formalization, owners, and components;
- documentation controls;
- provisional application schedule and official H1/H2/H3 schedule versions;
- activity, hours, and evidence tracking through an Activity Planner;
- attendance and schedule consistency;
- 30-day monitoring periods;
- automatic closure of intermediate periods when validation succeeds;
- automatic registration and generation of periodic reports;
- exception states when human review is required;
- human review for final closure;
- progress, extensions, withdrawals, and employment transition when applicable.

## Three onboarding routes

1. **Standard internship** — application, acceptance, induction, formalization, monitoring, and closure.
2. **Internship with potential employment transition** — follows the internship lifecycle first and later records an authorized transition decision. An internship does not imply or guarantee employment.
3. **Direct onboarding** — integrates a person entering through another authoritative administrative route without fabricating internship history.

The initial application source is also provider-neutral. Any form, portal, API, or system capable of producing structured retrievable records can be connected through an adapter.

## High-level architecture

```text
Structured application source
            │
            ▼
Intake · interview · training · documentation
            │
            ▼
Internship management model
identity · schedules · activities · attendance
periods · progress · reports · transitions
            │
      ┌─────┴─────┐
      ▼           ▼
automation motor  management API
      │           │
      ▼           ▼
consolidation     authenticated
+ reports         management portal
```

The management interface is designed to be integrated into an **organization-owned authenticated platform**. The schedule page remains a separate pre-onboarding surface and can be served from any compatible web-hosting environment.

## Web interfaces

### Management portal

Provides an administrative view of each person and authorized actions. The management interface includes a **Reports** area where users can inspect periodic reports, open or download available artifacts, see generation errors, and request controlled regeneration.

Normal operators should not need to open the Apps Script editor or manually execute backend functions.

### Schedule page

Standardizes weekly availability during application, calculates declared hours, and generates a PDF only after the backend accepts the submission. The application schedule is provisional; `H1` is the first official schedule from the actual start date, and later versions preserve history.

## Monitoring and reporting

Intermediate periods are designed as **automated monitoring checkpoints**. When a period ends, the system validates its data sources; if the data are coherent, it closes the period, freezes the required snapshots, and generates the periodic report automatically. Blocking inconsistencies become visible exception/review states.

Human review is reserved primarily for **exceptions and final closure**, where the complete trajectory may need to be validated before a final evaluation, certificate, letter, or recommendation according to organizational policy.

## “Planner” terminology

In this project, **Planner** means the person's operational activity/task log: activities, hours, and evidence. It does not imply a dependency on Microsoft Planner. Public documentation also uses **Activity Planner** when helpful.

## Reference implementation rules

These values affect the reference implementation and are documented so they can be reviewed when adapting the system; they are **not universal policy**:

- 5 induction courses;
- reference technical pass rule: `score >= 70`;
- 14 calendar days from the actual training-link send date;
- standard 30-day monitoring periods;
- automatic intermediate-period closure/reporting when validation succeeds;
- human review for exceptions and final closure;
- training links are still sent manually in the reference implementation, while the actual send date is recorded;
- a complete final evaluation/report module may require adaptation to each organization's policy.

## Example data model

Two equivalent fictitious workbooks are included:

- `data/internship_management_database_example_es.xlsx`
- `data/internship_management_database_example_en.xlsx`

The Spanish workbook mirrors the canonical names used by the reference implementation; the English workbook is a documentation mirror for international readers. Neither contains real data.

## Security and publication

Production credentials, private keys, real resource IDs, personal information, evidence, private URLs, and organization-specific configuration must remain outside source control.

Turnstile can protect the external schedule surface against automated abuse, but it **is not authentication**. Deployments that require stronger applicant identity control can add invitation, verification, or identity layers.

## Professional relevance

This project demonstrates the full path from:

**operational need → workflow design → data model → automation → web interfaces → traceability → iterative improvement**.

It combines process analysis, data architecture, automation, exception handling, integration design, and preparation of a reusable public implementation.

The public version is distributed under the **MIT License**. In the published repository, the `LICENSE` file contains the applicable legal text. The license covers only material published here and does not license private organizational data, infrastructure, trademarks, internal documents, or other non-public assets.

## Documentation

Detailed technical documentation is available under [`docs/`](docs/README.md), including architecture, data model, integrations, API contract, maintenance, acceptance testing, and AI/developer context.

---

**Stack:** JavaScript · Google Apps Script · Google Sheets · Google Drive · HTML/CSS/JavaScript · REST/adapters
