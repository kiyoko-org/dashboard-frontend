# Dashboard UI Input Plan — frontend-only

Date: 2026-04-12
Scope: `packages/dashboard-frontend` only

## Constraints for this pass
- **UI only**
- **No `dispatch-lib` edits**
- **No DB/schema changes**
- Keep changes small and safe

## Important implementation rule
- For every text input / textarea with a cap in this doc, use the actual HTML/React **`maxLength`** prop in the dashboard UI.
- Zod is the second layer. `maxLength` should be the first layer.
- For numeric string fields like badge number / phone number, still use `maxLength` after digit sanitization.

---

## Summary

Main inputs that should get UI guardrails now, using real `maxLength` props in the form controls:
- **Database**: category name, subcategory name
- **Officers**: badge number, rank, email, first/middle/last name
- **Hotlines**: name, phone number, description
- **Incidents**: police notes, date range guard
- **Verification**: review notes
- **Login**: email normalization only

Low priority / probably leave alone for now:
- search boxes on Users / Incidents / Verification
- officer search in Assign dialog

---

# 1) Field limits — all in one place

## `/login`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| email | 254 | trim + lowercase in submitted value only; do not force lowercase while typing |
| password | no hard cap for now | do not trim |

## `/dashboard/database`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| category name | 40 | trim, collapse spaces |
| subcategory input | 40 | trim, collapse spaces, prevent duplicates case-insensitively |
| edit category name | 40 | trim, collapse spaces |
| edit subcategory input | 40 | trim, collapse spaces, prevent duplicates case-insensitively |

## `/dashboard/officers`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| badge number | 6 | digits only, use text input + `inputMode="numeric"` |
| rank | from fixed list | do not allow values outside PNP rank list |
| email | 254 | `type="email"`, normalize in submitted value only; do not force lowercase in the field |
| first name | 20 | trim, collapse spaces |
| middle name | 20 | trim, collapse spaces, allow empty |
| last name | 20 | trim, collapse spaces |
| edit badge number | 6 | digits only, use text input + `inputMode="numeric"` |
| edit first name | 20 | trim, collapse spaces |
| edit middle name | 20 | trim, collapse spaces, allow empty |
| edit last name | 20 | trim, collapse spaces |

## `/dashboard/hotlines`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| name | 60 | trim, collapse spaces |
| phone number | 11 | digits only, `type="tel"`, `inputMode="numeric"` |
| description | 160 | trim on blur |
| edit name | 60 | trim, collapse spaces |
| edit phone number | 11 | digits only, `type="tel"`, `inputMode="numeric"` |
| edit description | 160 | trim on blur |

## `/dashboard/incidents`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| police notes | 1000 | trim on blur |
| start date | native date | guard `start <= end` |
| end date | native date | guard `start <= end` |

## `/dashboard/verification`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| review notes | 500 | trim on blur; require non-empty only when rejecting |

## `/dashboard/users`
| Field | Proposed UI limit | Guardrails |
|---|---:|---|
| search | no change for now | optional later soft cap 100 |

---

# 2) Proposed page-level Zod schemas

These are **dashboard-local** schemas. Idea: add them inside the relevant page file or a small local frontend validation file in `packages/dashboard-frontend`.

---

## `/login`

### Proposed schema
```ts
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1, "Password is required"),
})
```

### UI changes
- keep password untrimmed
- normalize email before submit only
- do not force the visible input field to lowercase while typing
- add `maxLength={254}` to email input
- add `autoComplete="current-password"` to password input

### Notes
- I would **not** add a password hard cap right now.

---

## `/dashboard/database`

### Proposed helpers
```ts
const normalizeInlineText = (value: string) => value.replace(/\s+/g, " ").trim()

const categoryItemSchema = z
  .string()
  .transform(normalizeInlineText)
  .pipe(
    z.string().min(1, "Required").max(40, "Must be 40 characters or less")
  )
```

### Proposed schema
```ts
const categoryFormSchema = z.object({
  name: categoryItemSchema,
})

const subcategorySchema = categoryItemSchema
```

### UI changes
- add `maxLength={40}` to category name inputs
- add `maxLength={40}` to subcategory input fields
- normalize values before add/update
- prevent duplicate subcategories in the current list
- prevent duplicates case-insensitively
  - `Fire`
  - `fire`
  - ` fire `
  should count as the same value

