# SharePoint Dashboard Permission System

## Overview

The SharePoint dashboard implements a comprehensive role-based permission system that determines user access based on SharePoint group memberships. The system supports multiple user categories with different levels of access to departments and editing capabilities.

## Permission Categories

### 1. **HOD (Head of Department)** 👑
**Access Level**: Executive/Read-Only
**Permissions**:
- ✅ View all departments
- ❌ No editing rights
- 📊 Full dashboard visibility

**Group Patterns**:
- `hod`
- `head of department`
- `hod member`

**Example Groups**: `["HOD"]`, `["Head of Department"]`

---

### 2. **ITG Manager** 👔
**Access Level**: Management/Conditional Edit
**Permissions**:
- ✅ View all departments
- ✅ Edit rights for departments they specifically manage
- 📊 Full dashboard visibility with selective editing

**Group Patterns**:
- `itg manager`
- `itg managers`
- `itg management`
- `management member`
- `itg dept manager`

**Edit Rights Logic**:
- ITG Managers have view-only access by default
- Gain edit rights for departments where they have manager-level group membership
- Can edit multiple departments if they have manager roles in those departments

**Example Groups**:
- `["ITG Managers", "DCI Manager"]` → Can view all, edit DCI
- `["ITG Managers", "ERP Manager", "Operations Manager"]` → Can view all, edit ERP and Operations

---

### 3. **Department Team Member** 👷
**Access Level**: Department-Specific/Full Edit
**Permissions**:
- ✅ View only their assigned department(s)
- ✅ Full editing rights for their department(s)
- 📊 Department-specific dashboard

**Priority**: Department membership takes precedence over monitoring access

**Department Group Patterns**:

#### **Infrastructure (DCI)**
**Member Groups**:
- `dci`
- `dci member`
- `dci team`
- `dci dept member`
- `data center member`
- `datacenter member`

**Manager Groups**:
- `dci manager`
- `dci dept manager`
- `data center manager`
- `datacenter manager`
- `infra manager`

#### **ERP & Software Development**
**Member Groups**:
- `erp`
- `erp member`
- `erp team`
- `erp dept member`
- `software development member`

**Manager Groups**:
- `erp manager`
- `erp managers`
- `erp dept manager`
- `software manager`
- `software development manager`

#### **Operations (ITG Operations)**
**Member Groups**:
- `ops`
- `operations`
- `operations member`
- `ops member`
- `ops team`
- `ops dept member`
- `itg operations member`

**Manager Groups**:
- `operations manager`
- `ops manager`
- `ops dept manager`
- `itg operations manager`

#### **Networks & Security**
**Member Groups**:
- `network`
- `networks`
- `network member`
- `networks member`
- `network team`
- `network dept member`
- `security member`

**Manager Groups**:
- `network manager`
- `networks manager`
- `network dept manager`
- `security manager`

**Example Groups**:
- `["dci"]` → Infrastructure department, full edit rights
- `["erp", "designers", "monitorining server infrastructure visitors"]` → ERP department, full edit rights
- `["Operations", "Designers", "Monitorining Server Infrastructure Visitors"]` → Operations department, full edit rights

---

### 4. **Monitoring** 👁️
**Access Level**: Read-Only/All Departments
**Permissions**:
- ✅ View all departments
- ❌ No editing rights
- 📊 Full dashboard visibility (read-only)

**Group Patterns**:
- `monitoring`
- `monitorining`
- `monitor`
- `monitoring member`
- `monitorining member`
- `monitor member`
- `itg monitoring`
- `server infrastructure visitors`
- `infrastructure visitors`

**Example Groups**: `["Monitorining Server Infrastructure Visitors"]`

---

### 5. **Limited Access** ⚠️
**Access Level**: Restricted/Fallback
**Permissions**:
- ❌ No department access
- ❌ No editing rights
- 📊 Minimal dashboard access

**Trigger**: Users who don't match any of the above categories

---

## Permission Priority Logic

The system evaluates permissions in this order:

1. **HOD Check** → If HOD, return executive permissions
2. **ITG Manager Check** → If ITG Manager, return management permissions
3. **Department Membership Check** → If department member/manager, return department permissions
4. **Monitoring Check** → If monitoring, return read-only permissions
5. **Fallback** → Limited access

**Important**: Department membership takes precedence over monitoring access.

---

## Permission Object Structure

```javascript
{
  // User category
  userCategory: 'hod' | 'manager' | 'team_member' | 'monitoring' | 'limited',

  // Department access
  allowedDepartments: string[], // Array of department IDs user can view
  department: string | null,    // Primary department (if single department access)

  // Edit permissions
  canEdit: boolean,             // Whether user can edit any tasks
  canEditDepartments: string[], // Array of department IDs user can edit

  // Global access flags
  canViewAll: boolean,          // Whether user can view all departments
  isManagement: boolean,        // Whether user is ITG Manager
  isExecutive: boolean,         // Whether user is HOD
  isMonitoring: boolean,        // Whether user has monitoring access

  // Debug information
  rawGroupNames: string[]       // Original group names for debugging
}
```

---

## Department ID Mapping

| Department ID | Display Name | SharePoint List |
|---------------|-------------|-----------------|
| `infra` | Data Center & Cloud Infrastructure | `si_tasklist` |
| `erp` | ERP & Software Development | `erp_tasklist` |
| `ops` | ITG Operations | `ops_tasklist` |
| `network` | Networks & Security | `networks_tasklist` |

---

## Common Scenarios

### Scenario 1: Pure Department Member
**Groups**: `["dci"]`
**Result**: Infrastructure department access with full edit rights

### Scenario 2: Department Member + Monitoring
**Groups**: `["erp", "designers", "monitorining server infrastructure visitors"]`
**Result**: ERP department access with full edit rights (department takes precedence)

### Scenario 3: ITG Manager + Department Manager
**Groups**: `["ITG Managers", "DCI Manager"]`
**Result**: All departments view access + DCI edit rights

### Scenario 4: Pure Monitoring
**Groups**: `["Monitorining Server Infrastructure Visitors"]`
**Result**: All departments view access, no edit rights

### Scenario 5: HOD
**Groups**: `["HOD"]`
**Result**: All departments view access, no edit rights

### Scenario 6: No Matching Groups
**Groups**: `["Designers", "Some Other Group"]`
**Result**: Limited access, no departments visible

---

## Testing Examples

The permission system includes comprehensive test cases covering:

- HOD permissions
- ITG Manager permissions with department-specific editing
- Department member permissions for all departments
- Priority of department membership over monitoring
- Fallback to limited access

All permission logic is tested to ensure consistent behavior across different group combinations.

---

## Implementation Notes

- **Case Insensitive**: Group name matching is case insensitive
- **Normalization**: Group names are normalized (spaces, underscores, hyphens)
- **Word Boundaries**: Pattern matching uses word boundaries for precision
- **Caching**: User permissions are cached to avoid repeated API calls
- **Error Handling**: Falls back to limited permissions on API errors
- **Logging**: Comprehensive logging for debugging permission issues</content>
<parameter name="filePath">d:\sharepoint development\modern-dashboard\PERMISSIONS.md