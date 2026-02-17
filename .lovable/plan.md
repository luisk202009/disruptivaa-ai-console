
# Fix: Website URL Redirect and Websites Page Content

## Two Independent Issues

### Issue 1: Incorrect URL when opening a site from the Dashboard

**Root Cause:** In `src/components/ServiceCard.tsx`, the `onClick` handler calls `window.open(url, "_blank")` with the raw stored URL `www.luisk20.com`. Since this string has no protocol (`https://`), the browser treats it as a relative path and appends it to the current origin, resulting in:
```
https://44f87f20-...lovableproject.com/www.luisk20.com  ← 404
```

**Fix:** Before calling `window.open`, normalize the URL to ensure it always has a protocol:
```typescript
const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
  ? url
  : `https://${url}`;
window.open(normalizedUrl, "_blank");
```

**File:** `src/components/ServiceCard.tsx` — 1 line change in the `onClick` handler.

---

### Issue 2: Websites page shows empty state despite assigned sites

**Root Cause:** `src/pages/Websites.tsx` is a static placeholder. It has no data fetching logic whatsoever. It simply always renders the "no websites" empty state message, ignoring any data in the database.

**Fix:** Add the same data fetching logic already used in `Dashboard.tsx`:
- Import `useQuery` from `@tanstack/react-query`, `supabase` client, `useUserProfile` hook, and `useCompanyBranding` hook.
- Fetch `company_websites` filtered by `profile.company_id`.
- Render a `ServiceCard` for each website when data exists.
- Keep the empty state for when there are genuinely no sites.

**File:** `src/pages/Websites.tsx` — complete replacement with data-fetching version.

---

## Technical Details

### Files Affected

| File | Change |
|------|--------|
| `src/components/ServiceCard.tsx` | Normalize URL before `window.open` |
| `src/pages/Websites.tsx` | Add `useQuery` to fetch and render `company_websites` |

### No database changes required
The RLS policies on `company_websites` are already correct — `Users can view assigned websites` filters by `company_id` matching the user's profile. The data is already in the database (`www.luisk20.com` for company `c4c15bc5`). The fix is purely frontend.

### URL Normalization Logic
URLs stored in the admin can be in any of these formats:
- `www.luisk20.com` → needs `https://` prepended
- `http://www.luisk20.com` → keep as-is
- `https://www.luisk20.com` → keep as-is

The fix handles all three cases with a simple prefix check.
