# End-to-end acceptance test

Use only fictitious staging data. The purpose is to verify observable behavior, not to test with real applicants.

| Step | Precondition | Action | Expected result |
|---|---|---|---|
| 1. Intake | No operational record exists | Submit a fictitious application through a configured intake adapter | Intake record appears; operational internship record is not created before acceptance |
| 2. Provisional schedule | Application exists | Submit schedule and generate PDF | Schedule is stored as provisional/application schedule and PDF is linked to the intake record |
| 3. Interview | Intake record exists | Register accepted interview result from management portal | Acceptance is stored and verified |
| 4. Training deadline | Accepted | Register actual training-link send date | 14-day deadline is calculated from the real send date |
| 5. Courses | Training records exist | Complete required fictitious course results | Derived course control reaches 5/5 when all pass the configured rule |
| 6. Formalization | Courses complete | Save owner/components/start/end/target hours | Operational record is created/updated only after accepted route requirements are met |
| 7. Documentation | Formalized | Update document controls | Document status is persisted and reread from authoritative source |
| 8. Personal folder / Activity Planner | Operational record exists | Register folder/planner link | Link is stored without inventing evidence |
| 9. H1 | Real start date exists | Create first official schedule | H1 is preserved as version 1 |
| 10. Intermediate period | Activity/attendance data exist | Allow the period to reach its end | Automation validates and closes the period without manual script execution when data are coherent |
| 11. Snapshots | Period closes | Inspect period data | Planner/evidence/attendance/hour snapshots are frozen for the closed period |
| 12. Periodic report | Intermediate period closed | Allow automation to continue | Report registry is updated and periodic report artifact is generated automatically |
| 13. Portal reports | Report exists | Open person in management portal | Report appears with period, status, date/version, and artifact access |
| 14. Controlled regeneration | Report exists | Request regeneration from portal | Authorized backend regenerates, versions/updates registry, and returns verified state |
| 15. Exception path | Create a blocking fictitious inconsistency | Let period processing run | Period/report is not falsely closed; exception becomes visible for review |
| 16. Final review | Person reaches final stage | Perform authorized review from portal | Final closure requires human confirmation and preserves audit context |

## Pass criteria

The test passes only when no normal operator must open Apps Script or run a function manually to complete the above workflow.

All writes must be followed by authoritative reread/verification where the API contract requires it.
