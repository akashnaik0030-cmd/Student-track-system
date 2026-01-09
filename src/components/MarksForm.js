import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { marksAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';
import api from '../services/api';

const MarksForm = () => {
    const [students, setStudents] = useState([]);
    const [myMarks, setMyMarks] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [formData, setFormData] = useState({
        studentId: '',
        subject: '',
        assessmentType: '',
        marks: '',
        maxMarks: '',
        remarks: ''
    });
    const [loading, setLoading] = useState(false);
    // Row-wise entry state for quick add per student
    const [bulkRows, setBulkRows] = useState({}); // { [studentId]: { subject, assessmentType, marks, maxMarks, remarks } }
    const [rowSubmitting, setRowSubmitting] = useState({}); // { [studentId]: boolean }
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [error, setError] = useState('');
    // Global config for bulk entry by assessment type
    const [bulkConfig, setBulkConfig] = useState({ subject: '', assessmentType: '', maxMarks: '' });
    const { currentUser, hasRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (hasRole('ROLE_FACULTY')) {
            loadStudents();
            loadMyMarks();
            loadAssessmentTypes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reload assessment types when window gains focus (e.g., after creating new types)
    useEffect(() => {
        const handleFocus = () => {
            if (hasRole('ROLE_FACULTY')) {
                loadAssessmentTypes();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAssessmentTypes = async () => {
        try {
            const response = await api.get('/api/assessment-types/active');
            setAssessmentTypes(response.data || []);
        } catch (error) {
            console.error('Error loading assessment types:', error);
            toast.error('Failed to load assessment types');
        }
    };

    const loadStudents = async () => {
        try {
            const response = await userAPI.getStudents();
            // Sort by rollNumber numerically if available
            const list = (response.data || []).slice().sort((a, b) => {
                const ra = parseInt(a.rollNumber, 10);
                const rb = parseInt(b.rollNumber, 10);
                if (isNaN(ra) && isNaN(rb)) return (a.fullName || '').localeCompare(b.fullName || '');
                if (isNaN(ra)) return 1;
                if (isNaN(rb)) return -1;
                return ra - rb;
            });
            setStudents(list);
            // Initialize bulk rows for each student (marks-only grid)
            const init = {};
            list.forEach(s => {
                init[s.id] = { marks: '', remarks: '' };
            });
            setBulkRows(init);
        } catch (error) {
            toast.error('Failed to load students');
        }
    };

    const loadMyMarks = async () => {
        try {
            const response = await marksAPI.getFacultyMarks(currentUser.id);
            setMyMarks(response.data || []);
        } catch (error) {
            console.error('Failed to load marks');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const marksData = {
                studentId: parseInt(formData.studentId),
                facultyId: currentUser.id,
                subject: formData.subject,
                assessmentType: formData.assessmentType,
                marks: parseInt(formData.marks),
                maxMarks: parseInt(formData.maxMarks),
                remarks: formData.remarks,
                date: new Date().toISOString().split('T')[0]
            };

            await marksAPI.add(marksData);
            toast.success('Marks added successfully!');
            
            // Reset form
            setFormData({
                studentId: '',
                subject: '',
                assessmentType: '',
                marks: '',
                maxMarks: '',
                remarks: ''
            });
            
            // Reload marks list
            loadMyMarks();
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to add marks';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const handleBulkChange = (studentId, field, value) => {
        setBulkRows(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { subject: '', assessmentType: '', marks: '', maxMarks: '', remarks: '' }),
                [field]: value
            }
        }));
    };

    const validateRow = (row) => {
        const marks = parseInt(row.marks);
        const maxMarks = parseInt(bulkConfig.maxMarks);
        if (isNaN(marks) || isNaN(maxMarks)) return 'Marks and Max Marks must be numbers';
        if (marks < 0 || maxMarks <= 0) return 'Marks must be >= 0 and Max Marks > 0';
        if (marks > maxMarks) return 'Marks cannot exceed Max Marks';
        return '';
    };

    const validateBulkConfig = () => {
        if (!bulkConfig.subject?.trim()) return 'Subject is required';
        if (!bulkConfig.assessmentType) return 'Assessment Type is required';
        const maxMarks = parseInt(bulkConfig.maxMarks);
        if (isNaN(maxMarks) || maxMarks <= 0) return 'Max Marks must be a number > 0';
        return '';
    };

    const handleBulkSubmit = async (studentId) => {
        const row = bulkRows[studentId] || {};
        const validationError = validateRow(row);
        if (validationError) {
            toast.error(validationError);
            return;
        }
        try {
            setRowSubmitting(prev => ({ ...prev, [studentId]: true }));
            const payload = {
                studentId: studentId,
                facultyId: currentUser.id,
                subject: row.subject,
                assessmentType: row.assessmentType,
                marks: parseInt(row.marks),
                maxMarks: parseInt(row.maxMarks),
                remarks: row.remarks || '',
                date: new Date().toISOString().split('T')[0]
            };
            await marksAPI.add(payload);
            toast.success('Marks added');
            // Clear row fields after success
            setBulkRows(prev => ({
                ...prev,
                [studentId]: { subject: '', assessmentType: '', marks: '', maxMarks: '', remarks: '' }
            }));
            loadMyMarks();
        } catch (err) {
            const errorMsg = err.response?.data || 'Failed to add marks';
            toast.error(errorMsg);
        } finally {
            setRowSubmitting(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleSaveAll = async () => {
        // Validate global config first
        const cfgError = validateBulkConfig();
        if (cfgError) {
            toast.error(cfgError);
            return;
        }

        // Collect all filled rows with validation (marks-only entries)
        const entries = [];
        const invalidRows = [];

        students.forEach(stu => {
            const row = bulkRows[stu.id] || {};
            if (row.marks !== '' && row.marks != null) {
                const validationError = validateRow(row);
                if (validationError) {
                    invalidRows.push(`${stu.fullName}: ${validationError}`);
                } else {
                    entries.push({
                        studentId: stu.id,
                        subject: bulkConfig.subject,
                        assessmentType: bulkConfig.assessmentType,
                        marks: parseInt(row.marks),
                        maxMarks: parseInt(bulkConfig.maxMarks),
                        remarks: row.remarks || '',
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
        });

        if (invalidRows.length > 0) {
            toast.error('Please fix validation errors before saving');
            return;
        }

        if (entries.length === 0) {
            toast.warning('No entries to save. Enter marks for at least one student.');
            return;
        }

        setBulkSubmitting(true);
        try {
            const response = await marksAPI.addBulk(entries);
            const { savedCount, failedCount, errors } = response.data;

            if (savedCount > 0) {
                toast.success(`Successfully saved ${savedCount} marks entries!`);
                // Clear successfully saved rows (all if no errors, otherwise keep failed)
                if (failedCount === 0) {
                    const cleared = {};
                    students.forEach(s => {
                        cleared[s.id] = { marks: '', remarks: '' };
                    });
                    setBulkRows(cleared);
                }
            }

            if (failedCount > 0) {
                toast.error(`Failed to save ${failedCount} entries. Check details.`);
                if (errors && errors.length > 0) {
                    console.error('Bulk save errors:', errors);
                }
            }

            loadMyMarks();
        } catch (err) {
            const errorMsg = err.response?.data || 'Failed to save bulk marks';
            toast.error(errorMsg);
        } finally {
            setBulkSubmitting(false);
        }
    };

    return (
        <Card>
            <Card.Body>
                <h2 className="text-center mb-4">Add Student Marks</h2>
                {error && <Alert variant="danger">{error}</Alert>}

                {hasRole('ROLE_FACULTY') && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="mb-0">Bulk Entry by Assessment Type</h4>
                            <Button 
                                variant="success" 
                                onClick={handleSaveAll}
                                disabled={bulkSubmitting}
                            >
                                {bulkSubmitting ? 'Saving All...' : 'Save All'}
                            </Button>
                        </div>

                        {/* Global bulk config controls */}
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Subject</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bulkConfig.subject}
                                        onChange={(e) => setBulkConfig(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Enter subject"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Assessment Type</span>
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            onClick={loadAssessmentTypes}
                                            style={{padding: '0', fontSize: '0.85rem'}}
                                            title="Refresh assessment types"
                                        >
                                            🔄 Refresh
                                        </Button>
                                    </Form.Label>
                                    <Form.Select
                                        value={bulkConfig.assessmentType}
                                        onChange={(e) => {
                                            const selectedType = assessmentTypes.find(t => t.name === e.target.value);
                                            setBulkConfig(prev => ({ 
                                                ...prev, 
                                                assessmentType: e.target.value,
                                                maxMarks: selectedType?.maxMarks || prev.maxMarks 
                                            }));
                                        }}
                                    >
                                        <option value="">Select Type</option>
                                        {assessmentTypes.map(type => (
                                            <option key={type.id} value={type.name}>
                                                {type.name} {type.maxMarks ? `(Max: ${type.maxMarks})` : ''}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    {assessmentTypes.length === 0 && (
                                        <Form.Text className="text-danger">
                                            No assessment types available. Please create one first.
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Maximum Marks</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={bulkConfig.maxMarks}
                                        onChange={(e) => setBulkConfig(prev => ({ ...prev, maxMarks: e.target.value }))}
                                        placeholder="e.g. 100"
                                    />
                                    <Form.Text className="text-muted">
                                        Auto-filled if assessment type has max marks
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Table striped bordered hover responsive className="mb-4">
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Student</th>
                                    <th>Marks Obtained</th>
                                    <th>Total Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(students || []).map(stu => {
                                    const row = bulkRows[stu.id] || { marks: '', remarks: '' };
                                    return (
                                        <tr key={stu.id}>
                                            <td>{stu.rollNumber || '-'}</td>
                                            <td>{stu.fullName}</td>
                                            <td style={{maxWidth: 140}}>
                                                <Form.Control 
                                                    size="sm" type="number" min="0"
                                                    value={row.marks}
                                                    onChange={(e) => handleBulkChange(stu.id, 'marks', e.target.value)}
                                                    placeholder="Enter marks"
                                                />
                                            </td>
                                            <td style={{maxWidth: 140}}>
                                                <Form.Control 
                                                    size="sm" 
                                                    type="number" 
                                                    value={bulkConfig.maxMarks}
                                                    readOnly
                                                    disabled
                                                    style={{backgroundColor: '#e9ecef'}}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center">No students found</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {myMarks.length > 0 && (
                            <>
                                <h4 className="mb-3">Recent Marks Entries</h4>
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Subject</th>
                                            <th>Type</th>
                                            <th>Marks</th>
                                            <th>Max Marks</th>
                                            <th>Percentage</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myMarks.slice(0, 10).map((mark, index) => (
                                            <tr key={index}>
                                                <td>{mark.studentName || 'N/A'}</td>
                                                <td>{mark.subject}</td>
                                                <td>{mark.assessmentType?.replace(/_/g, ' ')}</td>
                                                <td>{mark.marks}</td>
                                                <td>{mark.maxMarks}</td>
                                                <td>{((mark.marks / mark.maxMarks) * 100).toFixed(2)}%</td>
                                                <td>{mark.date ? new Date(mark.date).toLocaleDateString() : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default MarksForm;