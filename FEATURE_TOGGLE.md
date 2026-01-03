# Feature Toggle Documentation

## Overview
This document provides instructions for enabling and disabling specific features in the Innovative Ideas Management System. These features have been temporarily hidden per HOD requirements but can be easily re-enabled in the future.

---

## Currently Hidden Features

### 1. **Idea Trail / History**
- **Status**: HIDDEN
- **Reason**: HOD requirement - idea approval/rejection history should remain undisclosed
- **Affected Components**:
  - `src/pages/IdeaDetailPage.tsx` - Idea Trail timeline section
  - `src/pages/IdeaDetailPage.tsx` - "View Full Trail" action button

### 2. **Idea Status Display**
- **Status**: HIDDEN
- **Reason**: Users should not see if their idea was approved, rejected, or is in progress
- **Affected Components**:
  - `src/pages/IdeaDetailPage.tsx` - Status badge in title section
  - `src/pages/MyIdeas.tsx` - Status badge in compact card header
  - `src/pages/MyIdeas.tsx` - Status badges in detail view

### 3. **Task Creation Functionality**
- **Status**: HIDDEN
- **Reason**: No tasks will be created for ideas currently; this feature will be used in future
- **Affected Components**:
  - `src/components/control/TopControlPanel.tsx` - "Approved Ideas" button (admin)

### 4. **My Tasks Navigation**
- **Status**: HIDDEN
- **Reason**: Since tasks are not being created, the My Tasks section is unnecessary
- **Affected Components**:
  - `src/components/control/TopControlPanel.tsx` - "My Tasks" navigation item (for contributors)

---

## How to Enable Features

Each hidden feature is wrapped in comments with clear markers. Search for `HIDDEN:` in the codebase to find all disabled features.

### Enable Idea Trail Section

**File**: `src/pages/IdeaDetailPage.tsx`

**Step 1: Enable Timeline Section**
```typescript
// Find this comment around line 288:
{/* HIDDEN: Idea Trail section - Uncomment to enable

// Remove the opening comment marker and the closing marker (around line 393)
// Change from:
{/* HIDDEN: Idea Trail section - Uncomment to enable
<div className={styles.timelineSection}>
  ...
</div>
*/}

// To:
<div className={styles.timelineSection}>
  ...
</div>
```

**Step 2: Enable View Full Trail Button in Actions Section**
```typescript
// Find this comment around line 396:
{/* HIDDEN: Actions Section with View Full Trail button - Uncomment to enable

// Remove the opening comment marker and the closing marker
// Change from:
{/* HIDDEN: Actions Section with View Full Trail button - Uncomment to enable
<div className={styles.actionsSection}>
  ...
</div>
*/}

// To:
<div className={styles.actionsSection}>
  ...
</div>
```

---

### Enable Idea Status Display

**File 1**: `src/pages/IdeaDetailPage.tsx`

```typescript
// Find around line 146:
{/* HIDDEN: Status badge - Uncomment to enable

// Remove comment markers
// Change from:
{/* HIDDEN: Status badge - Uncomment to enable
<span className={`${styles.statusBadge} ${
  idea.status === 'Approved' ? styles.statusApproved :
  ...
}`}>
  {idea.status}
</span>
*/}

// To:
<span className={`${styles.statusBadge} ${
  idea.status === 'Approved' ? styles.statusApproved :
  ...
}`}>
  {idea.status}
</span>
```

**File 2**: `src/pages/MyIdeas.tsx`

**Step 1: Enable Status in Compact Card (around line 231)**
```typescript
// Find:
{/* HIDDEN: Status badge - Uncomment to enable

// Remove comment markers
<div className={styles.compactStatusBadge}>
  <span className={...}>
    {idea.status}
  </span>
</div>
```

**Step 2: Enable Status in Detail View (around line 296)**
```typescript
// Find:
{/* HIDDEN: Status badges - Uncomment to enable

// Remove comment markers
<div className={styles.detailStatusBadges}>
  <span className={...}>
    {selectedIdea.status}
  </span>
  <span className={...}>
    {selectedIdea.priority} Priority
  </span>
</div>
```

---

