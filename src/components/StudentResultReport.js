import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Button, Alert, Badge } from 'react-bootstrap';
import { marksAPI, classAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function StudentResultReport() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    subject: '',
    assessmentType: 'UNIT_TEST_1',
    classId: ''
  });

  useEffect(() => {
    loadClasses();
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getActive();
      setClasses(response.data);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all marks
      const response = await marksAPI.getAllMarks();
      console.log('Raw API Response:', response);
      console.log('Marks data array:', response.data);
      console.log('Total marks records:', response.data?.length || 0);
      
      if (!response.data || response.data.length === 0) {
        console.warn('No marks data received from API');
        setStudents([]);
        setLoading(false);
        return;
      }
      
      // Group marks by student
      const studentMarksMap = {};
      
      response.data.forEach((mark, index) => {
        console.log(`Processing mark ${index + 1}:`, mark);
        
        // Handle both nested (student.id) and flat (studentId) structure
        const studentId = mark.studentId || mark.student?.id;
        const studentName = mark.studentName || mark.student?.name || mark.student?.username || 'Unknown';
        const rollNumber = mark.studentRollNumber || mark.student?.rollNumber || 'N/A';
        const classId = mark.classId || mark.student?.classId;
        const className = mark.className || mark.student?.className;
        const subject = mark.subject || 'Unknown Subject';
        const assessmentType = mark.assessmentType;
        const marksObtained = mark.marks !== null && mark.marks !== undefined ? mark.marks : 
                            (mark.marksObtained !== null && mark.marksObtained !== undefined ? mark.marksObtained : null);
        
        console.log(`  Student ID: ${studentId}, Name: ${studentName}, Roll: ${rollNumber}`);
        console.log(`  Subject: ${subject}, Type: ${assessmentType}, Marks: ${marksObtained}`);
        
        if (!studentId) {
          console.warn('  Skipping - no student ID');
          return;
        }
        
        if (!studentMarksMap[studentId]) {
          studentMarksMap[studentId] = {
            id: studentId,
            name: studentName,
            rollNumber: rollNumber,
            classId: classId,
            className: className,
            subjects: {}
          };
        }
        
        if (!studentMarksMap[studentId].subjects[subject]) {
          studentMarksMap[studentId].subjects[subject] = {
            UNIT_TEST_1: null,
            UNIT_TEST_2: null,
            SEMESTER_1: null,
            'Unit Test 1': null,
            'Unit Test 2': null,
            'Semester 1': null
          };
        }
        
        // Handle both formats: UNIT_TEST_1 and "Unit Test 1"
        const normalizedType = assessmentType?.toUpperCase().replace(/\s+/g, '_');
        
        if (assessmentType === 'UNIT_TEST_1' || assessmentType === 'Unit Test 1' || normalizedType === 'UNIT_TEST_1') {
          studentMarksMap[studentId].subjects[subject].UNIT_TEST_1 = marksObtained;
          console.log(`  Added Unit Test 1 mark: ${marksObtained}`);
        } else if (assessmentType === 'UNIT_TEST_2' || assessmentType === 'Unit Test 2' || normalizedType === 'UNIT_TEST_2') {
          studentMarksMap[studentId].subjects[subject].UNIT_TEST_2 = marksObtained;
          console.log(`  Added Unit Test 2 mark: ${marksObtained}`);
        } else if (assessmentType === 'SEMESTER_1' || assessmentType === 'Semester 1' || normalizedType === 'SEMESTER_1') {
          studentMarksMap[studentId].subjects[subject].SEMESTER_1 = marksObtained;
          console.log(`  Added Semester 1 mark: ${marksObtained}`);
        } else {
          console.log(`  Unknown assessment type: "${assessmentType}"`);
        }
      });
      
      // Convert to array and sort by roll number
      const studentsList = Object.values(studentMarksMap).sort((a, b) => {
        const rollA = parseInt(a.rollNumber) || 0;
        const rollB = parseInt(b.rollNumber) || 0;
        return rollA - rollB;
      });
      
      console.log('Final processed students:', studentsList);
      console.log('Number of students:', studentsList.length);
      const allSubjects = [...new Set(response.data.map(m => m.subject))];
      console.log('All subjects found:', allSubjects);
      
      setStudents(studentsList);
      
      // Auto-select first subject only for non-HOD (faculty view needs a subject)
      const isHODTemp = user?.roles?.some(r => (r?.name || r) === 'ROLE_HOD');
      if (!isHODTemp && studentsList.length > 0) {
        const firstSubject = allSubjects[0] || Object.keys(studentsList[0].subjects)[0];
        if (firstSubject) {
          console.log('Auto-selecting subject for faculty:', firstSubject);
          setFilters(prev => ({ ...prev, subject: firstSubject }));
        }
      }
    } catch (err) {
      console.error('Error loading results:', err);
      console.error('Error details:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load student results');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Get unique subjects (raw list from data)
  const allSubjects = [...new Set(
    students.flatMap(student => Object.keys(student.subjects))
  )];

  // Desired display order: mt, ds, cc, ai, ml (AI & ML last)
  const preferredOrder = [
    'Mobile Technology',
    'Data Science',
    'Cloud Computing',
    'Artificial Intelligence',
    'Machine Learning'
  ];

  // Build ordered list: first those in preferredOrder (in that order), then any others not listed
  const orderedSubjects = preferredOrder.filter(s => allSubjects.includes(s))
    .concat(allSubjects.filter(s => !preferredOrder.includes(s)));

  // Check if user is HOD (supports roles as objects or raw strings)
  const isHOD = !!(user?.roles?.some(role => (role?.name || role) === 'ROLE_HOD'));

  // Filter students by class first if selected
  let displayStudents = students;
  if (filters.classId) {
    displayStudents = students.filter(student => student.classId === parseInt(filters.classId));
  }

  // Then filter by subject if selected (for Faculty view)
  const filteredStudents = filters.subject 
    ? displayStudents.filter(student => student.subjects[filters.subject])
    : displayStudents;

  if (loading) return <Container className="mt-4"><Alert variant="info">Loading student results...</Alert></Container>;
  if (error) return (
    <Container className="mt-4">
      <Alert variant="danger">
        <strong>Error:</strong> {error}
      </Alert>
      <Button variant="secondary" onClick={loadResults}>Retry</Button>
    </Container>
  );

  return (
    <Container fluid className="result-report mt-2 px-4">
      <div className="d-flex justify-content-between align-items-center header-section mb-4">
        <h2>Student Result Report</h2>
        <Button variant="primary" onClick={handlePrint} className="no-print">
          <i className="bi bi-printer me-2"></i>Print Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-3 no-print">
        <Card.Body className="py-2">
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="mb-1">Filter by Class</Form.Label>
                <Form.Select
                  value={filters.classId}
                  onChange={(e) => handleFilterChange('classId', e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {!isHOD && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="mb-1">Filter by Subject</Form.Label>
                  <Form.Select
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {orderedSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            {isHOD && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="mb-1">Filter by Assessment Type</Form.Label>
                  <Form.Select
                    value={filters.assessmentType}
                    onChange={(e) => handleFilterChange('assessmentType', e.target.value)}
                  >
                    <option value="UNIT_TEST_1">Unit Test 1</option>
                    <option value="UNIT_TEST_2">Unit Test 2</option>
                    <option value="SEMESTER_1">Semester 1</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={4}>
              <Button variant="primary" onClick={loadResults}>
                Refresh Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Table */}
      {students.length === 0 ? (
        <Alert variant="warning" className="mt-3">
          No student results available. Please add marks using the "Marks Entry" menu first.
        </Alert>
      ) : isHOD ? (
        // HOD View: All subjects in columns, one assessment type
        <Card>
          <Card.Header className="bg-primary text-white py-2">
            <h5 className="mb-0">
              {filters.assessmentType === 'UNIT_TEST_1' ? 'Unit Test 1' : 
               filters.assessmentType === 'UNIT_TEST_2' ? 'Unit Test 2' : 
               'Semester 1'} - All Subjects
            </h5>
          </Card.Header>
          <Card.Body className="p-2">
            <Table striped bordered hover responsive style={{ fontSize: '1rem' }}>
              <thead className="bg-light">
                <tr style={{ fontSize: '1.1rem' }}>
                  <th className="text-center" style={{ width: '8%', padding: '12px' }}>Roll No</th>
                  <th style={{ width: '25%', padding: '12px' }}>Student Name</th>
                  {orderedSubjects.map(subject => (
                    <th key={subject} className="text-center" style={{ padding: '12px' }}>
                      {subject}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td className="text-center" style={{ padding: '12px', fontSize: '1rem' }}>
                      <strong>{student.rollNumber}</strong>
                    </td>
                    <td style={{ padding: '12px', fontSize: '1rem' }}>{student.name}</td>
                    {orderedSubjects.map(subject => {
                      const marks = student.subjects[subject]?.[filters.assessmentType];
                      return (
                        <td key={subject} className="text-center" style={{ padding: '12px', fontSize: '1rem' }}>
                          <strong>{marks !== null && marks !== undefined ? marks : '-'}</strong>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : !filters.subject ? (
        <Alert variant="info" className="mt-3">
          Please select a subject from the dropdown above to view student results.
        </Alert>
      ) : filteredStudents.length === 0 ? (
        <Alert variant="info" className="mt-3">
          No students found for the selected subject "{filters.subject}".
        </Alert>
      ) : (
        // Faculty View: One subject, all assessment types
        <Card>
          <Card.Header className="bg-primary text-white py-2">
            <h5 className="mb-0">{filters.subject} - Student Results</h5>
          </Card.Header>
          <Card.Body className="p-2">
            <Table striped bordered hover responsive style={{ fontSize: '1rem' }}>
              <thead className="bg-light">
                <tr style={{ fontSize: '1.1rem' }}>
                  <th className="text-center" style={{ width: '10%', padding: '12px' }}>Roll No</th>
                  <th style={{ width: '35%', padding: '12px' }}>Student Name</th>
                  <th className="text-center" style={{ width: '18%', padding: '12px' }}>Unit Test 1</th>
                  <th className="text-center" style={{ width: '18%', padding: '12px' }}>Unit Test 2</th>
                  <th className="text-center" style={{ width: '19%', padding: '12px' }}>Semester 1</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const marks = student.subjects[filters.subject] || {};
                  
                  return (
                    <tr key={student.id}>
                      <td className="text-center" style={{ padding: '12px', fontSize: '1rem' }}>
                        <strong>{student.rollNumber}</strong>
                      </td>
                      <td style={{ padding: '12px', fontSize: '1rem' }}>{student.name}</td>
                      <td className="text-center" style={{ padding: '12px', fontSize: '1rem' }}>
                        <strong>{marks.UNIT_TEST_1 !== null ? marks.UNIT_TEST_1 : '-'}</strong>
                      </td>
                      <td className="text-center" style={{ padding: '12px', fontSize: '1rem' }}>
                        <strong>{marks.UNIT_TEST_2 !== null ? marks.UNIT_TEST_2 : '-'}</strong>
                      </td>
                      <td className="text-center" style={{ padding: '12px', fontSize: '1rem' }}>
                        <strong>{marks.SEMESTER_1 !== null ? marks.SEMESTER_1 : '-'}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default StudentResultReport;