### Notes
- best lightweight rule: trim + collapse spaces + dedupe
- no need for aggressive character regex yet

---

## `/dashboard/officers`

### Proposed helpers
```ts
const normalizeInlineText = (value: string) => value.replace(/\s+/g, " ").trim()

const personNameSchema = z
  .string()
  .transform(normalizeInlineText)
  .pipe(
    z.string().min(2, "Must be at least 2 characters").max(20, "Must be 20 characters or less")
  )

const optionalPersonNameSchema = z
  .string()
  .transform(normalizeInlineText)
  .pipe(
    z.string().max(20, "Must be 20 characters or less")
  )
  .refine((value) => value.length === 0 || value.length >= 2, {
    message: "Must be at least 2 characters when provided",
  })
```

### Proposed add schema
```ts
const officerAddSchema = z.object({
  badge_number: z
    .string()
    .regex(/^\d{6}$/, "Badge number must be exactly 6 digits"),
  rank: z.enum(PHILIPPINE_POLICE_RANKS as [string, ...string[]]),
  email: z
    .string()
    .trim()
    .max(254, "Email is too long")
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),
  first_name: personNameSchema,
  middle_name: optionalPersonNameSchema,
  last_name: personNameSchema,
})
```

### Proposed edit schema
```ts
const officerEditSchema = z.object({
  badge_number: z
    .string()
    .regex(/^\d{6}$/, "Badge number must be exactly 6 digits"),
  first_name: personNameSchema,
  middle_name: optionalPersonNameSchema,
  last_name: personNameSchema,
})
```

### UI changes
- change badge number input from `type="number"` to `type="text"`
- add:
  - `inputMode="numeric"`
  - `maxLength={6}`
  - `onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, "").slice(0, 6))}`
- email input:
  - set `type="email"`
  - add `maxLength={254}`
  - lowercase only in the submitted value, not in the visible field while typing
- name inputs:
  - add `maxLength={20}`
  - trim / collapse spaces on blur or submit
- rank:
  - keep searchable UI if desired
  - but validate final value strictly against `PHILIPPINE_POLICE_RANKS`

### Notes
- this page already has decent validation intent; mostly needs better UI enforcement

---

## `/dashboard/hotlines`

### Proposed helpers
```ts
const normalizeInlineText = (value: string) => value.replace(/\s+/g, " ").trim()
```

### Proposed schema
```ts
const hotlineFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeInlineText)
    .pipe(z.string().min(1, "Name is required").max(60, "Must be 60 characters or less")),
  phone_number: z
    .string()
    .regex(/^\d{3,11}$/, "Phone number must be 3 to 11 digits"),
  description: z
    .string()
    .transform((value) => value.trim())
    .max(160, "Must be 160 characters or less")
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
})
```

### UI changes
- `name`
  - add `maxLength={60}`
- `phone_number`
  - keep `type="tel"`
  - add `inputMode="numeric"`
  - add `maxLength={11}`
  - keep digit sanitization in `onChange`
- `description`
  - add `maxLength={160}`
  - trim on blur

### Notes
- this is a clean, low-risk UI-only improvement

---

## `/dashboard/incidents`

### Proposed schema
```ts
const incidentEditSchema = z.object({
  police_notes: z
    .string()
    .trim()
    .max(1000, "Must be 1000 characters or less")
    .optional(),
})

const incidentDateRangeSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    ({ startDate, endDate }) => {
      if (!startDate || !endDate) return true
      return startDate <= endDate
    },
    {
      message: "Start date cannot be later than end date",
      path: ["endDate"],
    }
  )
```

### UI changes
- `police_notes`
  - add `maxLength={1000}`
  - trim on blur
  - optional small counter near the textarea
- date fields
  - when both dates exist, prevent invalid range
  - simplest UI behavior:
    - show inline error, or
    - clear the conflicting end date

### Notes
- only `police_notes` really needs a character cap here

---

## `/dashboard/verification`

### Proposed schema
```ts
const verificationReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  review_notes: z
    .string()
    .trim()
    .max(500, "Must be 500 characters or less"),
}).superRefine((value, ctx) => {
  if (value.decision === "rejected" && value.review_notes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["review_notes"],
      message: "Review notes are required when rejecting",
    })
  }
})
```

