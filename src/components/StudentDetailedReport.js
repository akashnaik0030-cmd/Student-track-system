import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Form, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDetailedReport = () => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportAPI.getStudentDetailedReport(
        user.id,
        dateRange.startDate,
        dateRange.endDate
      );
      setReport(response.data);
    } catch (err) {
      setError('Failed to load student report');
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

  // Prepare attendance chart data
  const attendanceData = report.attendanceSummary ? [
    { name: 'Present', value: report.attendanceSummary.present },
    { name: 'Absent', value: report.attendanceSummary.absent },
    { name: 'Late', value: report.attendanceSummary.late },
    { name: 'Excused', value: report.attendanceSummary.excused }
  ].filter(item => item.value > 0) : [];

  // Prepare subject marks chart data
  const subjectMarksData = report.academicPerformance?.subjectWiseMarks
    ? Object.entries(report.academicPerformance.subjectWiseMarks).map(([subject, data]) => ({
        subject,
        average: data.average.toFixed(2),
        highest: data.highest.toFixed(2),
        lowest: data.lowest.toFixed(2)
      }))
    : [];

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-4">
        <Col>
          <h2>Student Detailed Report</h2>
          <p className="text-muted">
            {report.studentName} ({report.rollNumber}) - {report.email}
          </p>
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

      {/* Attendance Summary */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Attendance Summary</h5>
            </Card.Header>
            <Card.Body>
              {report.attendanceSummary && (
                <>
                  <p><strong>Total Classes:</strong> {report.attendanceSummary.totalClasses}</p>
                  <p><strong>Attendance Rate:</strong> {report.attendanceSummary.attendancePercentage.toFixed(2)}%</p>
                  <Table striped bordered hover size="sm">
                    <tbody>
                      <tr>
                        <td>Present</td>
                        <td>{report.attendanceSummary.present}</td>
                      </tr>
                      <tr>
                        <td>Absent</td>
                        <td>{report.attendanceSummary.absent}</td>
                      </tr>
                      <tr>
                        <td>Late</td>
                        <td>{report.attendanceSummary.late}</td>
                      </tr>
                      <tr>
                        <td>Excused</td>
                        <td>{report.attendanceSummary.excused}</td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Attendance Distribution</h5>
            </Card.Header>
            <Card.Body>
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No attendance data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Academic Performance */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Academic Performance</h5>
            </Card.Header>
            <Card.Body>
              {report.academicPerformance && (
                <>
                  <p><strong>Overall Average:</strong> {report.academicPerformance.overallAverage.toFixed(2)}%</p>
                  
                  {subjectMarksData.length > 0 && (
                    <>
                      <h6 className="mt-3">Subject-wise Performance</h6>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={subjectMarksData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="average" fill="#8884d8" name="Average" />
                          <Bar dataKey="highest" fill="#82ca9d" name="Highest" />
                          <Bar dataKey="lowest" fill="#ffc658" name="Lowest" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}

                  {report.academicPerformance.assessments && report.academicPerformance.assessments.length > 0 && (
                    <>
                      <h6 className="mt-4">Recent Assessments</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Percentage</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.academicPerformance.assessments.slice(0, 10).map((assessment, idx) => (
                            <tr key={idx}>
                              <td>{assessment.assessmentType}</td>
                              <td>{assessment.subject}</td>
                              <td>{assessment.marksObtained}/{assessment.totalMarks}</td>
                              <td>{assessment.percentage.toFixed(2)}%</td>
                              <td>{new Date(assessment.date).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Task & Submission Performance */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Task Performance</h5>
            </Card.Header>
            <Card.Body>
              {report.taskPerformance && (
                <>
                  <p><strong>Total Tasks Assigned:</strong> {report.taskPerformance.totalTasksAssigned}</p>
                  <p><strong>Completed:</strong> {report.taskPerformance.completedTasks}</p>
                  <p><strong>Pending:</strong> {report.taskPerformance.pendingTasks}</p>
                  <p><strong>Late Submissions:</strong> {report.taskPerformance.lateSubmissions}</p>
                  <p><strong>Completion Rate:</strong> {report.taskPerformance.completionRate.toFixed(2)}%</p>
                  <p><strong>Average Time to Submit:</strong> {report.taskPerformance.averageTimeToSubmit.toFixed(1)} days</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Quiz Performance</h5>
            </Card.Header>
            <Card.Body>
              {report.quizPerformance && (
                <>
                  <p><strong>Total Quizzes:</strong> {report.quizPerformance.totalQuizzes}</p>
                  <p><strong>Attempted:</strong> {report.quizPerformance.attemptedQuizzes}</p>
                  <p><strong>Average Score:</strong> {report.quizPerformance.averageScore.toFixed(2)}%</p>
                  <p><strong>Highest Score:</strong> {report.quizPerformance.highestScore.toFixed(2)}%</p>
                  <p><strong>Lowest Score:</strong> {report.quizPerformance.lowestScore.toFixed(2)}%</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Feedback Summary */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Feedback Summary</h5>
            </Card.Header>
            <Card.Body>
              {report.feedbackSummary && (
                <>
                  <p><strong>Total Feedback Received:</strong> {report.feedbackSummary.totalFeedbackReceived}</p>
                  {report.feedbackSummary.latestFeedback && (
                    <>
                      <p><strong>Latest Feedback:</strong></p>
                      <Alert variant="info">
                        <p>{report.feedbackSummary.latestFeedback}</p>
                        <small className="text-muted">
                          Date: {new Date(report.feedbackSummary.latestFeedbackDate).toLocaleDateString()}
                        </small>
                      </Alert>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetailedReport;
