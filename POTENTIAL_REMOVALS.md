# Acadrium - Potential Removals Audit Report

This report documents all files identified as potential cleanup candidates during the non-destructive production audit. As per project guidelines, **no files or code have been deleted or modified during this pass**.

---

## 1. Candidate Source & Utility Files

### 1. `src/App.css`
- **Full Path**: `file:///e:/MiP/Acadrium/src/App.css`
- **Reason it appears unused**: Unused CSS file left from initial Vite starter template. The application uses `src/styles/index.css` for Tailwind imports and global style definitions.
- **Number of references found**: `0`
- **Used by routing**: No
- **Used by build process**: No (Vite only builds CSS files explicitly imported in JS/JSX module graph)
- **Used by tests**: No
- **Used by context providers**: No
- **Used by dynamic imports**: No

---

### 2. `src/index.css`
- **Full Path**: `file:///e:/MiP/Acadrium/src/index.css`
- **Reason it appears unused**: Unused Vite boilerplate CSS stylesheet containing default styles. `src/main.jsx` imports `src/styles/index.css` instead.
- **Number of references found**: `0`
- **Used by routing**: No
- **Used by build process**: No
- **Used by tests**: No
- **Used by context providers**: No
- **Used by dynamic imports**: No

---

### 3. `src/types/index.js`
- **Full Path**: `file:///e:/MiP/Acadrium/src/types/index.js`
- **Reason it appears unused**: JSDoc type definitions file (`@typedef`). Contains no runtime code execution (`export {}`). Useful for IDE intellisense but not imported anywhere at runtime.
- **Number of references found**: `0`
- **Used by routing**: No
- **Used by build process**: No
- **Used by tests**: No
- **Used by context providers**: No
- **Used by dynamic imports**: No

---

### 4. `backend/audit_database.py`
- **Full Path**: `file:///e:/MiP/Acadrium/backend/audit_database.py`
- **Reason it appears unused**: Standalone one-off database integrity and diagnostic audit script. Not imported or executed by `main.py`, backend services, or regression test suite.
- **Number of references found**: `0`
- **Used by routing**: No
- **Used by build process**: No
- **Used by tests**: No
- **Used by context providers**: No
- **Used by dynamic imports**: No

---

## 2. Orphaned Upload Files Audit Report

The database was queried (both PostgreSQL and SQLite instances) for referenced files in the `resources` and `workspace_resources` tables. The physical contents of `backend/uploads/` were cross-referenced against active database records.

| File Path | File Size | DB Record Reference | Orphan Status |
| :--- | :--- | :--- | :--- |
| `backend/uploads/resources/pdf/b57d4f0daefd_timeline_arch.pdf` | 896 bytes | None (`resources` count: 0) | Orphaned test artifact |
| `backend/uploads/resources/pdf/fbef2f8f6673_automata.pdf` | 878 bytes | None (`resources` count: 0) | Orphaned test artifact |
| `backend/uploads/resources/images/9e3b876ffd67_dfa_diagram.png` | 27 bytes | None (`resources` count: 0) | Orphaned test artifact |

### Orphan Audit Summary
- **Total Physical Upload Files Inspected**: 3
- **DB-Referenced Active Upload Files**: 0
- **Orphaned Upload Candidates**: 3
- **Action Taken**: None deleted (Audit phase only).

---

## 3. Retained & Verified Essential Files

The following utility and test files were audited and confirmed as **Active / Required**:
- `backend/cleanup_test_data.py`: **REQUIRED** (Imported by `test_full_regression.py`, `test_classroom_flow.py`, `test_announcement_flow.py`, `test_resource_flow.py`, `test_workspace_flow.py`, `test_workspace_notes_flow.py`, `test_timeline_flow.py`, and `test_document_processing.py`).
- All `backend/test_*.py` files: **REQUIRED** (Active regression test suite executed during validation).
