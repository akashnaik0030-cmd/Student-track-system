import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
import { marksAPI, userAPI } from '../services/api';

const HODMarksView = () => {
    const [allMarks, setAllMarks] = useState([]);
    const [filteredMarks, setFilteredMarks] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [filters, setFilters] = useState({
        facultyId: '',
        assessmentType: '',
        subject: ''
    });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMarks: 0,
        avgMarks: 0,
        studentCount: 0
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, allMarks]);

    const loadData = async () => {
        setLoading(true);
        try {
            console.log('Loading HOD marks data...');
            const [marksRes, facultyRes, typesRes] = await Promise.all([
                marksAPI.getAll(),
                userAPI.getFaculty(),
                api.get('/api/assessment-types/active')
            ]);

            console.log('Marks data loaded:', marksRes.data);
            console.log('Faculty data loaded:', facultyRes.data);
            console.log('Assessment types loaded:', typesRes.data);

            setAllMarks(marksRes.data || []);
            setFacultyList(facultyRes.data || []);
            setAssessmentTypes(typesRes.data || []);

            if (!marksRes.data || marksRes.data.length === 0) {
                toast.info('No marks data found in the system');
            }
        } catch (error) {
            console.error('Error loading HOD marks data:', error);
            console.error('Error details:', error.response);
            const errorMsg = error.response?.data || error.message || 'Failed to load marks data';
            toast.error('Failed to load marks data: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allMarks];

        // Helper to normalize assessment type strings (e.g., "Unit Test 1" vs "UNIT_TEST_1")
        const normalize = (s) => (s || '').toString().replace(/[\s_]+/g, '').toLowerCase();

        if (filters.facultyId) {
            filtered = filtered.filter(m => m.facultyId?.toString() === filters.facultyId);
        }

        if (filters.assessmentType) {
            filtered = filtered.filter(m => normalize(m.assessmentType) === normalize(filters.assessmentType));
        }

        if (filters.subject) {
            filtered = filtered.filter(m => 
                (m.subject || '').toString().toLowerCase().includes(filters.subject.toLowerCase())
            );
        }

        // Sort by student roll number (numeric), then by student name
        filtered.sort((a, b) => {
            const rollA = parseInt(a.studentRollNumber) || 0;
            const rollB = parseInt(b.studentRollNumber) || 0;
            if (rollA !== rollB) return rollA - rollB;
            return (a.studentName || '').localeCompare(b.studentName || '');
        });

        setFilteredMarks(filtered);
        calculateStats(filtered);
    };

    const calculateStats = (marks) => {
        if (marks.length === 0) {
            setStats({ totalMarks: 0, avgMarks: 0, studentCount: 0 });
            return;
        }

        const totalMarks = marks.reduce((sum, m) => sum + (m.marks || 0), 0);
        const uniqueStudents = new Set(marks.map(m => m.studentId)).size;

        setStats({
            totalMarks: marks.length,
            avgMarks: (totalMarks / marks.length).toFixed(2),
            studentCount: uniqueStudents
        });
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            facultyId: '',
            assessmentType: '',
            subject: ''
        });
    };

    const getPercentage = (marks, maxMarks) => {
        if (!maxMarks || maxMarks === 0) return '-';
        const percentage = ((marks / maxMarks) * 100).toFixed(1);
        return `${percentage}%`;
    };

    const getGradeColor = (marks, maxMarks) => {
        if (!maxMarks || maxMarks === 0) return 'secondary';
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'info';
        if (percentage >= 60) return 'warning';
        if (percentage >= 40) return 'danger';
        return 'dark';
    };

    if (loading) {
        return (
            <Container className="mt-4">
                <Alert variant="info">Loading marks data...</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Header>
                    <h4 className="mb-0">HOD Marks Overview</h4>
                </Card.Header>
                <Card.Body>
                    {/* Filters */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Filter by Faculty</Form.Label>
                                <Form.Select
                                    value={filters.facultyId}
                                    onChange={(e) => handleFilterChange('facultyId', e.target.value)}
                                >
                                    <option value="">All Faculty</option>
                                    {facultyList.map(faculty => (
                                        <option key={faculty.id} value={faculty.id}>
                                            {faculty.fullName}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Filter by Assessment Type</Form.Label>
                                <Form.Select
                                    value={filters.assessmentType}
                                    onChange={(e) => handleFilterChange('assessmentType', e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    {assessmentTypes.map(type => (
                                        <option key={type.id} value={type.name}>
                                            {type.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Filter by Subject</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={filters.subject}
                                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                                    placeholder="Enter subject name"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Form.Group>
                                <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                                    Clear Filters
                                </button>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Statistics */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-muted">Total Entries</h5>
                                    <h2>{stats.totalMarks}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-muted">Average Marks</h5>
                                    <h2>{stats.avgMarks}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-muted">Students</h5>
                                    <h2>{stats.studentCount}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Marks Table */}
                    {filteredMarks.length === 0 ? (
                        <Alert variant="info">
                            No marks found matching the current filters. {filters.facultyId || filters.assessmentType || filters.subject ? 'Try adjusting your filters.' : 'No marks have been entered yet.'}
                        </Alert>
                    ) : (
                        <Table responsive striped hover>
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Student</th>
                                    <th>Subject</th>
                                    <th>Assessment Type</th>
                                    <th>Faculty</th>
                                    <th>Marks</th>
                                    <th>Max Marks</th>
                                    <th>Percentage</th>
                                    <th>Date</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMarks.map((mark, index) => (
                                    <tr key={index}>
                                        <td><strong>{mark.studentRollNumber || '-'}</strong></td>
                                        <td><strong>{mark.studentName || 'Unknown'}</strong></td>
                                        <td>{mark.subject || '-'}</td>
                                        <td>
                                            <Badge bg="primary">{mark.assessmentType || '-'}</Badge>
                                        </td>
                                        <td>{mark.facultyName || '-'}</td>
                                        <td>
                                            <Badge bg={getGradeColor(mark.marks, mark.maxMarks)}>
                                                {mark.marks}
                                            </Badge>
                                        </td>
                                        <td>{mark.maxMarks || '-'}</td>
                                        <td>{getPercentage(mark.marks, mark.maxMarks)}</td>
                                        <td>{mark.date ? new Date(mark.date).toLocaleDateString() : '-'}</td>
                                        <td>{mark.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default HODMarksView;
