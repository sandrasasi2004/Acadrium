# Acadrium - Production Review & Viva Comprehensive Guide

Welcome to the **Acadrium Academic Memory System** Code Review and Viva Preparation Guide. This document provides a complete architectural map, folder breakdown, feature request flow diagrams, database schemas, and viva question reference cards to help explain every system component during code reviews and viva examinations.

---

## 1. Project Folder Structure Overview

```
Acadrium/
├── src/                          # FRONTEND (React 19 + Vite + TailwindCSS)
│   ├── assets/                   # Static media assets & SVG graphics
│   ├── components/               # Reusable UI Components
│   │   ├── common/               # Global components (DocumentViewer.jsx, UserContext.jsx)
│   │   └── layout/               # Layout primitives (Header.jsx, Sidebar.jsx, RightSidebar.jsx)
│   ├── layouts/                  # Page shell wrappers (AppLayout.jsx)
│   ├── pages/                    # Page View Components
│   │   ├── AIAssistant/          # AI Study Assistant view (index.jsx)
│   │   ├── Announcements/        # Academic Announcements stream view (index.jsx)
│   │   ├── Classrooms/           # Classroom management & detail views (index.jsx, Details.jsx)
│   │   ├── Dashboard/            # Student/Faculty Overview Dashboard (index.jsx)
│   │   ├── Login/                # User Authentication Login view (index.jsx)
│   │   ├── Profile/              # User Profile view (index.jsx)
│   │   ├── Register/             # Account Registration view (index.jsx)
│   │   ├── Resources/            # Central Course Resources repository (index.jsx)
│   │   └── Workspace/            # Personal Workspace & Note Taking (index.jsx)
│   ├── routes/                   # Routing configuration & Auth Guards (AppRoutes.jsx)
│   ├── services/                 # Frontend API Integration Layer (api.js)
│   ├── styles/                   # Core Global Design System CSS (index.css)
│   ├── types/                    # JSDoc Type Definitions (index.js)
│   ├── App.jsx                   # React Root Component with Router & UserProvider
│   └── main.jsx                  # Application Mount Entrypoint
│
├── backend/                      # BACKEND (FastAPI + SQLAlchemy + Pydantic)
│   ├── app/                      # Main Backend Application Package
│   │   ├── auth/                 # Auth & Security Subsystem
│   │   │   ├── dependencies.py   # FastAPI Auth Dependencies (`get_current_user`, `require_role`)
│   │   │   └── security.py       # Password Hashing (`bcrypt`) & JWT Token Utilities
│   │   ├── database/             # Database Connection & Configuration
│   │   │   ├── config.py         # Pydantic Settings (`DATABASE_URL`, `SECRET_KEY`, `CORS`)
│   │   │   └── session.py        # SQLAlchemy Engine, SessionLocal, and Auto-Migration Column Sync
│   │   ├── middleware/           # HTTP Middleware
│   │   │   └── cors.py           # Cross-Origin Resource Sharing (CORS) Setup
│   │   ├── models/               # SQLAlchemy ORM Data Models
│   │   │   ├── user.py           # User Model (`users` table)
│   │   │   ├── classroom.py      # Classroom & Membership Models (`classrooms`, `classroom_members`)
│   │   │   ├── resource.py       # Course Resource Model (`resources`)
│   │   │   ├── workspace_resource.py # Personal Workspace File Model (`workspace_resources`)
│   │   │   ├── workspace_note.py # Personal Workspace Note Model (`workspace_notes`)
│   │   │   ├── announcement.py   # Classroom Announcement Model (`announcements`)
│   │   │   └── timeline_event.py # System Timeline Event Model (`timeline_events`)
│   │   ├── routes/               # FastAPI API Endpoints (Controllers)
│   │   │   ├── auth.py           # Auth API (`/api/auth`)
│   │   │   ├── classrooms.py     # Classrooms API (`/api/classrooms`)
│   │   │   ├── resources.py      # Course Resources API (`/api/resources`)
│   │   │   ├── workspace.py      # Workspace Files API (`/api/workspace`)
│   │   │   ├── workspace_notes.py# Workspace Notes API (`/api/workspace-notes`)
│   │   │   ├── announcements.py  # Announcements API (`/api/announcements`)
│   │   │   └── timeline.py       # Timeline Stream API (`/api/timeline`)
│   │   ├── schemas/              # Pydantic Request & Response Schemas (DTOs)
│   │   │   ├── auth.py           # Auth payload validation
│   │   │   ├── classroom.py      # Classroom payload validation
│   │   │   ├── resource.py       # Resource payload validation
│   │   │   ├── workspace.py      # Workspace payload validation
│   │   │   ├── workspace_note.py # Workspace note payload validation
│   │   │   └── announcement.py   # Announcement payload validation
│   │   ├── services/             # Core Business Logic Layer
│   │   │   ├── auth_service.py   # User registration, login, profile logic
│   │   │   ├── classroom_service.py # Classroom creation, joining, roster logic
│   │   │   ├── resource_service.py  # Course resource storage & management
│   │   │   ├── workspace_service.py # Workspace file upload & processing
│   │   │   ├── workspace_note_service.py # Personal note creation & word calculation
│   │   │   ├── announcement_service.py # Announcement broadcasting & academic dates
│   │   │   ├── timeline_service.py # Central activity event logger
│   │   │   └── document_processor.py # Text extraction (PDF, DOCX, PPTX, Images, TXT)
│   │   └── main.py               # FastAPI App Initialization & Router Registration
│   ├── uploads/                  # Physical Document & Media Upload Storage
│   │   ├── resources/            # Course resources storage (`pdf/`, `ppt/`, `doc/`, `images/`)
│   │   └── workspace/            # Personal workspace storage (`pdf/`, `ppt/`, `doc/`, `images/`)
│   └── cleanup_test_data.py      # Automated Test Teardown & Database Sanitizer Utility
```

