# User Profile Dropdown in Header

Add a dropdown menu to the User icon in the Header. When the user is **logged in**, clicking the icon opens a small popover with "Settings" (static/no-op) and "Logout" (functional). When the user is **not logged in**, clicking the icon redirects to `/login`.

## Files Reviewed

| File | Purpose |
|------|---------|
| [Header.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/components/home/Header.tsx) | Header component — contains the `<User>` icon button (lines 134–137) |
| [useAuth.ts](file:///d:/Codes/Panthar/unilake-code/frontend/app/hooks/useAuth.ts) | Hook exposing `user`, `isAuthenticated`, `loading`, `logout` |
| [AuthContext.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/app/contexts/AuthContext.tsx) | Auth provider — `logout` calls `authService.logout()` |
| [auth-service.ts](file:///d:/Codes/Panthar/unilake-code/frontend/app/lib/auth-service.ts) | `logout()` calls `authClient.signOut()` then redirects to `/login` |
| [auth.ts](file:///d:/Codes/Panthar/unilake-code/frontend/app/types/auth.ts) | `User`, `Session`, `AuthContextType` types |
| [login/page.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/app/login/page.tsx) | Login page (redirect target) |

## Current Behavior

The User icon (lines 134–137 of Header.tsx) is a plain `<button>` with no `onClick` handler — it does nothing when clicked.

The Header already imports and uses `useAuth` (line 7, line 29) to get `user` and `loading` for the admin settings icon. The `logout` function is available from `useAuth` but is **not** currently destructured in the Header.

## Proposed Changes

### [MODIFY] [Header.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/components/home/Header.tsx)

All changes are confined to this single file. No new files, no modifications to auth logic.

#### Step 1 — Add imports

- Import `useRouter` from `next/navigation` (for redirecting unauthenticated users to `/login`).
- Import `LogOut` icon from `lucide-react` (for the logout menu item).

#### Step 2 — Destructure additional values from `useAuth`

Update line 29 to also extract `isAuthenticated` and `logout`:

```diff
- const { user, loading } = useAuth();
+ const { user, loading, isAuthenticated, logout } = useAuth();
```

#### Step 3 — Add state and ref for the profile dropdown

- Add `const router = useRouter();`
- Add `const [isProfileOpen, setIsProfileOpen] = useState(false);`
- Add `const profileDropdownRef = useRef<HTMLDivElement>(null);`

#### Step 4 — Add click-outside handler for the profile dropdown

Add a new `useEffect` (similar to the existing country-dropdown one on lines 56–66) that listens for `mousedown` events and closes the profile dropdown when clicking outside `profileDropdownRef`.

#### Step 5 — Replace the User icon `<button>` with conditional logic

Replace lines 134–137 with:

**If `!isAuthenticated` (user not logged in):**
- On click, call `router.push("/login")` to redirect to the login page.

**If `isAuthenticated` (user logged in):**
- On click, toggle `isProfileOpen`.
- When `isProfileOpen` is true, render a small dropdown positioned below the icon containing:
  1. **User info section** — Display user's name and email from `user` object (styled muted/small).
  2. **Settings** — A menu item with a `Settings` icon. Static for now (`onClick` does nothing / shows a placeholder).
  3. **Divider** — A thin horizontal line separating settings from logout.
  4. **Logout** — A menu item with the `LogOut` icon. On click, calls `logout()` which triggers `authService.logout()` → signs out and redirects to `/login`.

#### Step 6 — Style the dropdown

Style the dropdown to match the existing country-selector dropdown (lines 159–176) for visual consistency:
- Use `absolute right-0 mt-3.5` positioning.
- Use the same `bg-[#914A8C]` purple background, `border-white/20` border, `rounded-2xl`, `shadow-xl` styling.
- Use `hover:bg-white/15` on menu items.
- White text, same font sizes.
- Apply the same `animate-in fade-in slide-in-from-top-2 duration-200` animation.

> [!IMPORTANT]
> No existing functionality is being changed — the country dropdown, admin icon, scroll behavior, and all other Header features remain untouched.

## Open Questions

> [!NOTE]
> **Settings behavior**: The Settings menu item will be a no-op (no navigation, no modal) for now. Should it show a tooltip like "Coming soon" on click, or just do nothing silently?

## Verification Plan

### Manual Verification
1. **Logged-out state**: Click the User icon → verify it redirects to `/login`.
2. **Logged-in state**: Click the User icon → verify the dropdown opens with user info, Settings, and Logout.
3. **Logout flow**: Click Logout → verify `authClient.signOut()` is called, user is redirected to `/login`, and session is cleared.
4. **Click outside**: Click anywhere outside the dropdown → verify it closes.
5. **No regressions**: Verify the country dropdown, admin icon, scroll-hide behavior, and navigation links still work as before.
