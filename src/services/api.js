import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9090';
const API_BASE_URL = 'http://localhost:9090';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },

  // Add request interceptor to handle authentication
  paramsSerializer: params => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      if (params[key] != null) {
        if (Array.isArray(params[key])) {
          params[key].forEach(value => searchParams.append(key, value));
        } else {
          searchParams.append(key, params[key]);
        }
      }
    }
    return searchParams.toString();
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        // Provide a clear message before redirecting
        const msg = 'Session expired or unauthorized. Please login as HOD to continue.';
        // Use alert to avoid adding deps; replace with toast if available
        if (typeof window !== 'undefined' && !window.__sessionAlertShown) {
          window.__sessionAlertShown = true;
          alert(msg);
          setTimeout(() => { window.__sessionAlertShown = false; }, 3000);
        }
      } catch {}
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/signin', credentials),
  register: (userData) => api.post('/api/auth/signup', userData),
  getCurrentUser: () => api.get('/api/auth/user'),
};

export const taskAPI = {
  getAll: () => api.get('/api/tasks'),
  getMyTasks: () => api.get('/api/tasks/my-tasks'),
  getAssignedByMe: () => api.get('/api/tasks/assigned-by-me'),
  getAggregatedAssignedByMe: () => api.get('/api/tasks/assigned-by-me/aggregated'),
  getAggregated: (facultyId) => api.get('/api/tasks/aggregated', { params: { facultyId } }),
  getByFacultyId: (facultyId) => api.get(`/api/tasks/faculty/${facultyId}`),
  getByStatus: (status) => api.get(`/api/tasks/status/${status}`),
  getById: (id) => api.get(`/api/tasks/${id}`),
  create: (taskData) => api.post('/api/tasks', JSON.stringify(taskData), {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  updateStatus: (id, status) => api.put(`/api/tasks/${id}/status?status=${status}`),
};

export const submissionAPI = {
  getByTask: (taskId) => api.get(`/api/submissions/task/${taskId}`),
  getMySubmissions: () => api.get('/api/submissions/my-submissions'),
  getFacultySubmissions: () => api.get('/api/submissions/faculty-submissions'),
  exportFacultySubmissions: () => api.get('/api/submissions/faculty-submissions/export', {
    responseType: 'blob'
  }),
  getById: (id) => api.get(`/api/submissions/${id}`),
  create: (taskId, formData) => api.post(`/api/submissions/task/${taskId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  downloadFile: (submissionId) => api.get(`/api/submissions/${submissionId}/download`, {
    responseType: 'blob'
  }),
  markAsComplete: (submissionId, remark) => api.put(`/api/submissions/${submissionId}/mark-complete`, { remark }),
  getTaskStudentsWithSubmissionStatus: (taskTitle) => api.get(`/api/submissions/task/students?taskTitle=${encodeURIComponent(taskTitle)}`),
  getHODTaskStudentsWithSubmissionStatus: (facultyId, taskTitle) => api.get(`/api/submissions/hod/task/students?facultyId=${facultyId}&taskTitle=${encodeURIComponent(taskTitle)}`),
  getHODOverview: () => api.get('/api/submissions/hod-overview'),
  getHODGrouped: () => api.get('/api/submissions/hod-grouped'),
};

export const feedbackAPI = {
  getByTask: (taskId) => api.get(`/api/feedback/task/${taskId}`),
  getByStudent: (studentId) => api.get(`/api/feedback/student/${studentId}`),
  getMyFeedback: () => api.get('/api/feedback/my-feedback'),
  getById: (id) => api.get(`/api/feedback/${id}`),
  create: (taskId, studentId, feedbackData) => api.post(`/api/feedback/task/${taskId}/student/${studentId}`, feedbackData),
};

export const userAPI = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  getStudents: () => api.get('/api/users/students'),
  getFaculty: () => api.get('/api/users/faculty'),
  createStudent: (studentData) => api.post('/api/users/students', studentData),
  createFaculty: (facultyData) => api.post('/api/users/faculty', facultyData),
  updateById: (id, updateData) => api.put(`/api/users/${id}`, updateData),
  deleteById: (id) => api.delete(`/api/users/${id}`),
};

export const attendanceAPI = {
  markAttendance: (attendanceData) => api.post('/api/attendance', attendanceData),
  getByDate: (date) => api.get(`/api/attendance/date/${date}`),
  getByStudentAndMonth: (studentId, year, month) => api.get(`/api/attendance/student/${studentId}/month/${year}/${month}`),
  getByFacultyAndMonth: (facultyId, year, month) => api.get(`/api/attendance/faculty/${facultyId}/month/${year}/${month}`),
  getSummary: (year, month) => api.get(`/api/attendance/summary/${year}/${month}`),
  getMyAttendance: (year, month) => api.get(`/api/attendance/my-attendance/${year}/${month}`),
  getTodayAttendance: () => api.get('/api/attendance/today'),
  getMonthAttendance: (year, month) => api.get(`/api/attendance/month/${year}/${month}`),
  getHODAttendanceByDate: (date) => api.get(`/api/attendance/hod/date/${date}`),
  getHODAttendanceByMonth: (year, month) => api.get(`/api/attendance/hod/month/${year}/${month}`),
  getHODAttendanceByFacultyAndMonth: (facultyId, year, month) => api.get(`/api/attendance/hod/faculty/${facultyId}/month/${year}/${month}`),
};

export const noteAPI = {
  create: (formData) => api.post('/api/notes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getMyNotes: () => api.get('/api/notes/my-notes'),
  getCreatedByMe: () => api.get('/api/notes/created-by-me'),
  getAll: () => api.get('/api/notes'),
  downloadFile: (noteId) => api.get(`/api/notes/${noteId}/download`, {
    responseType: 'blob'
  }),
  delete: (noteId) => api.delete(`/api/notes/${noteId}`),
};

export const reportAPI = {
  getStudentReport: (studentId, startDate, endDate) => 
    api.get(`/api/reports/student/${studentId}`, { params: { startDate, endDate } }),
  
  getClassReport: (classId, startDate, endDate) =>
    api.get(`/api/reports/class/${classId}`, { params: { startDate, endDate } }),
  
  getDepartmentReport: (departmentId, startDate, endDate) =>
    api.get(`/api/reports/department/${departmentId}`, { params: { startDate, endDate } }),
  
  // New comprehensive reports - ALL students and ALL faculty
  getAllStudentsReport: (startDate, endDate) =>
    api.get('/api/reports/all-students', { params: { startDate, endDate } }),
  
  getAllFacultyReport: (startDate, endDate) =>
    api.get('/api/reports/all-faculty', { params: { startDate, endDate } }),
  
  getTasksList: (facultyId) =>
    api.get('/api/reports/tasks/list', { params: facultyId ? { facultyId } : {} }),
  
  getTaskWiseReport: (params) =>
    api.get('/api/reports/tasks', { params }), // params: { facultyId?, taskId?, startDate, endDate }
  
  getFacultyList: () =>
    api.get('/api/reports/faculty/list')
};

export const quizAPI = {
  getAll: () => api.get('/api/quiz'),
  getById: (id) => api.get(`/api/quiz/${id}`),
  getByFaculty: (facultyId) => api.get(`/api/quiz/faculty/${facultyId}`),
  create: (quizData) => api.post('/api/quiz', quizData),
  submit: (quizId, studentId, submissions) => api.post(`/api/quiz/${quizId}/submit`, submissions, {
    params: { studentId }
  }),
  isAvailable: (quizId) => api.get(`/api/quiz/${quizId}/available`),
  hasAttempted: (quizId, studentId) => api.get(`/api/quiz/${quizId}/attempted`, {
    params: { studentId }
  }),
  getMyAttempt: (quizId) => api.get(`/api/quiz/${quizId}/my-attempt`),
  getQuizAttempts: (quizId) => api.get(`/api/quiz/${quizId}/attempts`),
  getMyAttempts: () => api.get('/api/quiz/my-attempts'),
  getAttemptAnswers: (attemptId) => api.get(`/api/quiz/attempts/${attemptId}/answers`),
  getAllStudentsStatus: (quizId) => api.get(`/api/quiz/${quizId}/all-students-status`),
};

export const marksAPI = {
  add: (marksData) => api.post('/api/marks', marksData),
  addBulk: (entries) => api.post('/api/marks/bulk', { entries }),
  getAll: () => api.get('/api/marks'),
  getAllMarks: () => api.get('/api/marks'),
  // Optional server-side filtering if backend supports query params like ?facultyId=&type=&subject=
  getAllFiltered: (params) => api.get('/api/marks', { params }),
  getMyMarks: () => api.get('/api/marks/my'),
  getStudentMarks: (studentId) => api.get(`/api/marks/student/${studentId}`),
  getStudentMarksByType: (studentId, type) => api.get(`/api/marks/student/${studentId}/type/${type}`),
  getStudentMarksBySubject: (studentId, subject) => api.get(`/api/marks/student/${studentId}/subject/${subject}`),
  getFacultyMarks: (facultyId) => api.get(`/api/marks/faculty/${facultyId}`),
};

export const classAPI = {
  getAll: () => api.get('/api/classes'),
  getActive: () => api.get('/api/classes/active'),
  getById: (id) => api.get(`/api/classes/${id}`),
  getByYear: (year) => api.get(`/api/classes/year/${year}`),
  getByDepartment: (department) => api.get(`/api/classes/department/${department}`),
  create: (classData) => api.post('/api/classes', classData),
  update: (id, classData) => api.put(`/api/classes/${id}`, classData),
  deactivate: (id) => api.put(`/api/classes/${id}/deactivate`),
  activate: (id) => api.put(`/api/classes/${id}/activate`),
  delete: (id) => api.delete(`/api/classes/${id}`),
  checkExists: (name) => api.get(`/api/classes/exists/${encodeURIComponent(name)}`),
};

export const resourceAPI = {
  getAll: () => api.get('/api/resources'),
  getById: (id) => api.get(`/api/resources/${id}`),
  getBySubject: (subject) => api.get(`/api/resources/subject/${subject}`),
  getByType: (type) => api.get(`/api/resources/type/${type}`),
  getByClass: (classId) => api.get(`/api/resources/class/${classId}`),
  getMyResources: () => api.get('/api/resources/my-resources'),
  create: (formData) => api.post('/api/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, resource) => api.put(`/api/resources/${id}`, resource),
  download: (id) => api.get(`/api/resources/${id}/download`, {
    responseType: 'blob'
  }),
  delete: (id) => api.delete(`/api/resources/${id}`),
};

export const liveClassAPI = {
  getAll: () => api.get('/api/live-classes'),
  getUpcoming: () => api.get('/api/live-classes/upcoming'),
  getById: (id) => api.get(`/api/live-classes/${id}`),
  getByFaculty: (facultyId) => api.get(`/api/live-classes/faculty/${facultyId}`),
  getByClass: (classId) => api.get(`/api/live-classes/class/${classId}`),
  getUpcomingForClass: (classId) => api.get(`/api/live-classes/class/${classId}/upcoming`),
  getMyClasses: () => api.get('/api/live-classes/my-classes'),
  create: (liveClass) => api.post('/api/live-classes', liveClass),
  update: (id, liveClass) => api.put(`/api/live-classes/${id}`, liveClass),
  updateStatus: (id, status) => api.put(`/api/live-classes/${id}/status`, null, { params: { status } }),
  addRecording: (id, recordingUrl) => api.put(`/api/live-classes/${id}/recording`, null, { params: { recordingUrl } }),
  delete: (id) => api.delete(`/api/live-classes/${id}`),
};

export const facultyClassSubjectAPI = {
  assignFacultyToClass: (data) => api.post('/api/faculty-class-subjects/assign', data),
  removeAssignment: (id) => api.delete(`/api/faculty-class-subjects/${id}`),
  getAll: () => api.get('/api/faculty-class-subjects'),
  getByFaculty: (facultyId) => api.get(`/api/faculty-class-subjects/faculty/${facultyId}`),
  getByClass: (classId) => api.get(`/api/faculty-class-subjects/class/${classId}`),
  getSubjectsByClass: (classId) => api.get(`/api/faculty-class-subjects/class/${classId}/subjects`),
  getSubjectsByFaculty: (facultyId) => api.get(`/api/faculty-class-subjects/faculty/${facultyId}/subjects`),
};

export default api;