### UI changes
- add `maxLength={500}` to review notes textarea
- trim before submit
- require a note only when clicking Reject
- keep notes optional for Approve

### Notes
- this is a good admin audit trail guard
- template chips already fit this flow well

---

## `/dashboard/users`

### Proposed schema
None for now.

### UI changes
- no change required now
- optional later: `maxLength={100}` on search

---

# 3) Recommended implementation order

## Phase 1 — very safe, high value
1. `/dashboard/officers`
2. `/dashboard/database`
3. `/dashboard/hotlines`
4. `/dashboard/verification`
5. `/dashboard/incidents` (`police_notes` + date guard)

## Phase 2 — small polish
6. `/login` submit-time email normalization
7. optional search soft caps

---

# 4) Final proposed first pass

If we keep this small, I recommend implementing exactly these:

## `/dashboard/officers`
- badge number: text input, numeric inputMode, digits only, max 6
- rank: validate against rank list
- email: max 254, type email, normalize lowercase in the submitted value only
- names: max 20

## `/dashboard/database`
- category name: max 40
- subcategory item: max 40
- dedupe subcategories case-insensitively
- trim + collapse spaces

## `/dashboard/hotlines`
- name: max 60
- phone number: max 11 digits
- description: max 160

## `/dashboard/verification`
- review notes: max 500
- require notes on reject

## `/dashboard/incidents`
- police notes: max 1000
- date range guard

That gives us the main UI safety wins without touching shared library code.

---

# 5) Testing guide

## Quick verification
- Run `bun run build`
- Expected: successful production build

## `/login`
1. Open `/login`
2. Try typing more than 254 chars in email
3. Expected: input stops at `maxLength`
4. Enter mixed-case email like `Admin@Example.com`
5. Submit
6. Expected: visible field is not force-lowercased while typing; submitted value is normalized before auth

## `/dashboard/database`
1. Open **Database** page
2. Try entering a category name longer than 40 chars
3. Expected: input stops at `maxLength`
4. Add a subcategory longer than 40 chars
5. Expected: input stops at `maxLength`
6. Add `Fire`, then try ` fire ` or `FIRE`
7. Expected: duplicate is blocked
8. Add text with repeated spaces like `House    Fire`
9. Blur or add it
10. Expected: value is normalized to single spaces
11. Edit an existing category and repeat the same checks

## `/dashboard/officers`
1. Open **Add Officer**
2. In badge number, type letters or more than 6 digits
3. Expected: only digits remain; input stops at 6
4. In email, try more than 254 chars
5. Expected: input stops at `maxLength`
6. In first/middle/last name, try more than 20 chars
7. Expected: input stops at `maxLength`
8. Type repeated spaces in name fields, blur the field
9. Expected: spaces collapse and edges trim
10. In rank, type a value not in the list and submit
11. Expected: validation error blocks submit
12. Repeat key checks in **Edit Officer**

## `/dashboard/hotlines`
1. Open **Add Hotline**
2. Name: try more than 60 chars
3. Expected: input stops at `maxLength`
4. Phone number: type letters, symbols, or more than 11 digits
5. Expected: only digits remain; input stops at 11
6. Description: try more than 160 chars
7. Expected: textarea stops at `maxLength`
8. Type leading/trailing spaces in name/description, blur the field
9. Expected: values are trimmed/normalized
10. Repeat key checks in **Edit Hotline**

## `/dashboard/verification`
1. Open a pending verification request
2. Try typing more than 500 chars in review notes
3. Expected: textarea stops at `maxLength`
4. Click **Reject** with empty review notes
5. Expected: validation error appears; submission is blocked
6. Click a template chip
7. Expected: review notes populate with template text
8. Click **Approve** with empty notes
9. Expected: allowed

## `/dashboard/incidents`
1. Open **Incident Management**
2. In filters, pick a start date later than end date
3. Expected: date change is rejected and toast appears
4. In resolved incident edit dialog, type more than 1000 chars in police notes
5. Expected: textarea stops at `maxLength`
6. Type leading/trailing spaces in police notes, blur the field
7. Expected: notes are trimmed
8. Save a resolved incident with valid notes
9. Expected: save succeeds

## Notes
- Search inputs were intentionally left mostly unchanged in this pass.
- This pass is dashboard-UI-only.