---

## 2. Comprehensive Feature Architecture & Request Mapping

### Feature 1: Authentication & Authorization System
- **Purpose**: Provides role-based authentication (Student and Faculty) using JWT tokens, password hashing with bcrypt, session persistence, and profile updates.
- **Database Model**: [`backend/app/models/user.py`](file:///e:/MiP/Acadrium/backend/app/models/user.py) (`User` model)
- **Schema File**: [`backend/app/schemas/auth.py`](file:///e:/MiP/Acadrium/backend/app/schemas/auth.py) (`UserRegister`, `UserLogin`, `TokenResponse`, `UserResponse`)
- **Route / API File**: [`backend/app/routes/auth.py`](file:///e:/MiP/Acadrium/backend/app/routes/auth.py) (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- **Service / Business Logic**: [`backend/app/services/auth_service.py`](file:///e:/MiP/Acadrium/backend/app/services/auth_service.py) & [`backend/app/auth/security.py`](file:///e:/MiP/Acadrium/backend/app/auth/security.py) & [`backend/app/auth/dependencies.py`](file:///e:/MiP/Acadrium/backend/app/auth/dependencies.py)
- **Frontend File**: [`src/pages/Login/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Login/index.jsx), [`src/pages/Register/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Register/index.jsx), [`src/pages/Profile/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Profile/index.jsx), [`src/components/common/UserContext.jsx`](file:///e:/MiP/Acadrium/src/components/common/UserContext.jsx)
- **Request Flow**:
  1. **Frontend**: User submits login credentials in `Login/index.jsx` -> Invokes `login()` in `UserContext.jsx` -> Calls `api.login(credentials)` in `src/services/api.js`.
  2. **API Route**: `POST /api/auth/login` in `auth.py` receives `UserLogin` schema.
  3. **Service**: `auth_service.authenticate_user()` fetches user from DB via SQLAlchemy, verifies bcrypt password hash using `security.verify_password()`.
  4. **Database**: Executes `SELECT * FROM users WHERE email = :email`.
  5. **Response**: `security.create_access_token()` generates JWT token -> Returned to frontend -> Token saved in `localStorage` & `axios` default headers.

---

### Feature 2: Classroom Management System
- **Purpose**: Enables faculty members to create course classrooms, auto-generate unique 10-character join codes (e.g. `ACDR-71BM-QMCK`), browse owned courses, view student counts, and manage classroom details.
- **Database Model**: [`backend/app/models/classroom.py`](file:///e:/MiP/Acadrium/backend/app/models/classroom.py) (`Classroom` model)
- **Schema File**: [`backend/app/schemas/classroom.py`](file:///e:/MiP/Acadrium/backend/app/schemas/classroom.py) (`ClassroomCreate`, `ClassroomResponse`)
- **Route / API File**: [`backend/app/routes/classrooms.py`](file:///e:/MiP/Acadrium/backend/app/routes/classrooms.py) (`POST /api/classrooms`, `GET /api/classrooms`, `GET /api/classrooms/{id}`)
- **Service / Business Logic**: [`backend/app/services/classroom_service.py`](file:///e:/MiP/Acadrium/backend/app/services/classroom_service.py) (`create_classroom`, `get_classroom_by_id`)
- **Frontend File**: [`src/pages/Classrooms/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/index.jsx), [`src/pages/Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx)
- **Request Flow**:
  1. **Frontend**: Faculty fills create classroom form -> Invokes `createClassroom()` in `UserContext.jsx` -> Calls `api.createClassroom()` in `api.js`.
  2. **API Route**: `POST /api/classrooms` in `classrooms.py` verifies `require_role(["faculty"])`.
  3. **Service**: `classroom_service.create_classroom()` generates a unique invite code using `generate_invite_code()`, logs a `ClassroomCreated` event via `timeline_service.log_timeline_event()`.
  4. **Database**: Inserts record into `classrooms` table.
  5. **Response**: Returns newly created `ClassroomResponse` object to frontend for instant UI update.

---

### Feature 3: Classroom Membership Subsystem
- **Purpose**: Allows students to join classrooms using a 10-character invite code, lists enrolled courses, manages roster counts, and handles leave classroom operations.
- **Database Model**: [`backend/app/models/classroom.py`](file:///e:/MiP/Acadrium/backend/app/models/classroom.py) (`ClassroomMember` model)
- **Schema File**: [`backend/app/schemas/classroom.py`](file:///e:/MiP/Acadrium/backend/app/schemas/classroom.py) (`JoinClassroomRequest`, `ClassroomMemberResponse`)
- **Route / API File**: [`backend/app/routes/classrooms.py`](file:///e:/MiP/Acadrium/backend/app/routes/classrooms.py) (`POST /api/classrooms/join`, `GET /api/classrooms/enrolled`, `DELETE /api/classrooms/{id}/leave`)
- **Service / Business Logic**: [`backend/app/services/classroom_service.py`](file:///e:/MiP/Acadrium/backend/app/services/classroom_service.py) (`join_classroom_by_code`, `leave_classroom`)
- **Frontend File**: [`src/pages/Classrooms/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/index.jsx), [`src/pages/Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx)
- **Request Flow**:
  1. **Frontend**: Student enters join code -> Invokes `joinClassroom()` -> Calls `api.joinClassroom(code)` in `api.js`.
  2. **API Route**: `POST /api/classrooms/join` in `classrooms.py` verifies student authentication.
  3. **Service**: `classroom_service.join_classroom_by_code()` verifies code existence in `classrooms` table, checks if student is already enrolled, inserts `ClassroomMember` row, increments `student_count` column, and logs `ClassroomJoined` timeline event.
  4. **Database**: Inserts into `classroom_members` and updates `classrooms.student_count`.
  5. **Response**: Returns success notification and refreshes student enrolled classrooms list.

---

### Feature 4: Course Resources Repository
- **Purpose**: Allows faculty to upload study documents (PDF, PPTX, DOCX, Images, TXT) per classroom, automatically extracts text & metadata, and lets students browse, filter, search, preview, and download course materials.
- **Database Model**: [`backend/app/models/resource.py`](file:///e:/MiP/Acadrium/backend/app/models/resource.py) (`Resource` model)
- **Schema File**: [`backend/app/schemas/resource.py`](file:///e:/MiP/Acadrium/backend/app/schemas/resource.py) (`ResourceCreate`, `ResourceResponse`)
- **Route / API File**: [`backend/app/routes/resources.py`](file:///e:/MiP/Acadrium/backend/app/routes/resources.py) (`POST /api/resources/upload`, `GET /api/resources`, `GET /api/resources/classroom/{id}`)
- **Service / Business Logic**: [`backend/app/services/resource_service.py`](file:///e:/MiP/Acadrium/backend/app/services/resource_service.py) (`create_resource`, `get_resources_by_classroom`)
- **Frontend File**: [`src/pages/Resources/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Resources/index.jsx), [`src/pages/Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx), [`src/components/common/DocumentViewer.jsx`](file:///e:/MiP/Acadrium/src/components/common/DocumentViewer.jsx)
- **Request Flow**:
  1. **Frontend**: Faculty selects file & enters resource title in upload modal -> Calls `api.uploadResource(formData)` via multipart request.
  2. **API Route**: `POST /api/resources/upload` receives `UploadFile`, `title`, `description`, `classroom_id`.
  3. **Service**: `resource_service.create_resource()` saves file physically under `backend/uploads/resources/<type>/`, invokes `document_processor.extract_text_by_file_path()` and `compute_file_metadata()`, populates denormalized metadata (`uploaded_by_name`, `classroom_name`, `page_count`, `word_count`), inserts DB record, and logs `ResourceUploaded` timeline event.
  4. **Database**: Inserts into `resources` table.
  5. **Response**: Returns complete `ResourceResponse` payload including extracted text and file URL.

---

### Feature 5: Document Processing & Text Extraction Pipeline
- **Purpose**: Autonomous text extraction and structural analysis (word count & page count computation) for all uploaded academic documents.
- **Database Model**: Fields `extracted_text`, `extraction_status`, `page_count`, `word_count`, `last_processed_at` on `Resource` and `WorkspaceResource` models.
- **Schema File**: `ExtractionStatusEnum` and metadata fields in [`backend/app/schemas/resource.py`](file:///e:/MiP/Acadrium/backend/app/schemas/resource.py) & [`workspace.py`](file:///e:/MiP/Acadrium/backend/app/schemas/workspace.py)
- **Route / API File**: Triggered automatically during upload endpoints (`POST /api/resources/upload`, `POST /api/workspace/upload`)
- **Service / Business Logic**: [`backend/app/services/document_processor.py`](file:///e:/MiP/Acadrium/backend/app/services/document_processor.py) (`extract_text_by_file_path`, `compute_file_metadata`, `extract_pdf_text`, `extract_docx_text`, `extract_pptx_text`, `extract_image_text`, `extract_txt_text`)
- **Frontend File**: [`src/components/common/DocumentViewer.jsx`](file:///e:/MiP/Acadrium/src/components/common/DocumentViewer.jsx)
- **Request Flow**:
  1. **Upload Trigger**: File uploaded to resource or workspace service.
  2. **File Format Detection**: `document_processor.py` inspects file extension.
     - `.pdf` -> Parsed using `pypdf.PdfReader` (counts pages, extracts text per page).
     - `.docx` -> Parsed using `docx.Document` (iterates over paragraphs and tables).
     - `.pptx` -> Parsed using `pptx.Presentation` (iterates over slides and shapes).
     - `.png`/`.jpg` -> Inspects metadata using `Pillow` image module.
     - `.txt` -> Decoded using UTF-8 text reader.
  3. **Metadata Calculation**: `compute_file_metadata()` calculates exact word count (`len(text.split())`) and page count.
  4. **DB Store**: `extracted_text`, `page_count`, `word_count`, and `extraction_status='SUCCESS'` are saved to database.
  5. **UI Rendering**: `DocumentViewer.jsx` renders extracted text with word count and page count badges.

---

### Feature 6: Personal Workspace Files System
- **Purpose**: Provides students and faculty with a private personal cloud storage area to store personal files, extract text content, and perform full-text search.
- **Database Model**: [`backend/app/models/workspace_resource.py`](file:///e:/MiP/Acadrium/backend/app/models/workspace_resource.py) (`WorkspaceResource` model)
- **Schema File**: [`backend/app/schemas/workspace.py`](file:///e:/MiP/Acadrium/backend/app/schemas/workspace.py) (`WorkspaceResourceCreate`, `WorkspaceResourceResponse`)
- **Route / API File**: [`backend/app/routes/workspace.py`](file:///e:/MiP/Acadrium/backend/app/routes/workspace.py) (`POST /api/workspace/upload`, `GET /api/workspace`, `DELETE /api/workspace/{id}`)
- **Service / Business Logic**: [`backend/app/services/workspace_service.py`](file:///e:/MiP/Acadrium/backend/app/services/workspace_service.py) (`create_workspace_resource`, `get_user_workspace_resources`)
- **Frontend File**: [`src/pages/Workspace/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Workspace/index.jsx), [`src/components/common/DocumentViewer.jsx`](file:///e:/MiP/Acadrium/src/components/common/DocumentViewer.jsx)
- **Request Flow**:
  1. **Frontend**: User uploads file in `Workspace/index.jsx` -> Calls `api.uploadWorkspaceFile(formData)`.
  2. **API Route**: `POST /api/workspace/upload` receives `UploadFile` & `title`.
  3. **Service**: `workspace_service.create_workspace_resource()` saves file to `backend/uploads/workspace/<type>/`, extracts text using `document_processor.py`, sets `owner_name`, writes record to database, and logs `WorkspaceFileUploaded` timeline event.
  4. **Database**: Inserts record into `workspace_resources` table.
  5. **Response**: Returns `WorkspaceResourceResponse` object to update workspace UI grid.

---

### Feature 7: Personal Workspace Notes System
- **Purpose**: Built-in rich note editor allowing users to take personal study notes, auto-calculate word counts, track last modified timestamps, and manage notes.
- **Database Model**: [`backend/app/models/workspace_note.py`](file:///e:/MiP/Acadrium/backend/app/models/workspace_note.py) (`WorkspaceNote` model)
- **Schema File**: [`backend/app/schemas/workspace_note.py`](file:///e:/MiP/Acadrium/backend/app/schemas/workspace_note.py) (`WorkspaceNoteCreate`, `WorkspaceNoteUpdate`, `WorkspaceNoteResponse`)
- **Route / API File**: [`backend/app/routes/workspace_notes.py`](file:///e:/MiP/Acadrium/backend/app/routes/workspace_notes.py) (`POST /api/workspace-notes`, `GET /api/workspace-notes`, `PUT /api/workspace-notes/{id}`)
- **Service / Business Logic**: [`backend/app/services/workspace_note_service.py`](file:///e:/MiP/Acadrium/backend/app/services/workspace_note_service.py) (`create_note`, `update_note`)
- **Frontend File**: [`src/pages/Workspace/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Workspace/index.jsx)
- **Request Flow**:
  1. **Frontend**: User creates/updates note in Workspace Note tab -> Calls `api.createWorkspaceNote()` or `api.updateWorkspaceNote()`.
  2. **API Route**: `POST` or `PUT` endpoint in `workspace_notes.py`.
  3. **Service**: `workspace_note_service.create_note()` computes word count from content (`len(content.split())`), updates `last_modified_at=datetime.utcnow()`, inserts/updates DB record, and logs `WorkspaceNoteCreated` or `WorkspaceNoteUpdated` timeline event.
  4. **Database**: Updates `workspace_notes` table.
  5. **Response**: Returns `WorkspaceNoteResponse` object to display updated word count and timestamp.

---

### Feature 8: Classroom Announcements Stream
- **Purpose**: Faculty broadcasting channel to post announcements, assignment deadlines, or general notices to students enrolled in a classroom.
- **Database Model**: [`backend/app/models/announcement.py`](file:///e:/MiP/Acadrium/backend/app/models/announcement.py) (`Announcement` model)
- **Schema File**: [`backend/app/schemas/announcement.py`](file:///e:/MiP/Acadrium/backend/app/schemas/announcement.py) (`AnnouncementCreate`, `AnnouncementResponse`)
- **Route / API File**: [`backend/app/routes/announcements.py`](file:///e:/MiP/Acadrium/backend/app/routes/announcements.py) (`POST /api/announcements`, `GET /api/announcements/classroom/{id}`)
- **Service / Business Logic**: [`backend/app/services/announcement_service.py`](file:///e:/MiP/Acadrium/backend/app/services/announcement_service.py) (`create_announcement`, `get_classroom_announcements`)
- **Frontend File**: [`src/pages/Announcements/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Announcements/index.jsx), [`src/pages/Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx)
- **Request Flow**:
  1. **Frontend**: Faculty creates announcement -> Calls `api.createAnnouncement()`.
  2. **API Route**: `POST /api/announcements` validates faculty ownership of the classroom.
  3. **Service**: `announcement_service.create_announcement()` populates author name (`author_name`) & classroom title (`classroom_name`), inserts DB record, and logs `AnnouncementPosted` timeline event.
  4. **Database**: Inserts row into `announcements` table.
  5. **Response**: Returns `AnnouncementResponse` object for real-time feed update.

---

### Feature 9: Announcement Academic Date Support
- **Purpose**: Optional scheduling field allowing faculty to specify an explicit academic date (e.g., Exam Date, Assignment Due Date) on announcements.
- **Database Model**: Column `academic_date` (`Date` type) in `Announcement` model ([`announcement.py`](file:///e:/MiP/Acadrium/backend/app/models/announcement.py))
- **Schema File**: Optional field `academic_date: Optional[date]` in [`announcement.py`](file:///e:/MiP/Acadrium/backend/app/schemas/announcement.py)
- **Route / API File**: Handled via [`announcements.py`](file:///e:/MiP/Acadrium/backend/app/routes/announcements.py) endpoints
- **Service / Business Logic**: Handled in [`announcement_service.py`](file:///e:/MiP/Acadrium/backend/app/services/announcement_service.py)
- **Frontend File**: [`src/pages/Announcements/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Announcements/index.jsx), [`src/pages/Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx), [`src/components/layout/RightSidebar.jsx`](file:///e:/MiP/Acadrium/src/components/layout/RightSidebar.jsx)
- **Request Flow**:
  1. **Frontend**: Faculty enters an optional `academic_date` (e.g. `2026-10-15`) in announcement form.
  2. **API Route**: `POST /api/announcements` parses payload into Pydantic schema.
  3. **Service**: `announcement_service` persists `academic_date` in SQL database and formats it into metadata for timeline logging.
  4. **Database**: Stored as `DATE` type in `announcements` table.
  5. **Response**: UI displays a distinct calendar badge with formatted academic date.

---

### Feature 10: Unified Activity Timeline Subsystem
- **Purpose**: Centralized chronological event logger that tracks student & faculty activities (classroom creations, classroom joins, resource uploads, workspace uploads, note updates, announcement postings) with JSON metadata.
- **Database Model**: [`backend/app/models/timeline_event.py`](file:///e:/MiP/Acadrium/backend/app/models/timeline_event.py) (`TimelineEvent` model)
- **Schema File**: `TimelineEventResponse` schema defined in [`timeline_service.py`](file:///e:/MiP/Acadrium/backend/app/services/timeline_service.py)
- **Route / API File**: [`backend/app/routes/timeline.py`](file:///e:/MiP/Acadrium/backend/app/routes/timeline.py) (`GET /api/timeline`, `GET /api/timeline/user/{id}`)
- **Service / Business Logic**: [`backend/app/services/timeline_service.py`](file:///e:/MiP/Acadrium/backend/app/services/timeline_service.py) (`log_timeline_event`, `get_timeline_events`)
- **Frontend File**: [`src/components/layout/RightSidebar.jsx`](file:///e:/MiP/Acadrium/src/components/layout/RightSidebar.jsx), [`src/pages/Dashboard/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Dashboard/index.jsx)
- **Request Flow**:
  1. **Trigger**: Any business logic operation in `classroom_service`, `resource_service`, `workspace_service`, `workspace_note_service`, or `announcement_service` calls `timeline_service.log_timeline_event()`.
  2. **Logging**: Event inserted into `timeline_events` table with `event_type`, `title`, `user_id`, `classroom_id`, and `metadata_json`.
  3. **API Query**: `RightSidebar.jsx` calls `api.getTimelineEvents()` -> `GET /api/timeline`.
  4. **Database**: Executes `SELECT * FROM timeline_events ORDER BY created_at DESC LIMIT 20`.
  5. **Response**: Frontend renders dynamic timeline stream with action icons and relative timestamps ("2 hours ago").

---

### Feature 11: Denormalized Metadata System
- **Purpose**: High-performance display system storing denormalized string metadata (`uploaded_by_name`, `classroom_name`, `author_name`, `owner_name`, `page_count`, `word_count`, `last_processed_at`) directly on entity models to eliminate N+1 join query bottlenecks during list renderings.
- **Database Model**: Embedded across `resources`, `workspace_resources`, `workspace_notes`, and `announcements` tables.
- **Schema File**: Integrated across all Pydantic schemas in `backend/app/schemas/`.
- **Route / API File**: Handled seamlessly across all entity retrieval endpoints.
- **Service / Business Logic**: Managed during record creation in `services` and automated column migration sync in [`backend/app/database/session.py`](file:///e:/MiP/Acadrium/backend/app/database/session.py).
- **Frontend File**: Consumed by [`Resources/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Resources/index.jsx), [`Workspace/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Workspace/index.jsx), [`Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx).
- **Request Flow**:
  1. **Record Creation**: Service joins related user/classroom details during record insertion.
  2. **Extraction**: `document_processor.py` computes page count and word count.
  3. **Database**: Store metadata fields in database.
  4. **API Fetch**: `GET /api/resources` returns complete metadata object in single query without requiring extra SQL joins.
  5. **UI Display**: Metadata badges (Author, Classroom Name, Word Count, Page Count) display immediately.

---

## 3. Quick Viva Reference Table

| Feature Name | Database Model File | Pydantic Schema File | FastAPI Route File | Service / Logic File | Frontend Page File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | [`user.py`](file:///e:/MiP/Acadrium/backend/app/models/user.py) | [`auth.py`](file:///e:/MiP/Acadrium/backend/app/schemas/auth.py) | [`auth.py`](file:///e:/MiP/Acadrium/backend/app/routes/auth.py) | [`auth_service.py`](file:///e:/MiP/Acadrium/backend/app/services/auth_service.py) | [`Login/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Login/index.jsx) |
| **Classrooms** | [`classroom.py`](file:///e:/MiP/Acadrium/backend/app/models/classroom.py) | [`classroom.py`](file:///e:/MiP/Acadrium/backend/app/schemas/classroom.py) | [`classrooms.py`](file:///e:/MiP/Acadrium/backend/app/routes/classrooms.py) | [`classroom_service.py`](file:///e:/MiP/Acadrium/backend/app/services/classroom_service.py) | [`Classrooms/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/index.jsx) |
| **Classroom Membership** | [`classroom.py`](file:///e:/MiP/Acadrium/backend/app/models/classroom.py) | [`classroom.py`](file:///e:/MiP/Acadrium/backend/app/schemas/classroom.py) | [`classrooms.py`](file:///e:/MiP/Acadrium/backend/app/routes/classrooms.py) | [`classroom_service.py`](file:///e:/MiP/Acadrium/backend/app/services/classroom_service.py) | [`Classrooms/Details.jsx`](file:///e:/MiP/Acadrium/src/pages/Classrooms/Details.jsx) |
| **Resources** | [`resource.py`](file:///e:/MiP/Acadrium/backend/app/models/resource.py) | [`resource.py`](file:///e:/MiP/Acadrium/backend/app/schemas/resource.py) | [`resources.py`](file:///e:/MiP/Acadrium/backend/app/routes/resources.py) | [`resource_service.py`](file:///e:/MiP/Acadrium/backend/app/services/resource_service.py) | [`Resources/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Resources/index.jsx) |
| **Document Processing** | `resource.py` & `workspace_resource.py` | `resource.py` & `workspace.py` | Upload Routes | [`document_processor.py`](file:///e:/MiP/Acadrium/backend/app/services/document_processor.py) | [`DocumentViewer.jsx`](file:///e:/MiP/Acadrium/src/components/common/DocumentViewer.jsx) |
| **Workspace Files** | [`workspace_resource.py`](file:///e:/MiP/Acadrium/backend/app/models/workspace_resource.py) | [`workspace.py`](file:///e:/MiP/Acadrium/backend/app/schemas/workspace.py) | [`workspace.py`](file:///e:/MiP/Acadrium/backend/app/routes/workspace.py) | [`workspace_service.py`](file:///e:/MiP/Acadrium/backend/app/services/workspace_service.py) | [`Workspace/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Workspace/index.jsx) |
| **Workspace Notes** | [`workspace_note.py`](file:///e:/MiP/Acadrium/backend/app/models/workspace_note.py) | [`workspace_note.py`](file:///e:/MiP/Acadrium/backend/app/schemas/workspace_note.py) | [`workspace_notes.py`](file:///e:/MiP/Acadrium/backend/app/routes/workspace_notes.py) | [`workspace_note_service.py`](file:///e:/MiP/Acadrium/backend/app/services/workspace_note_service.py) | [`Workspace/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Workspace/index.jsx) |
| **Announcements** | [`announcement.py`](file:///e:/MiP/Acadrium/backend/app/models/announcement.py) | [`announcement.py`](file:///e:/MiP/Acadrium/backend/app/schemas/announcement.py) | [`announcements.py`](file:///e:/MiP/Acadrium/backend/app/routes/announcements.py) | [`announcement_service.py`](file:///e:/MiP/Acadrium/backend/app/services/announcement_service.py) | [`Announcements/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Announcements/index.jsx) |
| **Academic Date Support** | [`announcement.py`](file:///e:/MiP/Acadrium/backend/app/models/announcement.py) | [`announcement.py`](file:///e:/MiP/Acadrium/backend/app/schemas/announcement.py) | [`announcements.py`](file:///e:/MiP/Acadrium/backend/app/routes/announcements.py) | [`announcement_service.py`](file:///e:/MiP/Acadrium/backend/app/services/announcement_service.py) | [`Announcements/index.jsx`](file:///e:/MiP/Acadrium/src/pages/Announcements/index.jsx) |
| **Timeline System** | [`timeline_event.py`](file:///e:/MiP/Acadrium/backend/app/models/timeline_event.py) | `timeline_service.py` | [`timeline.py`](file:///e:/MiP/Acadrium/backend/app/routes/timeline.py) | [`timeline_service.py`](file:///e:/MiP/Acadrium/backend/app/services/timeline_service.py) | [`RightSidebar.jsx`](file:///e:/MiP/Acadrium/src/components/layout/RightSidebar.jsx) |
| **Metadata System** | All Model Files | All Schema Files | All Entity Routes | `document_processor.py` & `session.py` | `Resources`, `Workspace`, `Details` |

---

## 4. Common Viva & Review Questions

### Q1: How does Acadrium handle Database Connections & Fallbacks?
**Answer**: In [`backend/app/database/session.py`](file:///e:/MiP/Acadrium/backend/app/database/session.py), `create_db_engine()` first attempts to establish a connection to PostgreSQL (using the connection timeout parameter). If PostgreSQL is active (e.g. production environment), it uses PostgreSQL. If the PostgreSQL connection fails or is unavailable, it gracefully falls back to a local SQLite database (`sqlite:///./acadrium.db`).

### Q2: How does Document Processing extract text from PDF, DOCX, and PPTX files?
**Answer**: Document processing is handled in [`backend/app/services/document_processor.py`](file:///e:/MiP/Acadrium/backend/app/services/document_processor.py). It inspects the file extension:
- PDF files are parsed using `pypdf.PdfReader` to extract page text and calculate page count.
- DOCX files are parsed using `docx.Document` to iterate over paragraph text and table cells.
- PPTX files are parsed using `pptx.Presentation` to iterate over slides and text shapes.
- Extracted text is sanitized and word count is calculated using Python's `len(text.split())`.

### Q3: How is Authorization enforced across endpoints?
**Answer**: Authentication dependencies in [`backend/app/auth/dependencies.py`](file:///e:/MiP/Acadrium/backend/app/auth/dependencies.py) verify the HTTP Bearer JWT token on every protected route. Role-based access control is enforced via `require_role(["faculty"])` or `require_role(["student", "faculty"])`. If a student attempts a faculty-only action (such as creating a classroom or posting an announcement), FastAPI immediately returns an HTTP `403 Forbidden` response.

### Q4: How is real-time activity tracking implemented in the Timeline?
**Answer**: Whenever a state-changing business action occurs (joining a classroom, uploading a file, taking a note, or posting an announcement), the service calls `timeline_service.log_timeline_event()` in [`backend/app/services/timeline_service.py`](file:///e:/MiP/Acadrium/backend/app/services/timeline_service.py). This writes a structured event row into the `timeline_events` table. The frontend `RightSidebar.jsx` component queries `GET /api/timeline` to display an up-to-date feed.

### Q5: What is the purpose of the Metadata System?
**Answer**: The Metadata System stores key display fields (`uploaded_by_name`, `classroom_name`, `author_name`, `page_count`, `word_count`) directly on database entity records. This denormalization eliminates expensive SQL join operations during list rendering, ensuring fast response times.
