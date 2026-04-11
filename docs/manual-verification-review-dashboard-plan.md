# Manual Verification Review Dashboard Plan

## Goal

Add an admin dashboard flow for reviewing manual identity verification submissions from mobile users.

This doc is **dashboard-specific**.
It covers:

- admin queue / review UX
- server route shape
- signed preview handling
- approval / rejection flow
- acceptance criteria

It does **not** cover the mobile submission UI. That is tracked separately in:

- `/Volumes/realme/Dev/kiyoko-org/dispatch/docs/manual-verification-mobile-flow-plan.md`

---

## Context

Manual verification now exists on the backend:

- `public.verification_requests`
- `verification-docs` private storage bucket
- `public.review_verification_request(...)` RPC
- `profiles.is_verified` remains the final access-control flag

Users can now submit alternative IDs from the mobile app.
The dashboard now needs a secure admin workflow to:

- view pending requests
- preview front/back files
- approve or reject requests
- store rejection notes
- update user verification state through the review RPC

---

## Current Dashboard Architecture

### Existing client bootstrapping

Dashboard initializes `dispatch-lib` here:

- `packages/dashboard-frontend/components/providers/dispatch-client-provider.tsx`

It uses:
- `initDispatchClient(...)`
- `useProxy: true`

### Existing admin API pattern

Dashboard already uses admin-only Next route handlers with:

- `packages/dashboard-frontend/lib/server/auth.ts`
- `requireDashboardAdmin(request)`
- `NO_STORE_HEADERS`

Current example:

- `packages/dashboard-frontend/app/api/profiles/route.ts`

That pattern is the right foundation for manual verification review too.

### Existing signed URL precedent

Dashboard already creates signed URLs for incident attachments inside the incidents page.
That proves the product already accepts short-lived signed preview links in admin UI.

---

## Recommendation Summary

### Recommended approach

Use a **dedicated dashboard page + dispatch-lib-first data flow**.

Why:
- you want to centralize Supabase interaction through `dispatch-lib`
- manual verification already has reusable helpers and RPC wrappers there
- this keeps the new feature aligned with the shared library direction
- we can do this for the manual verification flow without refactoring the entire dashboard

### Reuse check: `dispatch-lib` + existing RPC

We should reuse existing shared logic where it already fits.

#### Reusable from `dispatch-lib`
- `fetchVerificationRequests(...)`
- `reviewVerificationRequest(...)`
- `getVerificationDocumentSignedUrl(...)`
- verification types/enums

#### Reusable from backend migrations
- `public.review_verification_request(...)` RPC

That RPC should remain the **single review authority**.
The dashboard must not duplicate approval logic by manually updating both:
- `verification_requests.status`
- `profiles.is_verified`

#### What is not relevant for dashboard review
These were added mainly for submission/mobile flows:
- `uploadVerificationDocument(...)`
- storage path builders for upload
- mobile upload adapters

### Practical recommendation

For dashboard MVP:
- reuse the **existing review RPC** for approval/rejection
- use `dispatch-lib` directly for the manual verification flow wherever possible
- avoid a broad dashboard refactor
- only add server routes later if direct library usage proves insufficient for this feature

That means:
- frontend should not invent new business logic
- frontend/hooks should call the shared `dispatch-lib` helpers first
- the existing RPC remains the single review authority

### Recommended deliverables

1. new dashboard page
2. new verification review hook
3. new admin API routes
4. short-lived signed preview URLs
5. explicit approve / reject review dialog

---

## Page Plan

## New page

Create a dedicated page:

- `packages/dashboard-frontend/app/dashboard/verification/page.tsx`

Reason:
- keeps user management page from becoming overloaded
- creates a focused moderation/review workspace
- easier to filter by request state
- easier to add preview and review details later

### Optional later enhancement

Add a sidebar nav item and/or dashboard stat card for:
- pending verification count

---

## Core UX

## Main review page sections

### 1. Page header
Show:
- title: `Manual Verification`
- subtitle: `Review user-submitted identity documents`
- pending count summary

### 2. Summary cards
Recommended cards:
- Total Requests
- Pending
- Approved
- Rejected

### 3. Filter row
Recommended filters:
- status
- document type
- search by user name / email / profile id
- submitted date sort

Default view:
- `Pending` first / selected by default

### 4. Review table / list
Each row should show:
- user name
- email
- profile id or short id
- document type
- submitted date
- status
- reviewed by (if already reviewed)
- reviewed at (if already reviewed)
- action button: `Review` / `View`

### 5. Review detail dialog
When admin opens a request, show:
- user identity summary
- document type
- request status
- submitted timestamp
- front document preview
- back document preview if present
- review notes textarea
- approve button
- reject button