### Enable Task Creation (Approved Ideas)

**File**: `src/components/control/TopControlPanel.tsx`

```typescript
// Find around line 148:
/* HIDDEN: Approved Ideas (Create Task) - Uncomment to enable

// Remove comment markers
// Change from:
/* HIDDEN: Approved Ideas (Create Task) - Uncomment to enable
if (isAdmin) {
  controls.push(
    <button
      key="approved-ideas"
      onClick={() => navigate('/approved-ideas')}
      ...
    >
      <CheckSquare size={16} />
      <span>Approved Ideas</span>
    </button>,
  );
}
*/

// To:
if (isAdmin) {
  controls.push(
    <button
      key="approved-ideas"
      onClick={() => navigate('/approved-ideas')}
      ...
    >
      <CheckSquare size={16} />
      <span>Approved Ideas</span>
    </button>,
  );
}
```

---

### Enable My Tasks Navigation

**File**: `src/components/control/TopControlPanel.tsx`

```typescript
// Find around line 92:
/* HIDDEN: My Tasks - Uncomment to enable

// Remove comment markers
// Change from:
/* HIDDEN: My Tasks - Uncomment to enable
if (isContributor) {
  items.push({
    path: '/my-tasks',
    label: 'My Tasks',
    icon: ClipboardList,
    description: 'My Assigned Tasks',
  });
}
*/

// To:
if (isContributor) {
  items.push({
    path: '/my-tasks',
    label: 'My Tasks',
    icon: ClipboardList,
    description: 'My Assigned Tasks',
  });
}
```

---

## Quick Enable All Features

To quickly enable all hidden features, search for `HIDDEN:` across the project and remove all comment markers (`{/*` and `*/}` or `/*` and `*/`).

**Search Command**:
```bash
# In VS Code, press Ctrl+Shift+F and search for:
HIDDEN:
```

**Files to modify**:
1. `src/pages/IdeaDetailPage.tsx` (3 locations)
2. `src/pages/MyIdeas.tsx` (2 locations)
3. `src/components/control/TopControlPanel.tsx` (2 locations)

---

## Testing After Re-enabling

After re-enabling features, verify:

### ✅ Idea Trail
- [ ] View Full Trail button appears in Idea Detail page
- [ ] Timeline shows submission, approval, and implementation events
- [ ] Trail modal opens with complete history

### ✅ Idea Status
- [ ] Status badge shows in Idea Detail page title
- [ ] Status appears in My Ideas card list
- [ ] Status badges visible in My Ideas detail panel

### ✅ Task Creation
- [ ] Admin sees "Approved Ideas" button in control panel
- [ ] Button navigates to `/approved-ideas` page
- [ ] Can create tasks for approved ideas

### ✅ My Tasks
- [ ] Contributors see "My Tasks" in navigation menu
- [ ] My Tasks page loads correctly
- [ ] Assigned tasks are displayed

---

## Related Routes & Pages

These routes remain active in the application but are not accessible via navigation:

- `/approved-ideas` - Create tasks for approved ideas (Admin only)
- `/my-tasks` - View assigned tasks (Contributors, Admins, Approvers)
- `/task/:taskId` - Individual task details
- `/idea/:ideaId/trail` - Full idea trail (via IdeaTrailModal)

**Note**: Users can still access these pages via direct URL if they know the route.

---

## Database Schema

No database changes are required. All hidden features use existing SharePoint lists:

- `innovative_ideas` - Contains Status field (still being updated)
- `innovative_idea_tasks` - Tasks list (ready for future use)
- `innovative_idea_trail` - Trail events (still being recorded in background)

---

## Future Considerations

When re-enabling features:

1. **Inform Users**: Notify users that idea status and history will now be visible
2. **Training**: Provide guidance on how to interpret trail events and statuses
3. **Task Assignment**: Ensure task assignment workflow is explained to admins
4. **Permissions**: Verify SharePoint permissions are correctly configured for task access

---

## Support & Questions

For questions about enabling/disabling features, contact:
- Development Team
- System Administrator

**Last Updated**: January 3, 2026  
**Version**: 1.0  
**Status**: Features temporarily hidden per HOD requirements
