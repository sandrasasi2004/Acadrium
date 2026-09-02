// Acadrium Mock Data (Refined with Workspace updates)

export const mockFaculty = {
  id: "fac_sara",
  name: "Prof. SARA",
  email: "sara.cs@acadrium.edu",
  department: "Computer Applications",
  role: "faculty",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
};

export const mockStudent = {
  id: "std_sandra",
  name: "SANDRA SASI",
  email: "sandra.sasi@mca.edu",
  department: "Computer Applications",
  semester: "Semester II",
  role: "student",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
};

export const mockClassrooms = [
  {
    id: "dbms",
    subject: "Database Management System",
    semester: "Sem II",
    courseCode: "MCA20101",
    inviteCode: "a564bfdsaf",
    studentCount: 58,
    facultyId: "fac_sara",
    facultyName: "Prof. SARA",
    description: "Foundational course on relational databases, SQL syntax, schema normalization, transaction management, and indexing techniques."
  },
  {
    id: "ai",
    subject: "Artificial Intelligence",
    semester: "Sem II",
    courseCode: "MCA20102",
    inviteCode: "b984cfb7d1",
    studentCount: 42,
    facultyId: "fac_sara",
    facultyName: "Prof. SARA",
    description: "Covers search algorithms, knowledge representation, logic inference, planning, and basic machine learning concepts."
  },
  {
    id: "ml",
    subject: "Machine Learning",
    semester: "Sem III",
    courseCode: "MCA30101",
    inviteCode: "c123aab52d",
    studentCount: 61,
    facultyId: "fac_sara",
    facultyName: "Prof. SARA",
    description: "Advanced study of supervised and unsupervised learning algorithms, regression, neural networks, and model validation."
  },
  {
    id: "cloud",
    subject: "Cloud Computing",
    semester: "Sem III",
    courseCode: "MCA30102",
    inviteCode: "d456ccd89e",
    studentCount: 35,
    facultyId: "fac_sara",
    facultyName: "Prof. SARA",
    description: "Covers service models (IaaS, PaaS, SaaS), virtualization, cloud architecture, and hands-on containerization with Docker."
  },
  {
    id: "se",
    subject: "Software Engineering",
    semester: "Sem II",
    courseCode: "MCA20104",
    inviteCode: "e789eed12f",
    studentCount: 48,
    facultyId: "fac_sara",
    facultyName: "Prof. SARA",
    description: "Detailed analysis of software lifecycle models, requirement elicitation, UML design, testing methodologies, and agile practices."
  }
];

// Classroom resources uploaded by Faculty (Shared)
export const mockResources = [
  {
    id: "res_1",
    title: "Unit 3 Normalization Notes",
    type: "DOCX",
    uploadedDate: "5 June 2026",
    classroomId: "dbms",
    classroomName: "Database Management System",
    size: "1.2 MB",
    uploadedBy: "Prof. SARA"
  },
  {
    id: "res_2",
    title: "Module 2 Search Heuristics ppt",
    type: "PPT",
    uploadedDate: "4 June 2026",
    classroomId: "ai",
    classroomName: "Artificial Intelligence",
    size: "4.8 MB",
    uploadedBy: "Prof. SARA"
  },
  {
    id: "res_3",
    title: "SQL Query Lab Manual",
    type: "PDF",
    uploadedDate: "28 May 2026",
    classroomId: "dbms",
    classroomName: "Database Management System",
    size: "2.4 MB",
    uploadedBy: "Prof. SARA"
  },
  {
    id: "res_4",
    title: "NoSQL Architectures Overview",
    type: "PPT",
    uploadedDate: "21 May 2026",
    classroomId: "dbms",
    classroomName: "Database Management System",
    size: "3.1 MB",
    uploadedBy: "Prof. SARA"
  },
  {
    id: "res_5",
    title: "VPC and Subnets Deployment Guide",
    type: "PDF",
    uploadedDate: "10 June 2026",
    classroomId: "cloud",
    classroomName: "Cloud Computing",
    size: "1.7 MB",
    uploadedBy: "Prof. SARA"
  },
  {
    id: "res_6",
    title: "Supervised Learning Algorithms Cheat Sheet",
    type: "PDF",
    uploadedDate: "12 June 2026",
    classroomId: "ml",
    classroomName: "Machine Learning",
    size: "950 KB",
    uploadedBy: "Prof. SARA"
  }
];

