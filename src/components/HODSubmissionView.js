import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Alert, Form } from 'react-bootstrap';
import { submissionAPI, taskAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';

const HODSubmissionView = () => {
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedFacultyName, setSelectedFacultyName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState('');
  const [taskStudents, setTaskStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFaculties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedFacultyId) {
      loadFacultyTasks();
      setSelectedTaskTitle(''); // Reset task selection
      setTaskStudents([]); // Clear students
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacultyId]);

  useEffect(() => {
    if (selectedFacultyId && selectedTaskTitle) {
      loadTaskStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskTitle, selectedFacultyId]);

  const loadFaculties = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getFaculty();
      setFaculties(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load faculties';
      setError(errorMessage);
      console.error('Error loading faculties:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await taskAPI.getByFacultyId(selectedFacultyId);
      
      if (!response.data || response.data.length === 0) {
        setTasks([]);
        toast.info('No tasks found for this faculty');
        return;
      }
      
      // Get unique task titles
      const uniqueTaskTitles = [...new Set(response.data.map(task => task.title))];
      setTasks(uniqueTaskTitles);
      
      // Get faculty name
      const faculty = faculties.find(f => f.id === parseInt(selectedFacultyId));
      if (faculty) {
        setSelectedFacultyName(faculty.fullName);
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
      const response = await submissionAPI.getHODTaskStudentsWithSubmissionStatus(selectedFacultyId, selectedTaskTitle);
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

  const handleDownload = async (submissionId, fileName) => {
    try {
      const response = await submissionAPI.downloadFile(submissionId);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString();
    } catch (error) {
      return '-';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading && faculties.length === 0) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Card>
        <Card.Body>
          <div className="mb-4">
            <h2>All Student Submissions</h2>
            <p className="text-muted">Select a faculty to view their assigned tasks and student submissions</p>
          </div>

          {error && (
            <Alert variant="warning" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Faculty Selector */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center gap-3">
                <label htmlFor="facultySelector" className="form-label mb-0">
                  <strong>Select Faculty:</strong>
                </label>
                <Form.Select
                  id="facultySelector"
                  style={{ maxWidth: '400px' }}
                  value={selectedFacultyId}
                  onChange={(e) => {
                    setSelectedFacultyId(e.target.value);
                    setSelectedTaskTitle('');
                    setTaskStudents([]);
                  }}
                >
                  <option value="">-- Select Faculty --</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.fullName}
                    </option>
                  ))}
                </Form.Select>
                {faculties.length === 0 && (
                  <span className="text-muted">No faculties found.</span>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Task Selector - Show only when faculty is selected */}
          {selectedFacultyId && (
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex align-items-center gap-3">
                  <label htmlFor="taskSelector" className="form-label mb-0">
                    <strong>Select Assignment/Task:</strong>
                  </label>
                  {loading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading tasks...</span>
                    </div>
                  ) : (
                    <>
                      <Form.Select
                        id="taskSelector"
                        style={{ maxWidth: '400px' }}
                        value={selectedTaskTitle}
                        onChange={(e) => setSelectedTaskTitle(e.target.value)}
                      >
                        <option value="">-- Select Task --</option>
                        {tasks.map((taskTitle, index) => (
                          <option key={index} value={taskTitle}>
                            {taskTitle}
                          </option>
                        ))}
                      </Form.Select>
                      {tasks.length === 0 && (
                        <span className="text-muted">No tasks found for this faculty.</span>
                      )}
                    </>
                  )}
                </div>
                {selectedFacultyName && (
                  <div className="mt-2">
                    <small className="text-muted">Faculty: <strong>{selectedFacultyName}</strong></small>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Students Table - Show only when task is selected */}
          {selectedTaskTitle && (
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Assignment: {selectedTaskTitle}</h5>
                <small>Faculty: {selectedFacultyName} | Total Students: {taskStudents.length}</small>
              </Card.Header>
              <Card.Body>
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
                    <small>This task may not have been assigned to any students yet.</small>
                  </Alert>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th style={{ width: '8%' }}>Roll No.</th>
                          <th style={{ width: '15%' }}>Student Name</th>
                          <th style={{ width: '12%' }}>Status</th>
                          <th style={{ width: '25%' }}>Submission Content</th>
                          <th style={{ width: '12%' }}>Submitted Date</th>
                          <th style={{ width: '18%' }}>PDF File</th>
                          <th style={{ width: '10%' }}>Actions</th>
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
                              {student.hasSubmission && student.fileName && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleDownload(student.submissionId, student.fileName)}
                                >
                                  📥 Download
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

          {/* Instructions when nothing is selected */}
          {!selectedFacultyId && (
            <Alert variant="info" className="text-center">
              <strong>Please select a faculty to view submissions</strong>
              <br />
              <small>Choose a faculty from the dropdown above to see their assigned tasks and student submissions.</small>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default HODSubmissionView;
