/**
 * JSDoc Type Definitions for Acadrium Data Models
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} name - Full user name
 * @property {string} email - Email address
 * @property {'student' | 'faculty'} role - User role
 * @property {string} [department] - Department name
 * @property {string} [semester] - Semester string for students
 */

/**
 * @typedef {Object} Classroom
 * @property {string} id - Unique classroom identifier
 * @property {string} subject - Course subject title
 * @property {string} semester - Target semester (e.g., "Sem II")
 * @property {string} courseCode - Unique course code (e.g., "MCA20101")
 * @property {string} inviteCode - 10-character alphanumeric join code
 * @property {number} studentCount - Total enrolled student count
 * @property {string} facultyId - Faculty owner user ID
 * @property {string} facultyName - Faculty owner display name
 * @property {string} [description] - Detailed course description
 */

/**
 * @typedef {Object} Resource
 * @property {string} id - Unique resource identifier
 * @property {string} title - Resource title
 * @property {'PDF' | 'PPT' | 'DOCX' | 'IMAGE' | 'TXT'} type - File extension format
 * @property {string} uploadedDate - Formatted upload date
 * @property {string} classroomId - Associated classroom ID
 * @property {string} classroomName - Associated classroom subject title
 * @property {string} size - File size string (e.g. "1.5 MB")
 * @property {string} uploadedBy - Faculty owner display name
 * @property {string} [fileUrl] - Download/view file URL
 */

/**
 * @typedef {Object} Announcement
 * @property {string} id - Unique announcement identifier
 * @property {string} title - Announcement header title
 * @property {string} content - Main text message body
 * @property {string} date - Formatted date string
 * @property {string} classroomId - Associated classroom ID
 * @property {string} classroomName - Associated classroom subject title
 * @property {string} author - Faculty author display name
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Operation success flag
 * @property {any} [data] - Response payload
 * @property {string} [message] - Message string
 * @property {string} [error] - Error message string
 */

export {};
