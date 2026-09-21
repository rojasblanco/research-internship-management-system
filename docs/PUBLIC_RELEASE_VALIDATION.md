# Public release validation

Validation scope: static public-repository candidate prepared before GitHub publication.

## Completed checks

- 17 sanitized Apps Script modules plus `appsscript.json` are present under `apps-script/core/`.
- Apps Script source passes JavaScript syntax validation individually and as one combined source set (605 global functions scanned; no duplicate function names detected).
- No duplicate global function names or global variable/constant names were detected across the combined Apps Script source (123 global declarations scanned).
- The management and schedule pages pass JavaScript syntax validation for their inline scripts.
- The management interface includes automatic-period/reporting presentation, final/exception review actions, report opening, PDF access, and controlled report regeneration.
- Known production identifiers, institution names, personal names, real operational emails, private URLs, and the production spreadsheet ID were not found in the public text/source scan.
- Example Spanish and English workbooks contain fictitious data; targeted scans found no known sensitive terms and no obvious formula-error strings.
- Internal Markdown links resolve.
- No obsolete licensing placeholders, source-synchronization checkpoint text, or per-file checksum manifest remains.

## Deliberate boundary

The management portal cannot be end-to-end browser-tested until it is connected to the organization’s host platform and authorized backend. That is a deployment validation task, not a missing public source file. Complete `POST_DEPLOYMENT_VALIDATION.es.md` after integration.

## License publication step

The repository is intended for MIT distribution. The standard `LICENSE` file is added directly in GitHub as part of publication and is therefore not bundled in this pre-upload ZIP.
