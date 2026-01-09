import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Button, Alert, Accordion, Badge } from 'react-bootstrap';
import { reportAPI } from '../services/api';

function AllFacultyReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching faculty report with dates:', dateRange.startDate, dateRange.endDate);
      const response = await reportAPI.getAllFacultyReport(dateRange.startDate, dateRange.endDate);
      console.log('Faculty report response:', response);
      console.log('Faculty report data:', response.data);
      console.log('Number of faculty:', response.data?.length);
      setReports(response.data || []);
    } catch (err) {
      console.error('Error loading faculty report:', err);
      console.error('Error details:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load faculty report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    loadReports();
  };

  if (loading) return <Container className="mt-4"><Alert variant="info">Loading faculty report...</Alert></Container>;
  if (error) return (
    <Container className="mt-4">
      <Alert variant="danger">
        <strong>Error:</strong> {error}
        <hr />
        <small>Check the browser console (F12 → Console tab) for detailed error information.</small>
      </Alert>
      <Button variant="secondary" onClick={loadReports}>Retry</Button>
    </Container>
  );

  const handlePrintFaculty = (facultyId) => {
    // Hide all other accordion items
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(item => {
      const itemId = item.getAttribute('data-faculty-id');
      if (itemId !== facultyId.toString()) {
        item.style.display = 'none';
      }
    });
    
    // Print
    window.print();
    
    // Restore all items
    allItems.forEach(item => {
      item.style.display = '';
    });
  };

  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4">All Faculty Report</h2>

      {/* Date Range Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button variant="primary" onClick={handleRefresh}>
                Refresh Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Faculty List - Accordion */}
      <Accordion>
        {reports.map((report, index) => (
          <Accordion.Item eventKey={index.toString()} key={report.facultyId} data-faculty-id={report.facultyId}>
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100 me-3">
                <div>
                  <strong>{report.facultyName}</strong>
                </div>
                <div>
                  <Badge bg="primary" className="me-2">
                    Tasks: {report.taskMetrics?.totalTasksCreated || 0}
                  </Badge>
                  <Badge bg="success" className="me-2">
                    Response Rate: {report.engagementMetrics?.studentResponseRate?.toFixed(1) || 0}%
                  </Badge>
                  <Badge bg="info">
                    Students: {report.engagementMetrics?.totalStudentsTaught || 0}
                  </Badge>
                </div>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="mb-0"><strong>Faculty:</strong> {report.facultyName}</h4>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="no-print"
                  onClick={() => handlePrintFaculty(report.facultyId)}
                >
                  <i className="bi bi-printer me-2"></i>Print This Faculty
                </Button>
              </div>
              <Row>
                {/* Task Management */}
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-primary text-white">
                      <strong>Task Management</strong>
                    </Card.Header>
                    <Card.Body>
                      <Table size="sm" bordered>
                        <tbody>
                          <tr>
                            <td><strong>Total Tasks Created:</strong></td>
                            <td>{report.taskMetrics?.totalTasksCreated || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Total Assignments:</strong></td>
                            <td className="text-success">{report.taskMetrics?.totalTasksAssigned || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Avg Completion Rate:</strong></td>
                            <td>{report.taskMetrics?.averageCompletionRate?.toFixed(1) || 0}%</td>
                          </tr>
                        </tbody>
                      </Table>

                      {report.taskMetrics?.tasksBySubject && Object.keys(report.taskMetrics.tasksBySubject).length > 0 && (
                        <>
                          <h6 className="mt-3">Subject-wise Task Distribution</h6>
                          <Table size="sm" bordered>
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Tasks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(report.taskMetrics.tasksBySubject).map(([subject, count]) => (
                                <tr key={subject}>
                                  <td>{subject}</td>
                                  <td>{count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Engagement Metrics */}
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-success text-white">
                      <strong>Student Engagement</strong>
                    </Card.Header>
                    <Card.Body>
                      <Table size="sm" bordered>
                        <tbody>
                          <tr>
                            <td><strong>Total Students Taught:</strong></td>
                            <td>{report.engagementMetrics?.totalStudentsTaught || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Active Students:</strong></td>
                            <td>{report.engagementMetrics?.activeStudents || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Late Submissions:</strong></td>
                            <td className="text-danger">{report.engagementMetrics?.lateSubmissions || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Avg Submission Time:</strong></td>
                            <td>{report.engagementMetrics?.averageSubmissionTime?.toFixed(1) || 0} days</td>
                          </tr>
                          <tr>
                            <td><strong>Response Rate:</strong></td>
                            <td><strong>{report.engagementMetrics?.studentResponseRate?.toFixed(2) || 0}%</strong></td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Assessment & Quiz Metrics */}
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-info text-white">
                      <strong>Assessment Metrics</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Total Marks Entered:</strong> {report.assessmentMetrics?.totalMarksEntered || 0}</p>
                      <p><strong>Overall Class Average:</strong> {report.assessmentMetrics?.overallClassAverage?.toFixed(2) || 0}%</p>

                      {report.assessmentMetrics?.subjectAverages && Object.keys(report.assessmentMetrics.subjectAverages).length > 0 ? (
                        <>
                          <h6>Subject-wise Averages</h6>
                          <Table size="sm" bordered>
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Average</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(report.assessmentMetrics.subjectAverages).map(([subject, avg]) => (
                                <tr key={subject}>
                                  <td>{subject}</td>
                                  <td>{avg?.toFixed(2) || 0}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </>
                      ) : (
                        <Alert variant="secondary" className="mb-0">No assessment data available</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Quiz & Feedback */}
                <Col md={6} className="mb-3">
                  <Card className="mb-3">
                    <Card.Header className="bg-warning">
                      <strong>Quiz Metrics</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Total Quizzes Created:</strong> {report.quizMetrics?.totalQuizzesCreated || 0}</p>
                      <p><strong>Total Attempts:</strong> {report.quizMetrics?.totalQuizAttempts || 0}</p>
                      <p><strong>Average Quiz Score:</strong> {report.quizMetrics?.averageQuizScore?.toFixed(2) || 0}</p>
                      <p><strong>Students Attempted:</strong> {report.quizMetrics?.studentsAttemptedQuizzes || 0}</p>
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Header className="bg-secondary text-white">
                      <strong>Feedback Metrics</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Total Feedback Given:</strong> {report.feedbackMetrics?.totalFeedbackGiven || 0}</p>
                      <p><strong>Avg Feedback / Student:</strong> {report.feedbackMetrics?.averageFeedbackPerStudent?.toFixed(2) || 0}</p>
                      <p><strong>Students Without Feedback:</strong> {report.feedbackMetrics?.studentsWithoutFeedback || 0}</p>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Attendance Metrics */}
                <Col md={12} className="mb-3">
                  <Card>
                    <Card.Header className="bg-dark text-white">
                      <strong>Attendance Tracking</strong>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={3}>
                          <p><strong>Total Records:</strong> {report.attendanceMetrics?.totalAttendanceRecords || 0}</p>
                        </Col>
                        <Col md={3}>
                          <p><strong>Overall Attendance Rate:</strong> {report.attendanceMetrics?.overallAttendanceRate?.toFixed(2) || 0}%</p>
                        </Col>
                        <Col md={3}>
                          <p><strong>Low Attendance Students:</strong> {report.attendanceMetrics?.studentsWithLowAttendance || 0}</p>
                        </Col>
                        <Col md={3}>
                          <p><strong>Present Count:</strong> {report.attendanceMetrics?.statusDistribution?.PRESENT || 0}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {reports.length === 0 && (
        <Alert variant="warning">No faculty data available for the selected period.</Alert>
      )}
    </Container>
  );
}

export default AllFacultyReport;
