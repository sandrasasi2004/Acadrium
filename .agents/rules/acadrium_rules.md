# ACADRIUM PROJECT GLOBAL RULES

## Rule 1 – Preserve Existing Working Functionality
Any feature that is currently working correctly must continue working exactly the same after implementation.
- Authentication (Register, Login, Logout, JWT, Session Persistence, Protected Routes, UserContext Logic, Role-Based Access Control).
- Classroom Management (Create Classroom, View Classrooms, Join Classroom, Leave Classroom, Delete Classroom, Classroom Code Generation, Faculty & Student Permissions).
- UI & Navigation (Existing layouts, routing, pages, styling, responsive behavior, toast notifications).
- Before completing any task, verify that previously completed phases still work. No new phase may break a previous phase.

## Rule 2 – Never Modify Existing User Data
Under no circumstances may user records be modified unless explicitly instructed.
- Never: Rename users, Replace users, Recreate users, Delete users, Change passwords, Change emails, Change roles, Seed new users, Insert demo users, Reset authentication tables.
- All existing PostgreSQL user records must remain untouched.
- Testing must never modify production/test user accounts.

## Rule 3 – No Dummy Data
Do not introduce mock data, fake resources, placeholder records, sample announcements, example users, demo classrooms, hardcoded lists, or simulated uploads.
- If a feature is not yet implemented, display: *"This feature will be available in a future phase."* instead of creating fake functionality.

## Rule 4 – No Hallucinated Functionality
Do not claim that a feature works unless it actually exists.
- Do not simulate uploads, previews, storage, API responses, or database persistence.
- Every displayed action must correspond to a real implementation. If the backend endpoint does not exist, the frontend must not pretend that it succeeded.

## Rule 5 – Backend First
Before connecting any frontend feature, verify that:
- Database schema exists
- Models exist
- Schemas exist
- Services exist
- Routes exist
- API endpoints work
- Authentication rules work
Only then integrate the frontend.

## Rule 6 – No Unapproved Refactoring
Do not rename files, rename APIs, change routing, change architecture, or change database structure unless explicitly required by the phase. Implement only what is requested.

## Rule 7 – Mandatory Regression Testing
After every phase, verify: Register, Login, Logout, Session Restore, Faculty Workflow, Student Workflow, Classroom Management, and any previously completed features. No phase is complete until regression testing passes.

## Rule 8 – Report Everything
At the end of every task provide: Files modified, Files created, APIs added, Database changes, Testing performed, Regression results, Any limitations found. Never hide changes.

## Rule 9 – If Unsure, Ask
If requirements are ambiguous, do not assume. Stop and ask for clarification rather than implementing guessed behavior.
