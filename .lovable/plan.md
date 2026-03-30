

## Plan: Automatic Expired Token Detection with Re-authentication Alert

### Problem
When OAuth tokens expire (Meta, Google, TikTok), widgets show a generic "Conexión requerida" message with no actionable way to fix it directly from the dashboard. Users must manually navigate to the Connections page.

### Solution
1. **Enhance edge functions** to return a structured `token_expired` flag alongside `is_demo` when the failure is specifically due to an expired/invalid token (vs. no integration at all).

2. **Enhance `useIntegrations` hook** to also fetch `token_expires_at` from the database, exposing a helper `getExpiredPlatforms()` that returns platforms with tokens expired or expiring within 24 hours.

3. **Create an `ExpiredTokenBanner` component** — a prominent alert bar rendered at the top of the `DashboardView` page. It shows which platform(s) have expired tokens and includes direct "Reconectar" buttons that link to `/connections` (or trigger the OAuth flow directly for each platform).

4. **Update `DashboardWidget` error handling** — distinguish between `token_expired` errors and generic `no_integration` errors. When `token_expired`, show a red alert (not amber) with text like "Token expirado" and a "Reconectar" button linking to `/connections`.

5. **Add i18n keys** for expired token messages in `es`, `en`, and `pt` locale files.

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/fetch-meta-metrics/index.ts` | Detect Meta API "expired session" errors → return `{ token_expired: true, is_demo: true }` |
| `supabase/functions/fetch-google-ads-metrics/index.ts` | Detect token refresh failure → return `{ token_expired: true, is_demo: true }` |
| `supabase/functions/fetch-tiktok-ads-metrics/index.ts` | Detect invalid token responses → return `{ token_expired: true, is_demo: true }` |
| `src/hooks/useIntegrations.ts` | Fetch `token_expires_at`, expose `getExpiredPlatforms()` |
| `src/components/dashboards/widgets/DashboardWidget.tsx` | Handle `token_expired` error state with red alert + "Reconectar" button |
| `src/components/dashboards/ExpiredTokenBanner.tsx` | **New** — banner component for the dashboard header |
| `src/pages/DashboardView.tsx` | Render `ExpiredTokenBanner` above the canvas |
| `src/i18n/locales/es/common.json` | Add `widget.tokenExpired`, `widget.tokenExpiredDesc`, `widget.reconnect` keys |
| `src/i18n/locales/en/common.json` | Same keys in English |
| `src/i18n/locales/pt/common.json` | Same keys in Portuguese |

### Technical details

**Edge function error detection**: Each metrics edge function already catches API errors. The change adds pattern matching:
- Meta: check for `OAuthException` or error code 190 in the Graph API response
- Google: detect when `refreshAccessToken` fails (already returns `is_demo: true` with error "Token refresh failed" — add `token_expired: true`)
- TikTok: detect HTML responses or auth error codes → add `token_expired: true`

**Client-side flow**: `DashboardWidget.loadData()` already checks `is_demo`. It will additionally check `(result.data as any).token_expired` and set error to `"token_expired"` instead of `"no_integration"`. The `renderContent()` switch will show a distinct UI with a red icon, specific message, and a `<Link to="/connections">` button.

**Banner component**: Uses `useIntegrations` to check `token_expires_at` for all connected platforms. If any are expired or within 24h of expiry, renders a dismissible alert with platform-specific reconnect links.