export const mockAnnouncements = [
  {
    id: "ann_1",
    title: "First Internal Exam Schedule Uploaded",
    content: "The timetable for the First Internal Exam has been uploaded. Exams start next Monday. Attendance is compulsory.",
    date: "12 June 2026",
    classroomId: "dbms",
    classroomName: "Database Management System",
    author: "Prof. SARA"
  },
  {
    id: "ann_2",
    title: "DBMS Practice Session Shifted to Lab 3",
    content: "Please note that tomorrow's regular lecture for DBMS at 10:00 AM is shifted to Lab 3. We will do practice queries on SQL Schema.",
    date: "11 June 2026",
    classroomId: "dbms",
    classroomName: "Database Management System",
    author: "Prof. SARA"
  },
  {
    id: "ann_3",
    title: "Relational Normalization Resource Uploaded",
    content: "I have uploaded Unit 3 Notes covering Transaction Management and concurrency controls. Review it before Wednesday's class.",
    date: "10 June 2026",
    classroomId: "dbms",
    classroomName: "Database Management System",
    author: "Prof. SARA"
  },
  {
    id: "ann_4",
    title: "ML Project Proposals Deadline Extension",
    content: "All groups for the Machine Learning course project must submit their proposal abstracts by this Friday. Please adhere to the format document.",
    date: "8 June 2026",
    classroomId: "ml",
    classroomName: "Machine Learning",
    author: "Prof. SARA"
  }
];

export const mockStudentsList = [
  { id: "s1", name: "Alen Paul", email: "alen.paul@mca.edu", rollNo: "MCA2601", status: "Active" },
  { id: "s2", name: "Anjali Sreekumar", email: "anjali.s@mca.edu", rollNo: "MCA2605", status: "Active" },
  { id: "s3", name: "Devadathan K.S.", email: "devadathan.ks@mca.edu", rollNo: "MCA2612", status: "Active" },
  { id: "s4", name: "Sandra Sasi", email: "sandra.sasi@mca.edu", rollNo: "MCA2644", status: "Active" },
  { id: "s5", name: "Vishnu Prasad", email: "vishnu.prasad@mca.edu", rollNo: "MCA2652", status: "Active" },
  { id: "s6", name: "Meera Nair", email: "meera.nair@mca.edu", rollNo: "MCA2627", status: "Active" }
];

export const mockAiChatHistory = [
  {
    sender: "bot",
    text: "Ask anything about your uploaded classroom materials.",
    time: "Just now"
  }
];

// Student private Workspace uploads
export const mockStudentUploads = [
  {
    id: "upl_std_1",
    title: "DBMS_Assignment_1_Draft.pdf",
    type: "PDF",
    uploadedDate: "14 June 2026",
    size: "420 KB"
  },
  {
    id: "upl_std_2",
    title: "Seminar_Report_AI_Heuristics.docx",
    type: "DOCX",
    uploadedDate: "10 June 2026",
    size: "1.8 MB"
  }
];

// Student private Workspace notes
export const mockStudentNotes = [
  {
    id: "note_std_1",
    title: "Study Plan: DBMS Normalization",
    content: "Revise 1NF, 2NF, 3NF and BCNF definitions. Focus on functional dependencies and lossless decomposition problems. Practice SQL schemas on normalization by Monday.",
    date: "14 June 2026"
  },
  {
    id: "note_std_2",
    title: "Seminar Topics AI",
    content: "- Genetic Algorithms in Pathfinding\n- Deep Learning for NLP Applications\n- Heuristics for Solving complex graphs (A* / IDA*)\n\nSubmit abstracts to Prof. SARA.",
    date: "12 June 2026"
  }
];

// Faculty private Workspace uploads
export const mockFacultyUploads = [
  {
    id: "upl_fac_1",
    title: "DBMS_Exam_Review_Draft.docx",
    type: "DOCX",
    uploadedDate: "12 June 2026",
    size: "850 KB"
  },
  {
    id: "upl_fac_2",
    title: "AI_Research_Syllabus_Proposal.pdf",
    type: "PDF",
    uploadedDate: "08 June 2026",
    size: "3.2 MB"
  }
];

// Faculty private Workspace notes
export const mockFacultyNotes = [
  {
    id: "note_fac_1",
    title: "Teaching Note: Concurrency Control",
    content: "Explain two-phase locking (2PL) protocol, strict 2PL, and rigorous 2PL. Draw serialization graphs to illustrate deadlock scenarios in databases.",
    date: "13 June 2026"
  },
  {
    id: "note_fac_2",
    title: "Sem II Project Review Agenda",
    content: "1. Check Database normal forms in student schemas.\n2. Review UI wireframes for mini projects.\n3. Note down student attendance for the review week.",
    date: "11 June 2026"
  }
];
