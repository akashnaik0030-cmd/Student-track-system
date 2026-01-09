import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Table, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const MarksReportView = () => {
    const { user, hasRole } = useAuth();
    const isHOD = hasRole('ROLE_HOD');
    
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [subjectList, setSubjectList] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAssessmentTypes();
        if (isHOD) {
            loadFacultyList();
            loadAllSubjects();
        } else {
            setSelectedFaculty(user.id);
            loadSubjects(user.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHOD, user.id]);

    const loadFacultyList = async () => {
        try {
            const response = await api.get('/api/reports/faculty/list');
            console.log('Faculty list loaded:', response.data);
            setFacultyList(response.data || []);
            if (response.data && response.data.length === 0) {
                toast.info('No faculty found in the system');
            }
        } catch (error) {
            console.error('Error loading faculty list:', error);
            toast.error('Failed to load faculty list: ' + (error.response?.data || error.message));
        }
    };

    const loadSubjects = async (facultyId) => {
        try {
            const response = await api.get(`/api/reports/faculty/${facultyId}/subjects`);
            console.log('Subjects loaded for faculty', facultyId, ':', response.data);
            setSubjectList(response.data || []);
        } catch (error) {
            console.error('Error loading subjects:', error);
            toast.error('Failed to load subjects');
        }
    };

    const loadAllSubjects = async () => {
        try {
            // For HOD, get all subjects from all faculty
            const facultyResponse = await api.get('/api/reports/faculty/list');
            const allFaculty = facultyResponse.data || [];
            
            // Collect subjects from all faculty
            const allSubjectsSet = new Set();
            for (const faculty of allFaculty) {
                try {
                    const subjectsResponse = await api.get(`/api/reports/faculty/${faculty.id}/subjects`);
                    subjectsResponse.data.forEach(subject => allSubjectsSet.add(subject));
                } catch (err) {
                    console.log(`Could not load subjects for faculty ${faculty.id}`);
                }
            }
            
            const subjects = Array.from(allSubjectsSet).sort();
            console.log('All subjects loaded:', subjects);
            setSubjectList(subjects);
        } catch (error) {
            console.error('Error loading all subjects:', error);
        }
    };

    const loadAssessmentTypes = async () => {
        try {
            const response = await api.get('/api/assessment-types/active');
            setAssessmentTypes(response.data);
        } catch (error) {
            console.error('Failed to load assessment types');
        }
    };

    const handleFacultyChange = (e) => {
        const facultyId = e.target.value;
        setSelectedFaculty(facultyId);
        setSelectedSubject('');
        setSelectedAssessment('');
        if (facultyId) {
            loadSubjects(facultyId);
        } else if (isHOD) {
            // If HOD clears faculty selection, load all subjects again
            loadAllSubjects();
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');

        try {
            const params = {};
            
            if (!isHOD || selectedFaculty) {
                params.facultyId = selectedFaculty || user.id;
            }
            
            if (selectedSubject) {
                params.subject = selectedSubject;
            }

            if (selectedAssessment) {
                params.assessmentType = selectedAssessment;
            }

            const response = await api.get('/api/reports/marks/assessment', { params });
            setReports(response.data);
            
            if (response.data.length === 0) {
                toast.info('No marks records found for the selected criteria');
            }
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to generate report';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const getGradeBadge = (grade) => {
        if (grade === 'A+' || grade === 'A') return 'success';
        if (grade === 'B+' || grade === 'B') return 'primary';
        if (grade === 'C') return 'warning';
        return 'danger';
    };

    return (
        <>
        <style>{`
            @media print {
                .no-print, .navbar, .btn, button {
                    display: none !important;
                }
                .card {
                    border: none;
                    box-shadow: none;
                }
                table {
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
            }
        `}</style>
        <Card>
            <Card.Body>
                <Row className="mb-4">
                    <Col>
                        <h2>Assessment Marks Report</h2>
                        <small className="text-muted">
                            Report Generated On: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
                        </small>
                    </Col>
                    <Col xs="auto">
                        <Button variant="success" onClick={handlePrint} className="no-print">
                            <i className="bi bi-printer"></i> Print
                        </Button>
                    </Col>
                </Row>

                {error && <Alert variant="danger">{error}</Alert>}

                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            {isHOD && (
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Faculty</Form.Label>
                                        <Form.Select
                                            value={selectedFaculty}
                                            onChange={handleFacultyChange}
                                        >
                                            <option value="">All Faculty</option>
                                            {facultyList.map(f => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            )}
                            
                            <Col md={isHOD ? 3 : 4}>
                                <Form.Group>
                                    <Form.Label>Subject (Optional)</Form.Label>
                                    <Form.Select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                    >
                                        <option value="">All Subjects</option>
                                        {subjectList.map(subject => (
                                            <option key={subject} value={subject}>
                                                {subject}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            <Col md={isHOD ? 3 : 4}>
                                <Form.Group>
                                    <Form.Label>Assessment Type</Form.Label>
                                    <Form.Select
                                        value={selectedAssessment}
                                        onChange={(e) => setSelectedAssessment(e.target.value)}
                                    >
                                        <option value="">All Assessments</option>
                                        {assessmentTypes.map(at => (
                                            <option key={at.id} value={at.name}>
                                                {at.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            <Col md={isHOD ? 3 : 4} className="d-flex align-items-end">
                                <Button
                                    variant="primary"
                                    onClick={handleGenerateReport}
                                    disabled={loading}
                                    className="w-100"
                                >
                                    {loading ? 'Loading...' : 'Generate'}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {reports.map((report, idx) => (
                    <Card key={idx} className="mb-4">
                        <Card.Header className="bg-primary text-white py-2">
                            <div className="d-flex justify-content-between align-items-center flex-wrap">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <span><strong>Faculty:</strong> {report.facultyName}</span>
                                    <span className="mx-2">|</span>
                                    <span><strong>Subject:</strong> {report.subject}</span>
                                    <span className="mx-2">|</span>
                                    <span><strong>Assessment:</strong> {report.assessmentType}</span>
                                </div>
                                <div>
                                    <Badge bg="light" text="dark" className="px-3">
                                        Max: {report.maxMarks} | Avg: {report.averageMarks?.toFixed(2)} | Students: {report.totalStudents}
                                    </Badge>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <h6 className="mb-3">Student-wise Marks</h6>
                            <Table striped bordered hover responsive size="sm">
                                <thead>
                                    <tr>
                                        <th>Roll No</th>
                                        <th>Student Name</th>
                                        <th>Marks Obtained</th>
                                        <th>Max Marks</th>
                                        <th>Percentage</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.studentMarks?.sort((a, b) => {
                                        const rollA = parseInt(a.rollNumber) || 0;
                                        const rollB = parseInt(b.rollNumber) || 0;
                                        return rollA - rollB;
                                    }).map((student, i) => (
                                        <tr key={i}>
                                            <td>{student.rollNumber}</td>
                                            <td>{student.studentName}</td>
                                            <td>{student.marksObtained}</td>
                                            <td>{student.maxMarks}</td>
                                            <td>{student.percentage?.toFixed(2)}%</td>
                                            <td>
                                                <Badge bg={getGradeBadge(student.grade)}>
                                                    {student.grade}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                ))}

                {!loading && reports.length === 0 && (
                    <Alert variant="info" className="text-center">
                        Select filters and click "Generate" to view marks reports
                    </Alert>
                )}
            </Card.Body>
        </Card>
        </>
    );
};

export default MarksReportView;
