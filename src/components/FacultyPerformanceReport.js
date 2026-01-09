import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Form, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FacultyPerformanceReport = () => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportAPI.getFacultyPerformanceReport(
        user.id,
        dateRange.startDate,
        dateRange.endDate
      );
      setReport(response.data);
    } catch (err) {
      setError('Failed to load faculty performance report');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleRefresh = () => {
    loadReport();
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container className="mt-4">
        <Alert variant="info">No report data available</Alert>
      </Container>
    );
  }

  // Prepare charts data
  const tasksBySubjectData = report.taskMetrics?.tasksBySubject
    ? Object.entries(report.taskMetrics.tasksBySubject).map(([subject, count]) => ({
        subject,
        count
      }))
    : [];

  const subjectAveragesData = report.assessmentMetrics?.subjectAverages
    ? Object.entries(report.assessmentMetrics.subjectAverages).map(([subject, average]) => ({
        subject,
        average: average.toFixed(2)
      }))
    : [];

  const attendanceStatusData = report.attendanceMetrics?.statusDistribution
    ? Object.entries(report.attendanceMetrics.statusDistribution).map(([status, count]) => ({
        name: status,
        value: count
      }))
    : [];

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-4">
        <Col>
          <h2>Faculty Performance Report</h2>
          <p className="text-muted">
            {report.facultyName} - {report.email}
          </p>
          <small className="text-muted">
            Report Generated On: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
          </small>
        </Col>
      </Row>

      {/* Date Range Filter */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button variant="primary" onClick={handleRefresh}>
            Refresh Report
          </Button>
        </Col>
      </Row>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{report.taskMetrics?.totalTasksCreated || 0}</h3>
              <p className="text-muted">Tasks Created</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{report.engagementMetrics?.totalStudentsTaught || 0}</h3>
              <p className="text-muted">Students Taught</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{report.assessmentMetrics?.totalMarksEntered || 0}</h3>
              <p className="text-muted">Marks Entered</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{report.feedbackMetrics?.totalFeedbackGiven || 0}</h3>
              <p className="text-muted">Feedback Given</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Task Management Metrics */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Task Management</h5>
            </Card.Header>
            <Card.Body>
              {report.taskMetrics && (
                <>
                  <p><strong>Total Tasks Created:</strong> {report.taskMetrics.totalTasksCreated}</p>
                  <p><strong>Total Tasks Assigned:</strong> {report.taskMetrics.totalTasksAssigned}</p>
                  <p><strong>Average Completion Rate:</strong> {report.taskMetrics.averageCompletionRate.toFixed(2)}%</p>
                  
                  {tasksBySubjectData.length > 0 && (
                    <>
                      <h6 className="mt-3">Tasks by Subject</h6>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={tasksBySubjectData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Recent Tasks</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {report.taskMetrics?.recentTasks && report.taskMetrics.recentTasks.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.taskMetrics.recentTasks.map((task, idx) => (
                      <tr key={idx}>
                        <td>{task.title}</td>
                        <td>{task.subject}</td>
                        <td>{task.completionRate.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No recent tasks</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Student Engagement */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Student Engagement</h5>
            </Card.Header>
            <Card.Body>
              {report.engagementMetrics && (
                <>
                  <p><strong>Total Students Taught:</strong> {report.engagementMetrics.totalStudentsTaught}</p>
                  <p><strong>Active Students:</strong> {report.engagementMetrics.activeStudents}</p>
                  <p><strong>Student Response Rate:</strong> {report.engagementMetrics.studentResponseRate.toFixed(2)}%</p>
                  <p><strong>Average Submission Time:</strong> {report.engagementMetrics.averageSubmissionTime.toFixed(1)} days</p>
                  <p><strong>Late Submissions:</strong> {report.engagementMetrics.lateSubmissions}</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Assessment Metrics</h5>
            </Card.Header>
            <Card.Body>
              {report.assessmentMetrics && (
                <>
                  <p><strong>Total Marks Entered:</strong> {report.assessmentMetrics.totalMarksEntered}</p>
                  <p><strong>Overall Class Average:</strong> {report.assessmentMetrics.overallClassAverage.toFixed(2)}%</p>
                  
                  {subjectAveragesData.length > 0 && (
                    <>
                      <h6 className="mt-3">Subject Averages</h6>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={subjectAveragesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="average" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Attendance & Feedback */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Attendance Tracking</h5>
            </Card.Header>
            <Card.Body>
              {report.attendanceMetrics && (
                <>
                  <p><strong>Total Records:</strong> {report.attendanceMetrics.totalAttendanceRecords}</p>
                  <p><strong>Overall Attendance Rate:</strong> {report.attendanceMetrics.overallAttendanceRate.toFixed(2)}%</p>
                  <p><strong>Students with Low Attendance:</strong> {report.attendanceMetrics.studentsWithLowAttendance}</p>
                  
                  {attendanceStatusData.length > 0 && (
                    <>
                      <h6 className="mt-3">Status Distribution</h6>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={attendanceStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {attendanceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Feedback & Quiz Metrics</h5>
            </Card.Header>
            <Card.Body>
              {report.feedbackMetrics && (
                <>
                  <h6>Feedback</h6>
                  <p><strong>Total Feedback Given:</strong> {report.feedbackMetrics.totalFeedbackGiven}</p>
                  <p><strong>Average per Student:</strong> {report.feedbackMetrics.averageFeedbackPerStudent.toFixed(2)}</p>
                  <p><strong>Students Without Feedback:</strong> {report.feedbackMetrics.studentsWithoutFeedback}</p>
                </>
              )}
              
              {report.quizMetrics && (
                <>
                  <h6 className="mt-3">Quiz</h6>
                  <p><strong>Total Quizzes Created:</strong> {report.quizMetrics.totalQuizzesCreated}</p>
                  <p><strong>Total Quiz Attempts:</strong> {report.quizMetrics.totalQuizAttempts}</p>
                  <p><strong>Average Quiz Score:</strong> {report.quizMetrics.averageQuizScore.toFixed(2)}%</p>
                  <p><strong>Students Attempted:</strong> {report.quizMetrics.studentsAttemptedQuizzes}</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FacultyPerformanceReport;
