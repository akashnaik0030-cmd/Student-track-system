import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Button, Alert, Accordion, Badge } from 'react-bootstrap';
import { reportAPI } from '../services/api';

function AllStudentsReport() {
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
      console.log('Fetching students report with dates:', dateRange.startDate, dateRange.endDate);
      const response = await reportAPI.getAllStudentsReport(dateRange.startDate, dateRange.endDate);
      console.log('Students report response:', response);
      console.log('Students report data:', response.data);
      console.log('Number of students:', response.data?.length);
      setReports(response.data || []);
    } catch (err) {
      console.error('Error loading students report:', err);
      console.error('Error details:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load students report');
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

  if (loading) return <Container className="mt-4"><Alert variant="info">Loading students report...</Alert></Container>;
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

  const handlePrintStudent = (studentId) => {
    // Hide all other accordion items
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(item => {
      const itemId = item.getAttribute('data-student-id');
      if (itemId !== studentId.toString()) {
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
      <h2 className="mb-4">All Students Report</h2>

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

      {/* Students List - Accordion */}
      <Accordion>
        {reports.map((report, index) => (
          <Accordion.Item eventKey={index.toString()} key={report.studentId} data-student-id={report.studentId}>
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100 me-3">
                <div>
                  <strong>{report.rollNumber}</strong> - {report.studentName}
                </div>
                <div>
                  <Badge bg="info" className="me-2">
                    Attendance: {report.attendanceSummary?.attendancePercentage?.toFixed(1) || 0}%
                  </Badge>
                  <Badge bg="success">
                    Avg: {report.academicPerformance?.overallAverage?.toFixed(1) || 0}%
                  </Badge>
                </div>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="mb-0"><strong>Student:</strong> {report.studentName} (Roll No: {report.rollNumber})</h4>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="no-print"
                  onClick={() => handlePrintStudent(report.studentId)}
                >
                  <i className="bi bi-printer me-2"></i>Print This Student
                </Button>
              </div>
              <Row>
                {/* Attendance Summary */}
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-primary text-white">
                      <strong>Attendance Summary</strong>
                    </Card.Header>
                    <Card.Body>
                      <Table size="sm" bordered>
                        <tbody>
                          <tr>
                            <td><strong>Total Classes:</strong></td>
                            <td>{report.attendanceSummary?.totalClasses || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Present:</strong></td>
                            <td className="text-success">{report.attendanceSummary?.present || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Absent:</strong></td>
                            <td className="text-danger">{report.attendanceSummary?.absent || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Late:</strong></td>
                            <td className="text-warning">{report.attendanceSummary?.late || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Excused:</strong></td>
                            <td>{report.attendanceSummary?.excused || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Percentage:</strong></td>
                            <td><strong>{report.attendanceSummary?.attendancePercentage?.toFixed(2) || 0}%</strong></td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Academic Performance */}
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-success text-white">
                      <strong>Academic Performance</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Overall Average:</strong> {report.academicPerformance?.overallAverage?.toFixed(2) || 0}%</p>
                      
                      {report.academicPerformance?.subjectWiseMarks && Object.keys(report.academicPerformance.subjectWiseMarks).length > 0 ? (
                        <Table size="sm" bordered>
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Average</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(report.academicPerformance.subjectWiseMarks).map(([subject, marks]) => (
                              <tr key={subject}>
                                <td>{subject}</td>
                                <td>{marks.average?.toFixed(2) || 0}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Alert variant="secondary" className="mb-0">No marks data available</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Task Performance */}
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-info text-white">
                      <strong>Task Performance</strong>
                    </Card.Header>
                    <Card.Body>
                      <Table size="sm" bordered>
                        <tbody>
                          <tr>
                            <td><strong>Total Tasks:</strong></td>
                            <td>{report.taskPerformance?.totalTasksAssigned || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Completed:</strong></td>
                            <td className="text-success">{report.taskPerformance?.completedTasks || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Pending:</strong></td>
                            <td className="text-warning">{report.taskPerformance?.pendingTasks || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Late Submissions:</strong></td>
                            <td className="text-danger">{report.taskPerformance?.lateSubmissions || 0}</td>
                          </tr>
                          <tr>
                            <td><strong>Completion Rate:</strong></td>
                            <td><strong>{report.taskPerformance?.completionRate?.toFixed(2) || 0}%</strong></td>
                          </tr>
                          <tr>
                            <td><strong>Avg Time to Submit:</strong></td>
                            <td>{report.taskPerformance?.averageTimeToSubmit?.toFixed(1) || 0} days</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Quiz & Feedback */}
                <Col md={6} className="mb-3">
                  <Card className="mb-3">
                    <Card.Header className="bg-warning">
                      <strong>Quiz Performance</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Total Quizzes:</strong> {report.quizPerformance?.totalQuizzes || 0}</p>
                      <p><strong>Attempted:</strong> {report.quizPerformance?.attemptedQuizzes || 0}</p>
                      <p><strong>Average Score:</strong> {report.quizPerformance?.averageScore?.toFixed(2) || 0}%</p>
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Header className="bg-secondary text-white">
                      <strong>Feedback Summary</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Total Feedback:</strong> {report.feedbackSummary?.totalFeedbackReceived || 0}</p>
                      {report.feedbackSummary?.latestFeedback && (
                        <Alert variant="info" className="mb-0">
                          <small><strong>Latest:</strong> {report.feedbackSummary.latestFeedback}</small>
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {!loading && reports.length === 0 && !error && (
        <Alert variant="warning">
          <strong>No student data available for the selected period.</strong><br/>
          Try adjusting the date range or check if students exist in the system.
        </Alert>
      )}
    </Container>
  );
}

export default AllStudentsReport;
