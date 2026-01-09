import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Alert, Table, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { submissionAPI, taskAPI, feedbackAPI } from '../services/api';
import { toast } from 'react-toastify';

const SubmissionList = () => {
  const { user, hasRole } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [remark, setRemark] = useState('');
  
  // For faculty: task selector
  const [tasks, setTasks] = useState([]);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState('');
  const [taskStudents, setTaskStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // For feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackContent, setFeedbackContent] = useState('');
  
  // Group submissions by task for faculty and sort by roll number
  const groupSubmissionsByTask = (submissions) => {
    const grouped = {};
    submissions.forEach(submission => {
      const taskKey = `${submission.taskTitle} (${submission.taskSubject || 'No Subject'})`;
      if (!grouped[taskKey]) {
        grouped[taskKey] = [];
      }
      grouped[taskKey].push(submission);
    });
    
    // Sort each group by roll number
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const rollA = a.studentRollNumber || '';
        const rollB = b.studentRollNumber || '';
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
      });
    });
    
    return grouped;
  };
  
  const handleDownload = async (submissionId, fileName) => {
    try {
      const response = await submissionAPI.downloadFile(submissionId);
      
      // Create a blob from the response
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
      
      // For faculty, after download, they can mark as complete
      if (hasRole('ROLE_FACULTY')) {
        const submission = submissions.find(s => s.submissionId === submissionId);
        if (submission && submission.status !== 'COMPLETED') {
          // Optionally auto-open the mark complete modal after download
          // setSelectedSubmission(submission);
          // setShowMarkCompleteModal(true);
        }
      }
    } catch (error) {
      toast.error('Failed to download file');
      console.error('Download error:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedSubmission) return;
    
    try {
      await submissionAPI.markAsComplete(selectedSubmission.submissionId, remark);
      toast.success('Submission marked as complete!');
      setShowMarkCompleteModal(false);
      setSelectedSubmission(null);
      setRemark('');
      // Reload task students to show updated status
      if (hasRole('ROLE_FACULTY') && selectedTaskTitle) {
        loadTaskStudents();
      } else {
        loadSubmissions();
      }
    } catch (error) {
      toast.error('Failed to mark submission as complete');
      console.error('Error marking complete:', error);
    }
  };

  const openMarkCompleteModal = (submission) => {
    setSelectedSubmission(submission);
    setRemark(submission.facultyRemark || '');
    setShowMarkCompleteModal(true);
  };

  const openFeedbackModal = (student) => {
    setSelectedStudent(student);
    setFeedbackContent('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      toast.error('Please provide feedback content');
      return;
    }

    if (!selectedStudent || !selectedStudent.taskId) {
      toast.error('Task information not found');
      return;
    }

    try {
      await feedbackAPI.create(selectedStudent.taskId, selectedStudent.studentId, { 
        content: feedbackContent 
      });
      toast.success('Feedback sent successfully!');
      setShowFeedbackModal(false);
      setSelectedStudent(null);
      setFeedbackContent('');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to send feedback');
      console.error('Error sending feedback:', error);
    }
  };

  useEffect(() => {
    if (hasRole('ROLE_FACULTY')) {
      loadFacultyTasks();
    } else {
    loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRole]);

  useEffect(() => {
    if (hasRole('ROLE_FACULTY') && selectedTaskTitle) {
      loadTaskStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskTitle]);

  const loadFacultyTasks = async () => {
    try {
      setLoading(true);
      setError('');
      // Get all tasks assigned by faculty
      const response = await taskAPI.getAssignedByMe();
      
      if (!response.data || response.data.length === 0) {
        setTasks([]);
        setError('No tasks found. Please create tasks first.');
        toast.info('No tasks found. Create tasks and assign them to students first.');
        return;
      }
      
      // Get unique task titles
      const uniqueTaskTitles = [...new Set(response.data.map(task => task.title))];
      setTasks(uniqueTaskTitles);
      
      // Select first task by default
      if (uniqueTaskTitles.length > 0) {
        setSelectedTaskTitle(uniqueTaskTitles[0]);
      } else {
        setError('No unique task titles found');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tasks';
      setError(errorMessage);
      console.error('Error loading tasks:', error);
      toast.error(errorMessage);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskStudents = async () => {
    try {
      setLoadingStudents(true);
      setError('');
      const response = await submissionAPI.getTaskStudentsWithSubmissionStatus(selectedTaskTitle);
      setTaskStudents(response.data);
      if (response.data && response.data.length === 0) {
        toast.info('No students assigned to this task yet');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load students for this task';
      setError(errorMessage);
      console.error('Error loading students:', error);
      toast.error(errorMessage);
      setTaskStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
        // Students see their own submissions
      const response = await submissionAPI.getMySubmissions();
      setSubmissions(response.data);
    } catch (error) {
      setError('Failed to load submissions');
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
    return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Group submissions by faculty for students
  const groupSubmissionsByFaculty = (submissions) => {
    if (!hasRole('ROLE_STUDENT')) return { 'All Submissions': submissions };
    
    const grouped = {};
    submissions.forEach(submission => {
      // Try to get faculty name from submission data
      const facultyName = submission.facultyName || submission.assignedBy || 'Unknown Faculty';
      if (!grouped[facultyName]) {
        grouped[facultyName] = [];
      }
      grouped[facultyName].push(submission);
    });
    
    // Sort faculty names alphabetically
    const sortedGroups = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGroups[key] = grouped[key];
    });
    
    return sortedGroups;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const groupedSubmissions = groupSubmissionsByFaculty(submissions);

  return (
    <div className="main-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{hasRole('ROLE_FACULTY') ? 'Student Submissions' : 'My Submissions'}</h2>
        <div className="d-flex gap-2">
          {hasRole('ROLE_STUDENT') && (
            <Button as={Link} to="/tasks" variant="primary">
              View Tasks to Submit
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {hasRole('ROLE_FACULTY') ? (
        // Faculty: Show task selector and student list
        <div>
          {/* Task Selector */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center gap-3">
                <label htmlFor="taskSelector" className="form-label mb-0">
                  <strong>Select Assignment:</strong>
                </label>
                <Form.Select
                  id="taskSelector"
                  style={{ maxWidth: '400px' }}
                  value={selectedTaskTitle}
                  onChange={(e) => setSelectedTaskTitle(e.target.value)}
                >
                  {tasks.map((taskTitle, index) => (
                    <option key={index} value={taskTitle}>
                      {taskTitle}
                    </option>
                  ))}
                </Form.Select>
                {tasks.length === 0 && (
                  <span className="text-muted">No tasks found. Create tasks first.</span>
            )}
              </div>
          </Card.Body>
        </Card>

          {/* Students Table for Selected Task */}
          {selectedTaskTitle && (
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Assignment: {selectedTaskTitle}</h5>
                <small>Total Students: {taskStudents.length}</small>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="warning" className="mb-3" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}
                {loadingStudents ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading students...</p>
                  </div>
                ) : taskStudents.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <strong>No students assigned to this task yet.</strong>
                    <br />
                    <small>Create tasks and assign them to students to see submissions here.</small>
                  </Alert>
                ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                          <th style={{ width: '8%' }}>Roll No.</th>
                          <th style={{ width: '15%' }}>Student Name</th>
                          <th style={{ width: '10%' }}>Status</th>
                          <th style={{ width: '10%' }}>Timeliness</th>
                          <th style={{ width: '22%' }}>Submission Content</th>
                        <th style={{ width: '12%' }}>Submitted Date</th>
                          <th style={{ width: '15%' }}>PDF File</th>
                          <th style={{ width: '8%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                        {taskStudents.map((student) => (
                          <tr key={student.studentId}>
                            <td>
                              <strong className="text-primary">
                                {student.studentRollNumber || 'N/A'}
                              </strong>
                            </td>
                            <td><strong>{student.studentName}</strong></td>
                            <td>
                              {student.hasSubmission ? (
                                student.submissionStatus === 'COMPLETED' ? (
                                  <Badge bg="success">✓ Complete</Badge>
                                ) : (
                                  <Badge bg="info">✓ Submitted</Badge>
                                )
                              ) : (
                                <Badge bg="secondary">Not Submitted</Badge>
                              )}
                            </td>
                            <td>
                              {student.hasSubmission && student.submissionTimeliness ? (
                                student.submissionTimeliness === 'ON_TIME' ? (
                                  <Badge bg="success">⏰ On Time</Badge>
                                ) : (
                                  <Badge bg="danger">⏰ Late</Badge>
                                )
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          <td>
                              {student.hasSubmission && student.submissionContent ? (
                            <div style={{ 
                              maxHeight: '100px', 
                              overflowY: 'auto',
                                  fontSize: '0.85rem',
                                  padding: '5px',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '4px',
                                  backgroundColor: '#f9f9f9'
                            }}>
                                  {student.submissionContent}
                            </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                          </td>
                            <td>
                              {student.hasSubmission && student.submittedAt ? (
                                <small className="text-muted">
                                  {formatDate(student.submittedAt)}
                                </small>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {student.hasSubmission && student.fileName ? (
                                <div>
                                  <Badge bg="info" className="mb-1">
                                    📄 {student.fileName}
                              </Badge>
                                  {student.fileSize && (
                                    <small className="text-muted d-block">
                                      ({formatFileSize(student.fileSize)})
                                    </small>
                                  )}
                                </div>
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                              {student.hasSubmission && student.fileName ? (
                                <div className="d-flex flex-column gap-1">
                              <Button
                                variant="outline-success"
                                size="sm"
                                    onClick={() => handleDownload(student.submissionId, student.fileName)}
                              >
                                📥 Download
                              </Button>
                                  {student.submissionStatus !== 'COMPLETED' && (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => openMarkCompleteModal({
                                        submissionId: student.submissionId,
                                        studentName: student.studentName,
                                        studentRollNumber: student.studentRollNumber,
                                        taskTitle: student.taskTitle,
                                        submittedAt: student.submittedAt,
                                        facultyRemark: student.facultyRemark
                                      })}
                                    >
                                      ✓ Mark Complete
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => openFeedbackModal({
                                      studentId: student.studentId,
                                      studentName: student.studentName,
                                      studentRollNumber: student.studentRollNumber,
                                      taskId: student.taskId,
                                      taskTitle: student.taskTitle
                                    })}
                                  >
                                    💬 Give Feedback
                                  </Button>
                                  {student.submissionStatus === 'COMPLETED' && student.facultyRemark && (
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                      Remark: {student.facultyRemark.substring(0, 30)}...
                                    </small>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => openFeedbackModal({
                                    studentId: student.studentId,
                                    studentName: student.studentName,
                                    studentRollNumber: student.studentRollNumber,
                                    taskId: student.taskId,
                                    taskTitle: student.taskTitle
                                  })}
                                >
                                  💬 Give Feedback
                                </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                )}
              </Card.Body>
            </Card>
          )}
        </div>
      ) : submissions.length === 0 ? (
        // Students: No submissions found
        <Card>
          <Card.Body className="text-center">
            <p className="text-muted">No submissions found.</p>
            {hasRole('ROLE_STUDENT') && (
              <Button as={Link} to="/tasks" variant="primary">
                View Available Tasks
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        // Students: Show grouped by faculty
        <div>
          {Object.entries(groupedSubmissions).map(([facultyName, facultySubmissions], index) => (
            <Card key={facultyName} className="mb-4" style={{ borderLeft: `4px solid ${index % 2 === 0 ? '#007bff' : '#28a745'}` }}>
              <Card.Header style={{ backgroundColor: index % 2 === 0 ? '#e7f3ff' : '#e8f5e9' }}>
                <h5 className="mb-0">
                  <strong>Section {index + 1}: {facultyName}</strong>
                  <Badge bg="secondary" className="ms-2">{facultySubmissions.length} Submission{facultySubmissions.length !== 1 ? 's' : ''}</Badge>
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-4">
                  {facultySubmissions.map((submission) => (
                    <Col md={6} lg={4} key={submission.submissionId}>
                      <Card className="submission-card h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="card-title">{submission.taskTitle}</h6>
                            <div className="d-flex gap-1 flex-wrap">
                            {submission.status === 'COMPLETED' ? (
                              <Badge bg="success">✓ Complete</Badge>
                            ) : (
                            <Badge bg="info">Submitted</Badge>
                            )}
                            {submission.submissionTimeliness && (
                              submission.submissionTimeliness === 'ON_TIME' ? (
                                <Badge bg="success">⏰ On Time</Badge>
                              ) : (
                                <Badge bg="danger">⏰ Late</Badge>
                              )
                            )}
                            </div>
                          </div>
                          
                          {/* Content Section */}
                          <div className="mb-3">
                            <h6 className="text-primary mb-2">📝 Submission Content:</h6>
                            <div style={{ 
                              padding: '10px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              backgroundColor: '#f9f9f9',
                              minHeight: '80px',
                              maxHeight: '150px',
                              overflowY: 'auto',
                              fontSize: '0.9rem'
                            }}>
                              {submission.submissionContent}
                            </div>
                          </div>

                          {/* Date Section */}
                          <div className="mb-3">
                            <h6 className="text-primary mb-1">📅 Submitted Date:</h6>
                            <p className="mb-0">
                              <strong>{formatDate(submission.submittedAt)}</strong>
                            </p>
                          </div>

                          {/* PDF File Section */}
                          {submission.fileName && (
                            <div className="mb-3">
                              <h6 className="text-primary mb-2">📄 PDF File:</h6>
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg="info" style={{ fontSize: '0.9rem' }}>
                                📎 {submission.fileName}
                                </Badge>
                                {submission.fileSize && (
                                  <small className="text-muted">
                                    ({formatFileSize(submission.fileSize)})
                                  </small>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="d-flex gap-2 flex-wrap mt-3">
                            {submission.fileName && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleDownload(submission.submissionId, submission.fileName)}
                              >
                                📥 Download PDF
                              </Button>
                            )}
                            {submission.taskId && (
                              <Button
                                as={Link}
                                to={`/tasks/${submission.taskId}`}
                                variant="outline-primary"
                                size="sm"
                              >
                                View Task Details
                              </Button>
                            )}
                            <Button
                              as={Link}
                              to="/feedback"
                              variant="outline-info"
                              size="sm"
                            >
                              View Feedback
                            </Button>
                          </div>

                          {/* Faculty Remark if completed */}
                          {submission.status === 'COMPLETED' && submission.facultyRemark && (
                            <div className="mt-3 pt-3 border-top">
                              <h6 className="text-success mb-1">✓ Faculty Remark:</h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                                {submission.facultyRemark}
                              </p>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Mark Complete Modal for Faculty */}
      <Modal show={showMarkCompleteModal} onHide={() => {
        setShowMarkCompleteModal(false);
        setSelectedSubmission(null);
        setRemark('');
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Submission as Complete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSubmission && (
            <div className="mb-3">
              <p><strong>Student:</strong> {selectedSubmission.studentName} 
                {selectedSubmission.studentRollNumber && ` (Roll No: ${selectedSubmission.studentRollNumber})`}
              </p>
              <p><strong>Task:</strong> {selectedSubmission.taskTitle}</p>
              <p><strong>Submitted Date:</strong> {formatDate(selectedSubmission.submittedAt)}</p>
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Add Remark (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter your remark here..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
              <Form.Text className="text-muted">
                This remark will be saved with the submission.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowMarkCompleteModal(false);
            setSelectedSubmission(null);
            setRemark('');
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleMarkComplete}>
            Mark as Complete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Feedback Modal for Faculty */}
      <Modal show={showFeedbackModal} onHide={() => {
        setShowFeedbackModal(false);
        setSelectedStudent(null);
        setFeedbackContent('');
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Provide Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div className="mb-3">
              <Alert variant="info">
                <p className="mb-1"><strong>Student:</strong> {selectedStudent.studentName}</p>
                {selectedStudent.studentRollNumber && (
                  <p className="mb-1"><strong>Roll Number:</strong> {selectedStudent.studentRollNumber}</p>
                )}
                <p className="mb-0"><strong>Task:</strong> {selectedStudent.taskTitle}</p>
              </Alert>
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Feedback Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="Provide constructive feedback to help the student improve..."
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Be specific and constructive in your feedback. The student will be able to view this in their feedback section.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowFeedbackModal(false);
            setSelectedStudent(null);
            setFeedbackContent('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitFeedback}
            disabled={!feedbackContent.trim()}
          >
            Send Feedback
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubmissionList;