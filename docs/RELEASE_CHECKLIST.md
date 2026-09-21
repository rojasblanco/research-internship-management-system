# Public release checklist

## Source and interface

- [x] Sanitized `apps-script/core/` is included.
- [x] Sanitized `web/management/index.html` is included.
- [x] Automatic intermediate-period closure and periodic-report generation are represented in source and documentation.
- [x] The management interface includes period review plus report open/PDF/regeneration controls.

## Static validation

- [ ] Apps Script syntax checks pass across the combined public source.
- [ ] No duplicate global functions/constants exist across the combined source.
- [ ] Management and schedule JavaScript syntax checks pass.
- [ ] No production credentials, Secret Keys, Google resource IDs, private URLs, personal data, evidence, or institution-specific operational records remain.
- [ ] Example workbooks contain only fictitious data.
- [ ] Relative documentation links resolve.

## Deployment validation

The browser-connected management portal cannot be fully verified until it is integrated into its host platform. Complete `POST_DEPLOYMENT_VALIDATION.es.md` after deployment.

## Publication

- [ ] Create the GitHub repository and upload the repository contents.
- [ ] Add the standard MIT `LICENSE` in GitHub with the agreed copyright holder.
- [ ] Confirm GitHub identifies the repository license as MIT.
- [ ] Perform one final repository review after the license is present.
- [ ] Create the first release/tag if desired.
- [ ] If distributing a release ZIP, publish a SHA-256 checksum beside that archive.
