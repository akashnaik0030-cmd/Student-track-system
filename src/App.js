import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';
import SubmissionList from './components/SubmissionList';
import SubmissionForm from './components/SubmissionForm';
import FeedbackList from './components/FeedbackList';
import FeedbackForm from './components/FeedbackForm';
import UserList from './components/UserList';
import AttendanceView from './components/AttendanceView';
import AttendanceForm from './components/AttendanceForm';
import NoteList from './components/NoteList';
import NoteForm from './components/NoteForm';
import HODSubmissionView from './components/HODSubmissionView';
import HODAttendanceView from './components/HODAttendanceView';
import StudentManagement from './components/StudentManagement';
import FacultyManagement from './components/FacultyManagement';
import FacultyClassSubjectManagement from './components/FacultyClassSubjectManagement';
import ClassManagement from './components/ClassManagement';
import StudentReport from './components/StudentReport';
import ClassReport from './components/ClassReport';
import AllStudentsReport from './components/AllStudentsReport';
import AllFacultyReport from './components/AllFacultyReport';
import TaskWiseReport from './components/TaskWiseReport';
import QuizForm from './components/QuizForm';
import QuizList from './components/QuizList';
import QuizAttempt from './components/QuizAttempt';
import QuizResults from './components/QuizResults';
import QuizMyResult from './components/QuizMyResult';
import MarksForm from './components/MarksForm';
import MarksView from './components/MarksView';
import AssessmentTypeManager from './components/AssessmentTypeManager';
import HODMarksView from './components/HODMarksView';
import AttendanceReportView from './components/AttendanceReportView';
import MarksReportView from './components/MarksReportView';
import SubmissionReportView from './components/SubmissionReportView';
import StudentResultReport from './components/StudentResultReport';
import ResourceLibrary from './components/ResourceLibrary';
import ResourceForm from './components/ResourceForm';
import LiveClassList from './components/LiveClassList';
import LiveClassForm from './components/LiveClassForm';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <div className="container-fluid">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } />
            <Route path="/tasks/new" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <TaskForm />
              </ProtectedRoute>
            } />
            <Route path="/tasks/:id" element={
              <ProtectedRoute>
                <TaskDetail />
              </ProtectedRoute>
            } />
            <Route path="/submissions" element={
              <ProtectedRoute>
                <SubmissionList />
              </ProtectedRoute>
            } />
            <Route path="/submissions/new/:taskId" element={
              <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                <SubmissionForm />
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute>
                <FeedbackList />
              </ProtectedRoute>
            } />
            <Route path="/feedback/new/:taskId/:studentId" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <FeedbackForm />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <UserList />
              </ProtectedRoute>
            } />
            <Route path="/classes" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <ClassManagement />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <AttendanceView />
              </ProtectedRoute>
            } />
            <Route path="/attendance/mark" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY']}>
                <AttendanceForm />
              </ProtectedRoute>
            } />
            <Route path="/notes" element={
              <ProtectedRoute>
                <NoteList />
              </ProtectedRoute>
            } />
            <Route path="/notes/new" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <NoteForm />
              </ProtectedRoute>
            } />
            <Route path="/resources" element={
              <ProtectedRoute>
                <ResourceLibrary />
              </ProtectedRoute>
            } />
            <Route path="/resources/new" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <ResourceLibrary />
              </ProtectedRoute>
            } />
            <Route path="/live-classes" element={
              <ProtectedRoute>
                <LiveClassList />
              </ProtectedRoute>
            } />
            <Route path="/live-classes/new" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <LiveClassList />
              </ProtectedRoute>
            } />
            <Route path="/hod-submissions" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <HODSubmissionView />
              </ProtectedRoute>
            } />
            <Route path="/students" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <StudentManagement />
              </ProtectedRoute>
            } />
            <Route path="/faculty" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <FacultyManagement />
              </ProtectedRoute>
            } />
            <Route path="/faculty-class-subjects" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <FacultyClassSubjectManagement />
              </ProtectedRoute>
            } />
            <Route path="/hod-attendance" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <HODAttendanceView />
              </ProtectedRoute>
            } />
            <Route path="/reports/student/:studentId" element={
              <ProtectedRoute>
                <StudentReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/class/:classId" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <ClassReport />
              </ProtectedRoute>
            } />
            <Route path="/quizzes" element={
              <ProtectedRoute>
                <QuizList />
              </ProtectedRoute>
            } />
            <Route path="/quiz/create" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <QuizForm />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId/attempt" element={
              <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                <QuizAttempt />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId/results" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <QuizResults />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId/my-result" element={
              <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                <QuizMyResult />
              </ProtectedRoute>
            } />
            <Route path="/marks" element={
              <ProtectedRoute>
                <MarksView />
              </ProtectedRoute>
            } />
            <Route path="/marks/add" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <MarksForm />
              </ProtectedRoute>
            } />
            <Route path="/assessment-types" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <AssessmentTypeManager />
              </ProtectedRoute>
            } />
            <Route path="/hod/marks" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <HODMarksView />
              </ProtectedRoute>
            } />
            <Route path="/reports/attendance" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <AttendanceReportView />
              </ProtectedRoute>
            } />
            <Route path="/reports/marks" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <MarksReportView />
              </ProtectedRoute>
            } />
            <Route path="/reports/submissions" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <SubmissionReportView />
              </ProtectedRoute>
            } />
            {/* New Comprehensive Reports */}
            <Route path="/reports/student-detailed" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <AllStudentsReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/faculty-performance" element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <AllFacultyReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/tasks" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <TaskWiseReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/student-results" element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                <StudentResultReport />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;