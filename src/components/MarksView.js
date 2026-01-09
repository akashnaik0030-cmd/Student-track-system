import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Alert, Badge, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { marksAPI } from '../services/api';
import { toast } from 'react-toastify';

const MarksView = () => {
    const [marks, setMarks] = useState([]);
    const [filteredMarks, setFilteredMarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        subject: '',
        assessmentType: ''
    });
    const [uniqueSubjects, setUniqueSubjects] = useState([]);
    const [uniqueAssessmentTypes, setUniqueAssessmentTypes] = useState([]);
    const { user, hasRole } = useAuth();

    const loadMarks = async () => {
        if (!user?.id) {
            console.log('User not loaded yet, skipping marks load');
            return;
        }
        setLoading(true);
        setError('');
        try {
            let response;
            if (hasRole('ROLE_FACULTY')) {
                console.log('Fetching marks entered by faculty ID:', user.id);
                response = await marksAPI.getFacultyMarks(user.id);
            } else {
                console.log('Fetching marks for current student from JWT');
                response = await marksAPI.getMyMarks();
            }
            console.log('Marks API response:', response);
            const marksData = Array.isArray(response.data) ? response.data : [];
            console.log('Parsed marks data:', marksData);
            setMarks(marksData);
            
            // Extract unique values for dropdowns
            const subjects = [...new Set(marksData.map(m => m.subject).filter(Boolean))];
            const assessmentTypes = [...new Set(marksData.map(m => m.assessmentType).filter(Boolean))];
            console.log('Unique subjects:', subjects);
            console.log('Unique assessment types:', assessmentTypes);
            setUniqueSubjects(subjects);
            setUniqueAssessmentTypes(assessmentTypes);
            
            if (marksData.length === 0) {
                console.log('No marks found for user ID:', user.id);
            }
        } catch (error) {
            console.error('Error loading marks:', error);
            console.error('Error response:', error.response);
            console.error('User info:', user);
            console.error('Token exists:', !!localStorage.getItem('token'));
            let errorMsg = 'Failed to load marks';
            if (error.response?.status === 401) {
                errorMsg = 'Session expired. Please logout and login again.';
                // Auto-redirect to login after 2 seconds
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }, 2000);
            } else if (error.response?.data) {
                errorMsg = typeof error.response.data === 'string' 
                    ? error.response.data 
                    : error.response.data.message || JSON.stringify(error.response.data);
            } else if (error.message) {
                errorMsg = error.message;
            }
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const applyFilters = useCallback(() => {
        let filtered = [...marks];

        if (filters.subject) {
            filtered = filtered.filter(mark => 
                mark.subject?.toLowerCase().includes(filters.subject.toLowerCase())
            );
        }

        if (filters.assessmentType) {
            filtered = filtered.filter(mark => 
                mark.assessmentType === filters.assessmentType
            );
        }

        // Sort by roll number if available (for faculty view)
        filtered.sort((a, b) => {
            const rollA = parseInt(a.studentRollNumber) || 0;
            const rollB = parseInt(b.studentRollNumber) || 0;
            if (rollA !== rollB) return rollA - rollB;
            // If roll numbers are same or not available, sort by date descending
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        setFilteredMarks(filtered);
    }, [marks, filters.subject, filters.assessmentType]);

    const getGrade = (percentage) => {
        if (percentage >= 90) return { grade: 'A+', variant: 'success' };
        if (percentage >= 80) return { grade: 'A', variant: 'success' };
        if (percentage >= 70) return { grade: 'B', variant: 'info' };
        if (percentage >= 60) return { grade: 'C', variant: 'warning' };
        if (percentage >= 50) return { grade: 'D', variant: 'warning' };
        return { grade: 'F', variant: 'danger' };
    };

    const calculateAverage = () => {
        if (filteredMarks.length === 0) return 0;
        const total = filteredMarks.reduce((sum, mark) => {
            const percentage = (mark.marks / mark.maxMarks) * 100;
            return sum + percentage;
        }, 0);
        return (total / filteredMarks.length).toFixed(2);
    };

    // Load marks on component mount
    useEffect(() => {
        if (user?.id) {
            loadMarks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Apply filters when marks or filter values change
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    return (
        <Card>
            <Card.Body>
                <h2 className="text-center mb-4">My Marks</h2>
                
                {error && (
                    <Alert variant="danger">
                        <Alert.Heading>Error Loading Marks</Alert.Heading>
                        <p>{error}</p>
                        <hr />
                        <div className="d-flex justify-content-between">
                            <small>
                                User ID: {user?.id || 'Not available'} | 
                                Username: {user?.username || 'Not available'}
                            </small>
                            <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                    setError('');
                                    loadMarks();
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    </Alert>
                )}
                
                {!loading && !error && (
                    <Alert variant="info" className="mb-3">
                        <small>
                            <strong>Debug Info:</strong> Logged in as {user?.fullName || user?.username} (ID: {user?.id}) | 
                            Total marks entries: {marks.length} | 
                            Filtered: {filteredMarks.length}
                        </small>
                    </Alert>
                )}

                {/* Filters */}
                <Card className="mb-3">
                    <Card.Body>
                        <h5>Filters</h5>
                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Subject</Form.Label>
                                    <Form.Select
                                        value={filters.subject}
                                        onChange={(e) => setFilters({...filters, subject: e.target.value})}
                                    >
                                        <option value="">All Subjects</option>
                                        {uniqueSubjects.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Assessment Type</Form.Label>
                                    <Form.Select
                                        value={filters.assessmentType}
                                        onChange={(e) => setFilters({...filters, assessmentType: e.target.value})}
                                    >
                                        <option value="">All Types</option>
                                        {uniqueAssessmentTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4} className="d-flex align-items-end">
                                <div>
                                    <h5>Average: {calculateAverage()}%</h5>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading marks data...</p>
                    </div>
                ) : (
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                {hasRole('ROLE_FACULTY') && <th>Roll No</th>}
                                {hasRole('ROLE_FACULTY') && <th>Student</th>}
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Assessment Type</th>
                                <th>Marks Obtained</th>
                                <th>Maximum Marks</th>
                                <th>Percentage</th>
                                <th>Grade</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMarks.map((mark, index) => {
                                const percentage = (mark.marks / mark.maxMarks) * 100;
                                const { grade, variant } = getGrade(percentage);
                                return (
                                    <tr key={index}>
                                        {hasRole('ROLE_FACULTY') && <td><strong>{mark.studentRollNumber || '-'}</strong></td>}
                                        {hasRole('ROLE_FACULTY') && <td><strong>{mark.studentName || 'Unknown'}</strong></td>}
                                        <td>{mark.date ? new Date(mark.date).toLocaleDateString() : 'N/A'}</td>
                                        <td>{mark.subject}</td>
                                        <td>{mark.assessmentType?.replace(/_/g, ' ')}</td>
                                        <td>{mark.marks}</td>
                                        <td>{mark.maxMarks}</td>
                                        <td>{percentage.toFixed(2)}%</td>
                                        <td>
                                            <Badge bg={variant}>{grade}</Badge>
                                        </td>
                                        <td>{mark.remarks || '-'}</td>
                                    </tr>
                                );
                            })}
                            {filteredMarks.length === 0 && (
                                <tr>
                                    <td colSpan={hasRole('ROLE_FACULTY') ? "10" : "8"} className="text-center py-5">
                                        {marks.length === 0 ? (
                                            <div>
                                                <h5 className="text-muted">📊 No Marks Recorded Yet</h5>
                                                <p className="text-muted">
                                                    Your faculty hasn't added any marks for you yet.<br />
                                                    Marks will appear here once your faculty enters them in the system.
                                                </p>
                                                <small className="text-muted">
                                                    Student ID: {user?.id} | Username: {user?.username}
                                                </small>
                                            </div>
                                        ) : (
                                            <div>
                                                <h5 className="text-muted">🔍 No Matches Found</h5>
                                                <p className="text-muted">
                                                    No marks match your selected filters.<br />
                                                    Try changing the subject or assessment type filter.
                                                </p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
};

export default MarksView;
