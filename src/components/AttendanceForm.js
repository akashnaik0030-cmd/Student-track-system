import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, userAPI, classAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const AttendanceForm = () => {
  const { hasRole } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    classId: '',
    remarks: ''
  });
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingAttendance, setExistingAttendance] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  useEffect(() => {
    if (formData.date) {
      loadExistingAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getActive();
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadStudents = async () => {
    try {
      const response = await userAPI.getStudents();
      setAllStudents(response.data);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    if (formData.classId) {
      const filteredStudents = allStudents.filter(
        student => student.classEntity?.id === parseInt(formData.classId)
      );
      setStudents(filteredStudents);
      setAttendanceStatus({});
    } else {
      setStudents(allStudents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.classId]);

  const loadExistingAttendance = async () => {
    try {
      // Faculty only sees their own attendance records for the selected date
      const response = await attendanceAPI.getByDate(formData.date);
      setExistingAttendance(response.data || []);
      
      // Pre-populate attendance status from existing data (only for this faculty's records)
      const statusMap = {};
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(att => {
          statusMap[att.studentId] = att.status;
        });
      }
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading existing attendance:', error);
      setExistingAttendance([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PRESENT': 'success',
      'ABSENT': 'danger',
      'LATE': 'warning',
      'EXCUSED': 'info'
    };
    return badges[status] || 'secondary';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate that at least one student has a status
    if (Object.keys(attendanceStatus).length === 0) {
      setError('Please mark attendance for at least one student');
      setLoading(false);
      return;
    }

    try {
      const attendanceData = {
        date: formData.date,
        subject: formData.subject,
        studentAttendance: attendanceStatus,
        remarks: formData.remarks || ''
      };

      await attendanceAPI.markAttendance(attendanceData);
      toast.success('Attendance marked successfully!');
      navigate('/attendance');
    } catch (error) {
      const errorMessage = error.response?.data || 'Failed to mark attendance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (hasRole('ROLE_HOD')) {
    return (
      <div className="form-container">
        <Card>
          <Card.Body>
            <Alert variant="danger">
              <Alert.Heading>Access Denied</Alert.Heading>
              <p>HOD cannot mark attendance. Only faculty members can mark attendance.</p>
            </Alert>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="form-container">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Mark Attendance</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Class (Optional)</Form.Label>
                  <Form.Select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.division ? `- ${cls.division}` : ''} ({cls.academicYear})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Filter students by class
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    placeholder="e.g., Mathematics, Physics"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>General Remarks (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add any remarks"
              />
            </Form.Group>

            <div className="mb-3">
              <h5>Students Attendance</h5>
              <div style={{
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Excused</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.fullName}</td>
                        <td>
                          <Form.Check
                            type="radio"
                            name={`status-${student.id}`}
                            checked={attendanceStatus[student.id] === 'PRESENT'}
                            onChange={() => handleStatusChange(student.id, 'PRESENT')}
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="radio"
                            name={`status-${student.id}`}
                            checked={attendanceStatus[student.id] === 'ABSENT'}
                            onChange={() => handleStatusChange(student.id, 'ABSENT')}
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="radio"
                            name={`status-${student.id}`}
                            checked={attendanceStatus[student.id] === 'LATE'}
                            onChange={() => handleStatusChange(student.id, 'LATE')}
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="radio"
                            name={`status-${student.id}`}
                            checked={attendanceStatus[student.id] === 'EXCUSED'}
                            onChange={() => handleStatusChange(student.id, 'EXCUSED')}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {students.length === 0 && (
                <p className="text-muted text-center mt-3">No students available</p>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Marking...' : 'Mark Attendance'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/attendance')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AttendanceForm;

