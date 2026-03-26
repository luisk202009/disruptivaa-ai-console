

# Admin UX fixes and navigation corrections

## 1. Fix Nosotros nav link (Navbar.tsx)

The route `/nosotros` exists in `App.tsx` (line 93) and the Navbar already has `href: "/nosotros"` (line 20). The issue is likely in the Navbar's rendering logic -- need to verify the `link.href` path is being used correctly for the non-dropdown nav item. Looking at the code, the logic looks correct. Let me check if `PublicLayout` or `Nosotros.tsx` is wrapping with a layout that re-renders the Navbar and might be conflicting.

**Root cause**: The Navbar link for "Nosotros" at line 20 shows `href: "/nosotros"` which is correct. But the `Nosotros` component is lazy-loaded -- checking if it renders properly. The route and link look correct in code. Will verify via session replay or console, but the fix may be a rendering issue in the `Link` component in the desktop nav section.

**Action**: Verify the Nosotros link renders as a `<Link to="/nosotros">` (not an anchor with `#`). The code at lines 132-142 renders non-dropdown links correctly. Will test and fix if there's a subtle issue.

## 2. Add Leads CRM link to admin Sidebar

Currently, there's NO link to `/admin/leads` in the Sidebar. The page exists but is only accessible by typing the URL directly.

**Action**: Add a "Leads" nav item in the Sidebar under the admin section, visible only when `isAdmin` is true. Will use the `Users` icon and link to `/admin/leads`.

**File**: `src/components/Sidebar.tsx`

## 3. Show full_name in admin users + collect during onboarding

The admin users tab (line 479) shows `profile.full_name || profile.id.slice(0, 8)`. The `full_name` field exists in `profiles` but is never collected.

**Action**:
- Add a "Nombre completo" field to `CompanyOnboarding.tsx` before the company name field
- Update the `create_company_for_user` function or add a separate profile update to save `full_name` during onboarding
- Since we can't modify DB functions via code, we'll update the profile's `full_name` via a direct `.update()` call before or after company creation

**File**: `src/components/CompanyOnboarding.tsx`

## 4. Group brief submissions by email

Currently each brief submission creates a NEW lead record (even if same email). Multiple submissions from the same person appear as separate leads.

**Action**:
- In `DynamicBriefForm.tsx`, before inserting a new lead, check if a lead with the same email already exists using an upsert or conditional insert
- Problem: RLS prevents anonymous users from reading leads. Solution: Use `upsert` with `onConflict: 'email'` -- but `email` is not a unique column currently
- **Migration needed**: Add a unique constraint on `leads.email` and use upsert, OR change approach: always insert a new `brief_submissions` record but link it to the existing lead by looking up via edge function
- **Simpler approach**: Add a unique constraint on `leads(email)`, use `.upsert()` with `onConflict: 'email'` to return the existing lead ID, then insert the brief submission linked to that lead
- In `AdminLeads.tsx`, show a count of brief submissions per lead and allow viewing all of them in the dialog

### Database migration
```sql
ALTER TABLE public.leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
```

### Code changes
- `DynamicBriefForm.tsx`: Use `upsert` with `onConflict: 'email'` instead of `insert` for leads. Keep the client-side UUID but let the DB return the existing ID if email matches.
- `AdminLeads.tsx`: Query `brief_submissions` grouped by `lead_id`, show count badge, and allow browsing all submissions in the dialog.
- `BriefDetailDialog.tsx`: Support showing multiple submissions with tabs or a list.

## Summary of files

| File | Change |
|---|---|
| `src/components/landing/Navbar.tsx` | Debug/fix Nosotros link |
| `src/components/Sidebar.tsx` | Add "Leads" nav item for admins |
| `src/components/CompanyOnboarding.tsx` | Add full_name field, save to profile |
| `src/components/brief/DynamicBriefForm.tsx` | Upsert leads by email instead of always inserting |
| `src/pages/AdminLeads.tsx` | Show submission count, group briefs per lead |
| `src/components/admin/BriefDetailDialog.tsx` | Support multiple submissions per lead |
| Migration | `ALTER TABLE leads ADD CONSTRAINT leads_email_unique UNIQUE (email)` |

