# Developer Testing Mode Documentation

## Overview
The application includes a hidden testing feature that allows developers to quickly switch between user roles (Contributor, Approver, Admin) without changing SharePoint permissions. This is useful for testing different user experiences during development.

## Current Status
**DISABLED** - Testing mode is currently commented out and not visible in production.

## How to Enable Testing Mode

### Step 1: Enable the isDeveloperUser Check
**File:** `src/components/common/TopUtilityBar.tsx`  
**Line:** ~171-176

**Current Code (Disabled):**
```typescript
// HIDDEN: Developer Testing Mode - Uncomment to enable role switcher for testing
// Check if current user is the developer for testing mode
const isDeveloperUser = false; // Set to true or use name check to enable
// Original code (uncomment to enable):
// const isDeveloperUser =
//   user?.user?.Title?.toLowerCase().includes("israr") ||
//   user?.user?.Name?.toLowerCase().includes("israr");
```

**To Enable (Option 1 - Specific User):**
```typescript
// Check if current user is the developer for testing mode
const isDeveloperUser =
  user?.user?.Title?.toLowerCase().includes("israr") ||
  user?.user?.Name?.toLowerCase().includes("israr");
```

**To Enable (Option 2 - For All Users):**
```typescript
// Check if current user is the developer for testing mode
const isDeveloperUser = true; // Enable for everyone (use with caution!)
```

**To Enable (Option 3 - Multiple Specific Users):**
```typescript
// Check if current user is the developer for testing mode
const isDeveloperUser =
  user?.user?.Title?.toLowerCase().includes("israr") ||
  user?.user?.Title?.toLowerCase().includes("john") ||
  user?.user?.Title?.toLowerCase().includes("developer");
```

### Step 2: Verify the UI Section
The testing UI section (lines ~365-395 in TopUtilityBar.tsx) is wrapped in a conditional and will automatically appear when `isDeveloperUser` is true:

```tsx
{/* Testing Role Switcher (Developer Only) */}
{isDeveloperUser && (
  <div className={styles.testingSection}>
    <div className={styles.testingLabel}>🔧 TEST</div>
    <div className={styles.testingButtons}>
      <button onClick={handleSwitchToContributor}>Contributor</button>
      <button onClick={handleSwitchToApprover}>Approver</button>
      <button onClick={handleSwitchToAdmin}>Admin</button>
    </div>
  </div>
)}
```

## What Testing Mode Does

When enabled, a "🔧 TEST" section appears in the top utility bar with three buttons:

1. **Contributor** - Switches to basic user role
   - Can submit ideas
   - Can view own ideas
   - Cannot approve ideas
   - Cannot access admin features

2. **Approver** - Switches to approver role
   - All Contributor permissions
   - Can approve/reject ideas
   - Can rate ideas
   - Can access ApproverDashboard

3. **Admin** - Switches to administrator role
   - All Approver permissions
   - Can access all administrative features
   - Full system access

## Testing Functions

The following functions handle role switching:

**File:** `src/components/common/TopUtilityBar.tsx`

```typescript
const handleSwitchToContributor = () => {
  switchToContributor();
};

const handleSwitchToApprover = () => {
  switchToApprover();
};

const handleSwitchToAdmin = () => {
  switchToAdmin();
};
```

These functions call methods from `UserContext` which temporarily override the user's SharePoint permissions for testing purposes.

## Important Notes

### Security Considerations
- **Never enable this in production environments**
- Testing mode overrides actual SharePoint permissions
- Only enable for trusted developer accounts
- Consider environment variables to control this feature

### Best Practices
1. **Development Only**: Use only in development/staging environments
2. **Specific Users**: Restrict to specific developer accounts by name
3. **Remove Before Deploy**: Always disable before deploying to production
4. **Environment Check**: Consider adding environment check:
   ```typescript
   const isDeveloperUser = 
     process.env.NODE_ENV === 'development' && 
     user?.user?.Title?.toLowerCase().includes("israr");
   ```

### Visual Indicator
When enabled, the TEST section appears in the utility bar with:
- 🔧 TEST label
- Three role buttons (Contributor, Approver, Admin)
- Active button highlighting for current role
- Positioned between notification bell and user profile

## To Disable Again

Simply change the `isDeveloperUser` back to:

```typescript
const isDeveloperUser = false;
```

Or re-comment the entire section:

```typescript
// HIDDEN: Developer Testing Mode
const isDeveloperUser = false;
// const isDeveloperUser =
//   user?.user?.Title?.toLowerCase().includes("israr") ||
//   user?.user?.Name?.toLowerCase().includes("israr");
```

## Files Involved

1. **src/components/common/TopUtilityBar.tsx** - Main UI and logic
2. **src/contexts/UserContext.tsx** - Role switching functions
3. **src/components/common/TopUtilityBar.module.css** - Styling for TEST section

## Search Keywords

To quickly find this feature in the codebase, search for:
- `isDeveloperUser`
- `🔧 TEST`
- `Testing Role Switcher`
- `handleSwitchToContributor`
- `HIDDEN: Developer Testing Mode`

---

**Last Updated:** January 5, 2026  
**Status:** DISABLED  
**Reason:** Per HOD requirements - hidden for production use
