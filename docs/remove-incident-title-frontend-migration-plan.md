# Frontend migration plan: remove incident title display

## Goal
Adopt the new report submission flow by removing all frontend dependency on `incident_title` as a user-facing field.

The UI should instead surface the incident `description` / `what_happened` content as the primary summary text wherever we currently show a title.

## Current backend shape
After checking `../dispatch-lib`, the database still exposes both fields:

- `reports.incident_title` is still present and nullable
- `reports.what_happened` is present and nullable
- `incident_reports_with_trust` also returns both fields
- `get_resolved_reports` still returns both fields

So this migration is a **frontend presentation change**. The dashboard should stop rendering `incident_title` entirely and use `what_happened` as the source of truth for incident summary text.

## Scope
Update all dashboard screens that currently render or rely on the old title column/value:

- **Incidents page**: table rows, detail dialogs, search/sort behavior, archive/assign copy, export output.
- **Home dashboard**: recent incidents card.
- **Shared incident dialogs/components**: any title labels or fallbacks.
- **Documentation/screenshots**: update copy so it matches the new UI.

## Current title usage to remove or replace
Identified areas in this repo:

- `app/dashboard/incidents/page.tsx`
  - table column header `Title`
  - row cell rendering `report.incident_title`
  - sort key `incident_title`
  - search matching against title text
  - toast / console / dialog copy referencing title
  - PDF/export rows containing `incident_title`
  - archive confirmation text using title
- `components/incidents/incident-detail-dialog.tsx`
  - title label and display value
- `app/dashboard/page.tsx`
  - recent incidents card uses `incident_title`
- docs/screenshots and docs page text
  - incident management docs still describe the title column

## Target UX
Use a consistent display rule:

1. `what_happened`
2. `description` or any equivalent summary field already available in the view
3. a neutral fallback like `No description provided`

For list/table views, truncate the text and keep the rest accessible in the detail modal.

## Migration steps

### 1) Add a shared display helper
Create a small helper used by both dashboard pages and incident dialogs.

Responsibilities:
- choose the best summary text from `what_happened` / `description`
- trim whitespace
- collapse empty strings to a fallback
- optionally truncate for table/list display only

This avoids one-off logic spread across multiple pages.

### 2) Replace the incidents table title column
In `app/dashboard/incidents/page.tsx`:

- rename the column header from **Title** to something like **What happened** or **Summary**
- render the chosen description text instead of `incident_title`
- keep the row layout compact; use one or two lines max
- remove `incident_title` from sorting if the table should no longer privilege title data
- update any table tooltips, badges, and empty-state text that mention title

### 3) Update incident filtering/search
Still in `app/dashboard/incidents/page.tsx`:

- remove title-only matching logic
- search against the new summary text (`what_happened` / `description`)
- keep matching against category, location, status, and other existing fields
- do not include `incident_title` in the primary UI search unless a separate legacy/admin requirement comes up

### 4) Update incident detail dialogs
In `components/incidents/incident-detail-dialog.tsx` and any similar modal:

- remove the visible **Title** label
- replace it with **What happened** or **Description**
- show the new summary field in the main information area
- keep the full text readable with whitespace preserved
- ensure the dialog still works when the description is empty

### 5) Update the home dashboard recent incidents card
In `app/dashboard/page.tsx`:

- replace the `incident_title` display with the new summary helper
- keep category, time, and status unchanged
- if the summary is long, clamp it to a single or two-line preview
- use a fallback message that nudges the user toward adding a description if none exists

### 6) Clean up title-based copy in actions and notifications
Search and replace user-facing text that still implies a title-based incident model.

Examples:
- `New Incident: ...`
- archive confirmation text that quotes the title
- assignment logs referencing the title
- any empty-state prompts that say “enter a title”

Use wording that references the description / what happened instead.

### 7) Update exports and reports
If the incidents page can export CSV/PDF:

- remove the title column from exports, or rename it to summary/what happened
- confirm the exported schema matches the frontend table schema
- make sure generated reports still read well without a title field
- keep `incident_title` only if needed for backward compatibility, but demote it from primary display

### 8) Update docs and screenshots
Once the UI changes are complete:

- update `docs/DISPATCH_DASHBOARD_DOCUMENTATION.md`
- refresh screenshots that show the incidents page and detail dialog
- remove references to a title field in user-facing documentation

### 9) Validate data compatibility
Before removing any backend field entirely, confirm the frontend handles mixed data safely:

- older records may still have `incident_title`
- newer submissions may only have `what_happened`
- the UI should not break if one field is missing

If the backend view still exposes `incident_title`, treat it as deprecated and ignore it in the UI.

## Recommended implementation order
1. Add shared summary helper.
2. Update home dashboard recent incidents.
3. Update incidents table and detail dialog.
4. Update search, sort, exports, and action copy.
5. Update docs/screenshots.
6. Run a final pass for leftover `incident_title` references in dashboard UI code.

## Acceptance criteria
- No user-facing title label remains in the incidents dashboard UI.
- Recent incidents on the home dashboard show the description / what happened text instead of a title.
- Search and detail views continue to work with `what_happened` as the primary text source.
- Exports and confirmations no longer present title as the primary incident label.
- Documentation matches the new UI.

## Notes / risks
- The backend still exposes `incident_title` in `reports`, `incident_reports_with_trust`, and `get_resolved_reports`; frontend should ignore it for now.
- The incidents page currently fetches from `incident_reports_with_trust` via the realtime hook, so UI changes should not require an RPC change on that page.
- If other screens consume `get_resolved_reports` or any future RPCs, those responses should be updated later if they still surface title-based copy.
- If title is removed from the submission form later, make sure validation prompts users to provide a meaningful description instead.