---

## Status Rules

### Pending
- visible in queue
- actionable
- admin can approve or reject

### Approved
- read-only history view
- no second review action

### Rejected
- read-only history view
- display rejection notes
- no second review action

### Final gate
Do **not** invent a separate dashboard-only verification flag.
Final source of truth remains:

- `profiles.is_verified`

---

## Data Access Plan

## Recommendation

Use **dispatch-lib first** for the dashboard review flow.

### Primary path for MVP
Use the initialized dashboard `DispatchClient` for:

- fetching verification requests
- reviewing requests through the existing RPC wrapper
- generating signed preview URLs

This works well for this feature because:
- admin RLS already exists for request reads
- admin storage read access already exists for verification docs
- the shared library already exposes the core helpers we need
- it avoids introducing new dashboard-only Supabase access patterns for this flow

### When to add server routes later
Add dedicated API routes only if we later need:
- stricter server-only preview URL generation
- more complex joins/aggregation than the client should own
- audit logging around review actions
- tighter control over response shaping or caching

---

## Optional API Route Plan (fallback / later hardening)

## 1. List verification requests

Optional fallback if direct `dispatch-lib` reads become awkward.

### Route
- `packages/dashboard-frontend/app/api/verification-requests/route.ts`

### Method
- `GET`

### Auth
- `requireDashboardAdmin(request)`

### Responsibilities
- fetch verification requests
- optionally join basic profile info needed for UI
- support query params for:
  - `status`
  - `documentType`
  - `search`
  - `limit`
  - `offset`
- return newest first by default

### Return shape
Recommended response includes:
- request row
- profile name/email summary for display

This avoids making the page manually stitch too many separate datasets.

---

## 2. Review a request

Optional fallback if we later want server-wrapped review actions.

### Route
- `packages/dashboard-frontend/app/api/verification-requests/review/route.ts`

### Method
- `POST`

### Auth
- `requireDashboardAdmin(request)`

### Request body
Recommended shape:

```ts
{
  requestId: string
  decision: "approved" | "rejected"
  reviewNotes?: string
}
```

### Responsibilities
- validate body
- call existing `review_verification_request(...)` RPC with service role client
- return updated request row
- surface meaningful errors if request is no longer pending

### Important
This route should be the only dashboard write path for approval/rejection.
Do not duplicate review logic in the frontend.

---

## 3. Generate signed preview URL

Optional fallback if we later decide preview URLs must be server-generated only.

### Route
- `packages/dashboard-frontend/app/api/verification-requests/signed-url/route.ts`

### Method
- `POST`

### Auth
- `requireDashboardAdmin(request)`

### Request body
Recommended shape:

```ts
{
  storagePath: string
}
```

### Responsibilities
- validate the storage path belongs to `verification-docs`
- create a short-lived signed URL
- return signed URL for preview

### Why server route?
Even though `dispatch-lib` already has a signed URL helper and admins can likely create signed URLs client-side, server generation is cleaner because:
- central auth check
- easier auditing/logging later
- easier to standardize expiry
- avoids sprinkling storage logic around the page

### Signed URL expiry
Recommended:
- 5 minutes to 15 minutes

---

## Frontend Hook Plan

## New hook

Create a dashboard hook, e.g.:

- `packages/dashboard-frontend/hooks/useVerificationRequests.ts`

### Responsibilities
- fetch request list via `dispatch-lib`
- manage loading / error / refresh
- handle filters
- expose review mutation helpers via `dispatch-lib`
- request signed preview URLs via `dispatch-lib`

### State to expose
- `requests`
- `loading`
- `error`
- `refresh()`
- `reviewRequest(...)`

### Realtime
MVP can use **manual refresh after review**.

Optional later:
- subscribe to `verification_requests` changes via realtime

---

## UI Component Plan

## Suggested components

### Page-level
- `packages/dashboard-frontend/app/dashboard/verification/page.tsx`

### Reusable components
Optional extraction if page grows:
- `packages/dashboard-frontend/components/verification/VerificationRequestsTable.tsx`
- `packages/dashboard-frontend/components/verification/VerificationReviewDialog.tsx`
- `packages/dashboard-frontend/components/verification/VerificationPreviewCard.tsx`

### MVP simplification
For fastest delivery:
- keep initial implementation in one page file
- extract components only if complexity grows too much

---

## Review Dialog Behavior

## Recommended detail layout

### Left side / top
- requester name
- email
- profile id
- document type
- submitted at
- current status

### Preview area
- front preview card
- back preview card if exists
- each preview card has:
  - filename/label
  - preview area
  - open in new tab button

