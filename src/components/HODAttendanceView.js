import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { attendanceAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';

const HODAttendanceView = () => {
  const { hasRole } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedFacultyName, setSelectedFacultyName] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('calendar'); // 'calendar', 'date', 'faculty'

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadFaculties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewType === 'calendar' && year && month) {
      loadAllAttendanceForMonth();
    } else if (viewType === 'date' && selectedDate) {
      loadAllAttendanceByDate();
    } else if (viewType === 'faculty' && selectedFacultyId && year && month) {
      loadFacultyAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, viewType, selectedDate, selectedFacultyId]);

  const loadFaculties = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getFaculty();
      setFaculties(response.data || []);
      setError('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load faculties';
      setError(errorMessage);
      console.error('Error loading faculties:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAttendanceByDate = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getHODAttendanceByDate(selectedDate);
      setAttendance(response.data || []);
      setError('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load attendance';
      setError(errorMessage);
      console.error('Error loading attendance by date:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAttendanceForMonth = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getHODAttendanceByMonth(year, month);
      setMonthlyAttendance(response.data || []);
      setError('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load monthly attendance';
      setError(errorMessage);
      console.error('Error loading monthly attendance:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getHODAttendanceByFacultyAndMonth(selectedFacultyId, year, month);
      setMonthlyAttendance(response.data || []);
      setError('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load faculty attendance';
      setError(errorMessage);
      console.error('Error loading faculty attendance:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction) => {
    if (direction === 1) {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    } else {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    }
  };

  const getDaysInMonth = () => {
    return new Date(year, month, 0).getDate();
  };

  const getStatusInitial = (status) => {
    if (!status) return '';
    const statusMap = {
      'PRESENT': 'P',
      'ABSENT': 'A',
      'LATE': 'L',
      'EXCUSED': 'E'
    };
    return statusMap[status] || '';
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

  // Group attendance by student and faculty
  const groupAttendanceByStudentAndFaculty = () => {
    const grouped = {};
    
    monthlyAttendance.forEach(att => {
      const studentId = att.studentId;
      const studentName = att.studentName || `Student ${studentId}`;
      const facultyId = att.facultyId;
      const facultyName = att.facultyName || `Faculty ${facultyId}`;
      
      if (!grouped[studentId]) {
        grouped[studentId] = {
          studentId,
          studentName,
          faculties: {}
        };
      }
      
      if (!grouped[studentId].faculties[facultyId]) {
        grouped[studentId].faculties[facultyId] = {
          facultyId,
          facultyName,
          records: []
        };
      }
      
      grouped[studentId].faculties[facultyId].records.push(att);
    });
    
    return grouped;
  };

  const getAttendanceForDate = (studentId, facultyId, day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const attendance = monthlyAttendance.find(
      a => a && a.studentId === studentId && a.facultyId === facultyId && a.date && a.date.startsWith(dateStr)
    );
    return attendance ? attendance.status : null;
  };

  const handleFacultyChange = (e) => {
    const facultyId = e.target.value;
    setSelectedFacultyId(facultyId);
    const faculty = faculties.find(f => f.id.toString() === facultyId);
    setSelectedFacultyName(faculty ? faculty.fullName : '');
  };

  if (!hasRole('ROLE_HOD')) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>You do not have permission to view this page.</p>
      </Alert>
    );
  }

  return (
    <div className="main-content">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>All Faculty Attendance Sheets</h2>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <div className="d-flex gap-2 align-items-center">
                  <Button variant="outline-primary" size="sm" onClick={() => handleMonthChange(-1)}>
                    &larr; Previous
                  </Button>
                  <Form.Select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    style={{ maxWidth: '200px', display: 'inline-block' }}
                  >
                    {months.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </Form.Select>
                  <Form.Control
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    style={{ maxWidth: '120px', display: 'inline-block' }}
                  />
                  <Button variant="outline-primary" size="sm" onClick={() => handleMonthChange(1)}>
                    Next &rarr;
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={6} className="text-end">
              <div className="btn-group" role="group">
                <Button
                  variant={viewType === 'calendar' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewType('calendar')}
                  size="sm"
                >
                  All Faculty View
                </Button>
                <Button
                  variant={viewType === 'faculty' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewType('faculty')}
                  size="sm"
                >
                  By Faculty
                </Button>
                <Button
                  variant={viewType === 'date' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewType('date')}
                  size="sm"
                >
                  By Date
                </Button>
              </div>
            </Col>
          </Row>

          {viewType === 'faculty' && (
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Faculty</Form.Label>
                  <Form.Select value={selectedFacultyId} onChange={handleFacultyChange}>
                    <option value="">Select a faculty...</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.fullName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}

          {viewType === 'date' && (
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Select Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      loadAllAttendanceByDate();
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button variant="primary" onClick={() => loadAllAttendanceByDate()}>
                  View Attendance
                </Button>
              </Col>
            </Row>
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading attendance...</p>
            </div>
          ) : viewType === 'date' ? (
            <div>
              <h5 className="mb-3">Attendance for {selectedDate}</h5>
              {attendance.length === 0 ? (
                <Alert variant="info">No attendance records for this date</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Faculty Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance
                      .sort((a, b) => {
                        // Sort by roll number if available, then by student name
                        const rollA = a.studentRollNumber || '';
                        const rollB = b.studentRollNumber || '';
                        if (rollA && rollB) {
                          return rollA.localeCompare(rollB);
                        }
                        return (a.studentName || '').localeCompare(b.studentName || '');
                      })
                      .map((att, idx) => (
                      <tr key={idx}>
                        <td>{att.studentRollNumber || '-'}</td>
                        <td>{att.studentName}</td>
                        <td>{att.facultyName}</td>
                        <td>
                          <Badge bg={getStatusBadge(att.status)}>
                            {att.status}
                          </Badge>
                        </td>
                        <td>{att.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          ) : viewType === 'faculty' && selectedFacultyId ? (
            <div>
              <h5 className="mb-3">
                Attendance Sheet: {selectedFacultyName} - {months[month - 1]} {year}
              </h5>
              {monthlyAttendance.length === 0 ? (
                <Alert variant="info">No attendance records for this faculty and month</Alert>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th rowSpan="2">Roll No.</th>
                        <th rowSpan="2">Student Name</th>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(day => (
                          <th key={day} style={{ minWidth: '30px' }}>{day}</th>
                        ))}
                      </tr>
                      <tr>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(day => (
                          <th key={day} style={{ minWidth: '30px' }}>
                            {new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(
                        monthlyAttendance.reduce((acc, att) => {
                          const studentId = att.studentId;
                          if (!acc[studentId]) {
                            acc[studentId] = {
                              studentId,
                              studentName: att.studentName,
                              rollNumber: att.studentRollNumber || '-',
                              attendance: {}
                            };
                          }
                          const date = new Date(att.date);
                          const day = date.getDate();
                          acc[studentId].attendance[day] = att.status;
                          return acc;
                        }, {})
                      )
                        .sort((a, b) => {
                          // Sort by roll number if available, then by student name
                          const rollA = a.rollNumber || '';
                          const rollB = b.rollNumber || '';
                          if (rollA && rollB && rollA !== '-' && rollB !== '-') {
                            return rollA.localeCompare(rollB);
                          }
                          return (a.studentName || '').localeCompare(b.studentName || '');
                        })
                        .map((student) => (
                        <tr key={student.studentId}>
                          <td>{student.rollNumber}</td>
                          <td>{student.studentName}</td>
                          {Array.from({ length: getDaysInMonth() }, (_, i) => {
                            const day = i + 1;
                            const status = student.attendance[day];
                            return (
                              <td key={day} className="text-center">
                                <Badge bg={getStatusBadge(status)}>
                                  {getStatusInitial(status)}
                                </Badge>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          ) : viewType === 'calendar' ? (
            <div>
              <h5 className="mb-3">All Faculty Attendance - {months[month - 1]} {year}</h5>
              {monthlyAttendance.length === 0 ? (
                <Alert variant="info">No attendance records for this month</Alert>
              ) : (
                <div>
                  <p className="text-muted mb-3">
                    Showing attendance from all faculty members. Each student may have multiple attendance records 
                    (one per faculty) for the same date.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <Table striped bordered hover responsive size="sm">
                      <thead>
                        <tr>
                          <th>Roll No.</th>
                          <th>Student Name</th>
                          <th>Faculty Name</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyAttendance
                          .sort((a, b) => {
                            // Sort by roll number if available, then by student name
                            const rollA = a.studentRollNumber || '';
                            const rollB = b.studentRollNumber || '';
                            if (rollA && rollB) {
                              return rollA.localeCompare(rollB);
                            }
                            return (a.studentName || '').localeCompare(b.studentName || '');
                          })
                          .map((att, idx) => (
                            <tr key={idx}>
                              <td>{att.studentRollNumber || '-'}</td>
                              <td>{att.studentName}</td>
                              <td>{att.facultyName}</td>
                              <td>{att.date ? new Date(att.date).toLocaleDateString() : '-'}</td>
                              <td>
                                <Badge bg={getStatusBadge(att.status)}>
                                  {att.status}
                                </Badge>
                              </td>
                              <td>{att.remarks || '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : viewType === 'faculty' && !selectedFacultyId ? (
            <Alert variant="info">
              Please select a faculty to view their attendance sheet.
            </Alert>
          ) : null}
        </Card.Body>
      </Card>
    </div>
  );
};

export default HODAttendanceView;






