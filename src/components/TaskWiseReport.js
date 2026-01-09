import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Button, Alert, Badge } from 'react-bootstrap';
import { reportAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TaskWiseReport = () => {
  const { user, hasRole } = useAuth();
  const isHOD = hasRole('ROLE_HOD');

  const [tasks, setTasks] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isHOD) {
      loadFaculties();
    } else {
      loadTasks();
    }
  }, [isHOD]);

  const loadFaculties = async () => {
    try {
      const response = await reportAPI.getFacultyList();
      setFaculties(response.data);
    } catch (err) {
      console.error('Error loading faculties:', err);
    }
  };

  const loadTasks = async (facultyId = null) => {
    try {
      setLoading(true);
      const response = await reportAPI.getTasksList(isHOD && facultyId ? facultyId : undefined);
      setTasks(response.data || []);
      setSelectedTaskId('');
      setReport(null);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyChange = (facultyId) => {
    setSelectedFacultyId(facultyId);
    setSelectedTaskId('');
    setReport(null);
    if (facultyId) {
      loadTasks(facultyId);
    } else {
      setTasks([]);
    }
  };

  const handleTaskChange = (taskId) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      loadTaskReport(taskId);
    } else {
      setReport(null);
    }
  };

  const loadTaskReport = async (taskId) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        taskId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      if (isHOD && selectedFacultyId) {
        params.facultyId = selectedFacultyId;
      }
      const response = await reportAPI.getTaskWiseReport(params);
      const reportData = Array.isArray(response.data) && response.data.length > 0 
        ? response.data[0] 
        : response.data;
      setReport(reportData);
    } catch (err) {
      console.error('Error loading task report:', err);
      setError(err.response?.data?.message || 'Failed to load task report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') return <Badge bg="success">Completed</Badge>;
    if (status === 'PENDING') return <Badge bg="warning">Pending</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Task-wise Report</h2>
          <small className="text-muted">Report Generated On: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}</small>
        </div>
        {report && (
          <Button variant="primary" onClick={handlePrint} className="no-print">
            <i className="bi bi-printer me-2" /> Print
          </Button>
        )}
      </div>

      {/* Filter Section */}
      <Card className="mb-4 no-print">
        <Card.Body>
          <Row>
            {/* HOD: Faculty Dropdown */}
            {isHOD && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Faculty</Form.Label>
                  <Form.Select
                    value={selectedFacultyId}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                  >
                    <option value="">-- Select Faculty --</option>
                    {faculties.map(faculty => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {/* Task Dropdown */}
            <Col md={isHOD ? 6 : 12}>
              <Form.Group>
                <Form.Label>Select Task</Form.Label>
                <Form.Select
                  value={selectedTaskId}
                  onChange={(e) => handleTaskChange(e.target.value)}
                  disabled={isHOD && !selectedFacultyId}
                >
                  <option value="">-- Select Task --</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.subject}) - Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {tasks.length > 0 && (
            <Alert variant="info" className="mt-3 mb-0">
              <strong>{tasks.length}</strong> task(s) available
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Loading State */}
      {loading && <Alert variant="info">Loading report...</Alert>}

      {/* Error State */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Report Display */}
      {report && (
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0"><i className="bi bi-file-text me-2"></i>Task Details</h4>
          </Card.Header>
          <Card.Body className="p-4">
            {/* Basic Information Grid */}
            <Row className="mb-4">
              <Col md={4} className="mb-3">
                <div className="border-start border-primary border-4 ps-3">
                  <small className="text-muted d-block mb-1">Task Title</small>
                  <h5 className="mb-0">{report.taskTitle}</h5>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="border-start border-info border-4 ps-3">
                  <small className="text-muted d-block mb-1">Subject</small>
                  <h5 className="mb-0">{report.subject}</h5>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="border-start border-success border-4 ps-3">
                  <small className="text-muted d-block mb-1">Faculty</small>
                  <h5 className="mb-0">{report.facultyName}</h5>
                </div>
              </Col>
              </Row>

              {/* Dates Information */}
              <Row className="mb-4">
                <Col md={12}>
                  <div className="d-flex align-items-center justify-content-around">
                    <div className="text-center">
                      <small className="text-muted d-block mb-1">Created Date</small>
                      <strong className="text-primary">{report.createdDate ? new Date(report.createdDate).toLocaleDateString('en-GB') : 'N/A'}</strong>
                    </div>
                    <div className="text-center">
                      <small className="text-muted d-block mb-1">Start Date</small>
                      <strong className="text-success">{report.startDate ? new Date(report.startDate).toLocaleDateString('en-GB') : 'N/A'}</strong>
                    </div>
                    <div className="text-center">
                      <small className="text-muted d-block mb-1">Due Date</small>
                      <strong className="text-danger">{report.dueDate ? new Date(report.dueDate).toLocaleDateString('en-GB') : 'N/A'}</strong>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Task Description */}
              {report.description && (
                <div className="mt-4">
                  <h5 className="mb-3 text-primary">
                    <i className="bi bi-file-earmark-text me-2"></i>Task Description
                  </h5>
                  <div className="bg-light p-4 rounded border">
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1rem' }}>
                      {report.description}
                    </div>
                  </div>
                </div>
              )}
          </Card.Body>
        </Card>
      )}

      {/* No Task Selected State */}
      {!report && !loading && !error && (
        <Alert variant="secondary">
          <strong>Please select a task to view the report.</strong><br />
          {isHOD && 'Select a faculty first, then choose a task from the dropdown.'}
          {!isHOD && 'Select a task from the dropdown above.'}
        </Alert>
      )}
    </Container>
  );
};

export default TaskWiseReport;