### Review form
- textarea for review notes
- rejection notes remain optional
- add quick-select rejection note templates

Recommended template chips:
- `Photo is blurry`
- `ID details are unreadable`
- `Front image is missing`
- `Back image is missing`
- `Document does not match submission requirements`
- `Please resubmit a clearer image`

### Actions
- `Approve`
- `Reject`
- `Close`

### Action rules
- disable approve/reject while request is submitting
- disable approve/reject for already reviewed records
- refresh page data after successful review

---

## Preview Handling Plan

## Supported preview types
Backend currently allows:
- image/jpeg
- image/png
- application/pdf

### Recommended product direction
For MVP, **images are the more correct UX**.

Reason:
- simpler mobile submission flow
- simpler dashboard review flow
- easier inline preview
- less ambiguity than PDFs/screenshots/scans mixed together

Mobile submission is now **image-only** for MVP.
The backend still technically allows PDF, so dashboard should keep a small fallback path for legacy/future cases.

### Image previews
- show inline image preview from signed URL

### PDF previews
Treat PDF as backend fallback only:
- open in new tab
- do not block MVP on inline PDF rendering
- optional inline iframe/embed later if product direction changes

### Missing back file
- show `No back file provided`

### Broken preview
- show fallback error state
- allow retry to generate a fresh signed URL

---

## Search + Filter Plan

## Default filter
Open the page on:
- `Pending`

Admins can switch to:
- All
- Approved
- Rejected

## Search fields
Recommended search across:
- first name
- last name
- email
- profile id

## Filters
Recommended initial filters:
- All statuses
- Pending
- Approved
- Rejected

Recommended document type filter:
- All document types
- Driver's license
- Passport
- Postal ID
- UMID
- Other

Note:
- backend still supports `other`
- dashboard should reflect the actual enum values even if mobile currently hides one of them

---

## Error Handling Plan

## Admin-facing errors
Need explicit messages for:
- unauthorized
- failed to fetch requests
- failed to generate signed URL
- request already reviewed
- approval failed
- rejection failed
- signed URL expired / preview load failed

## UX guidance
- use inline page error for fetch failure
- use toast/alert for review action failure
- keep dialog open on mutation error
- do not clear notes on failed submit

---

## Audit / Safety Notes

### Good enough for MVP
- request row preserves status/history
- reviewed_by and reviewed_at are already stored in DB
- review notes stored on request row

### Future enhancement
Possible later additions:
- activity log entries
- explicit admin action feed
- reviewer name joins
- reason presets for rejection

---

## Recommended Implementation Order

### Phase 1: Read path
1. create `useVerificationRequests.ts` on top of `dispatch-lib`
2. create verification dashboard page
3. render pending/approved/rejected list
4. add filters + loading + empty state

### Phase 2: Preview path
1. generate signed URLs via `dispatch-lib`
2. preview front/back files in review dialog
3. support image preview plus PDF fallback handling

### Phase 3: Review mutation
1. approve / reject via `dispatch-lib.reviewVerificationRequest(...)`
2. add review notes UI
3. refresh list after success
4. reflect new status immediately in UI

### Phase 4: Hardening / optional server routes
1. add server routes only if needed
2. pending counters
3. better empty states
4. route/sidebar integration
5. optional history refinements

---

## Acceptance Criteria

Dashboard review MVP is complete when:

- admins can open a dedicated verification review page
- admins can view manual verification requests
- admins can filter requests by status
- admins can see requester identity context
- admins can preview front document securely
- admins can preview back document if present
- previews use short-lived signed URLs from a private bucket
- admins can approve a pending request
- admins can reject a pending request with notes
- approval updates the request status and the user’s `profiles.is_verified`
- rejection updates the request status and keeps the user unverified
- already reviewed requests cannot be reviewed again from the UI
- list refreshes correctly after review
- fetch and mutation routes are protected by `requireDashboardAdmin`

---

## Non-Goals For MVP

- OCR extraction
- inline editing of submitted metadata
- bulk approve/reject
- moderator roles beyond current admin-only gate
- mobile-style submission history UI in dashboard
- deep analytics for verification throughput

---

## Current Decisions

1. Request list should open on `Pending` by default.
2. Review should happen in a dialog.
3. Rejection notes stay optional, but the UI should offer note templates.
4. Mobile MVP is image-only. Dashboard should still tolerate PDF as backend fallback by opening it in a new tab.
5. For this dispatch-lib-first MVP, reusing `useAdminProfilesWithEmails()` on the client for enrichment is more correct than adding a new joined API shape right now.
