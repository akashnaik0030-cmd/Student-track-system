import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';

const AttendanceView = () => {
  const { hasRole } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('calendar'); // 'summary', 'date', 'calendar'

  const navigate = useNavigate();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (viewType === 'summary') {
      loadAttendanceSummary();
    } else if (viewType === 'calendar') {
      loadMonthAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, viewType]);

  const loadAttendanceSummary = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getSummary(year, month);
      setSummary(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load attendance summary');
      console.error('Error loading attendance:', error);
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedAttendance = async () => {
    try {
      setLoading(true);
      // Load all attendance for the month
      const response = await attendanceAPI.getTodayAttendance();
      setAttendance(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load attendance details');
      console.error('Error loading attendance:', error);
      toast.error('Failed to load attendance details');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceByDate = async (date) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getByDate(date);
      let attendanceData = response.data;
      if (typeof attendanceData === 'string') {
        attendanceData = JSON.parse(attendanceData);
      }
      setAttendance(attendanceData);
      setError('');
    } catch (error) {
      setError('Failed to load attendance for selected date');
      console.error('Error loading attendance by date:', error);
      toast.error('Failed to load attendance for selected date');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getMonthAttendance(year, month);
      setMonthlyAttendance(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load monthly attendance');
      console.error('Error loading monthly attendance:', error);
      toast.error('Failed to load monthly attendance');
    } finally {
      setLoading(false);
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

  const getStudentAttendanceForMonth = (studentId) => {
    return monthlyAttendance.filter(a => a.studentId === studentId);
  };

  const getAttendanceForDate = (studentId, day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const attendance = monthlyAttendance.find(
      a => a && a.studentId === studentId && a.date && a.date.startsWith(dateStr)
    );
    return attendance ? attendance.status : null;
  };

  const getUniqueStudents = () => {
    const studentIds = [...new Set(monthlyAttendance.map(a => a.studentId))];
    return studentIds.map(id => {
      const att = monthlyAttendance.find(a => a.studentId === id);
      return {
        id: id,
        name: att?.studentName || 'Unknown'
      };
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PRESENT': { variant: 'success', text: 'Present' },
      'ABSENT': { variant: 'danger', text: 'Absent' },
      'LATE': { variant: 'warning', text: 'Late' },
      'EXCUSED': { variant: 'info', text: 'Excused' }
    };
    return badges[status] || { variant: 'secondary', text: status };
  };

  const handleMonthChange = (change) => {
    let newMonth = month + change;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    setMonth(newMonth);
    setYear(newYear);
  };

  if (loading && summary.length === 0) {
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Monthly Attendance</h2>
            {hasRole('ROLE_FACULTY') && (
              <Button variant="primary" onClick={() => navigate('/attendance/mark')}>
                Mark New Attendance
              </Button>
            )}
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
                  Calendar View
                </Button>
                <Button
                  variant={viewType === 'summary' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewType('summary')}
                  size="sm"
                >
                  Summary
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
                      loadAttendanceByDate(e.target.value);
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button 
                  variant="primary" 
                  onClick={() => loadAttendanceByDate(selectedDate)}
                >
                  View Attendance
                </Button>
              </Col>
            </Row>
          )}

          {viewType === 'summary' && (
            <div>
              <h5 className="mb-3">
                Attendance Summary for {months[month - 1]} {year}
              </h5>
              {summary.length === 0 ? (
                <Alert variant="info">No attendance records for this month</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Excused</th>
                      <th>Total Days</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((record, idx) => (
                      <tr key={idx}>
                        <td><strong>{record.studentName}</strong></td>
                        <td><Badge bg="success">{record.statusCounts?.PRESENT || 0}</Badge></td>
                        <td><Badge bg="danger">{record.statusCounts?.ABSENT || 0}</Badge></td>
                        <td><Badge bg="warning">{record.statusCounts?.LATE || 0}</Badge></td>
                        <td><Badge bg="info">{record.statusCounts?.EXCUSED || 0}</Badge></td>
                        <td>{record.totalDays || 0}</td>
                        <td>
                          <Badge bg={record.attendancePercentage >= 75 ? 'success' : 'danger'}>
                            {record.attendancePercentage?.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}

          {viewType === 'date' && (
            <div>
              <h5 className="mb-3">Attendance for {new Date(selectedDate).toLocaleDateString()}</h5>
              {attendance.length === 0 ? (
                <Alert variant="info">No attendance records for this date</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Faculty</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, idx) => (
                      <tr key={idx}>
                        <td><strong>{record.studentName || record.student?.fullName}</strong></td>
                        <td>{getStatusBadge(record.status).text}</td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.facultyName || record.faculty?.fullName || 'N/A'}</td>
                        <td>{record.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}

          {viewType === 'calendar' && (
            <div>
              <h5 className="mb-3">
                Attendance Calendar for {months[month - 1]} {year}
              </h5>
              {monthlyAttendance.length === 0 ? (
                <Alert variant="info">No attendance records for this month</Alert>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table striped bordered hover size="sm" style={{ minWidth: '800px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                      <tr>
                        <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 11 }}>
                          Student Name
                        </th>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map((day) => (
                          <th key={day} style={{ textAlign: 'center', minWidth: '30px' }}>
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getUniqueStudents().map((student) => (
                        <tr key={student.id}>
                          <td style={{ position: 'sticky', left: 0, background: 'white', fontWeight: 'bold' }}>
                            {student.name}
                          </td>
                          {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map((day) => {
                            const status = getAttendanceForDate(student.id, day);
                            const statusColor = {
                              'PRESENT': '#28a745',
                              'ABSENT': '#dc3545',
                              'LATE': '#ffc107',
                              'EXCUSED': '#17a2b8'
                            }[status] || 'transparent';
                            
                            return (
                              <td 
                                key={day} 
                                style={{ 
                                  textAlign: 'center', 
                                  backgroundColor: status ? statusColor : 'transparent',
                                  color: status ? 'white' : 'inherit',
                                  fontWeight: 'bold',
                                  minWidth: '30px'
                                }}
                                title={status || 'No attendance'}
                              >
                                {getStatusInitial(status)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              <div className="mt-3 d-flex gap-3">
                <div><Badge bg="success">P = Present</Badge></div>
                <div><Badge bg="danger">A = Absent</Badge></div>
                <div><Badge bg="warning">L = Late</Badge></div>
                <div><Badge bg="info">E = Excused</Badge></div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AttendanceView;

