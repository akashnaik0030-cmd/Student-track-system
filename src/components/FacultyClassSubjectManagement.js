import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal, Badge, Alert } from 'react-bootstrap';
import { facultyClassSubjectAPI, classAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';
import './FacultyClassSubjectManagement.css';

const FacultyClassSubjectManagement = () => {
    const [assignments, setAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        facultyId: '',
        classId: '',
        subject: ''
    });
    const [selectedClassSubjects, setSelectedClassSubjects] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, classesRes, facultyRes] = await Promise.all([
                facultyClassSubjectAPI.getAll(),
                classAPI.getActive(),
                userAPI.getFaculty()
            ]);
            setAssignments(assignmentsRes.data);
            setClasses(classesRes.data);
            setFaculty(facultyRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = async (classId) => {
        setFormData(prev => ({ ...prev, classId, subject: '' }));
        if (classId) {
            try {
                const selectedClass = classes.find(c => c.id === parseInt(classId));
                if (selectedClass && selectedClass.subjects) {
                    setSelectedClassSubjects(selectedClass.subjects.split(',').map(s => s.trim()));
                } else {
                    setSelectedClassSubjects([]);
                }
            } catch (error) {
                console.error('Error loading class subjects:', error);
                setSelectedClassSubjects([]);
            }
        } else {
            setSelectedClassSubjects([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.facultyId || !formData.classId || !formData.subject) {
            setError('All fields are required');
            return;
        }

        try {
            setLoading(true);
            await facultyClassSubjectAPI.assignFacultyToClass(formData);
            toast.success('Faculty assigned successfully');
            setShowModal(false);
            setFormData({ facultyId: '', classId: '', subject: '' });
            setSelectedClassSubjects([]);
            fetchData();
        } catch (error) {
            console.error('Error assigning faculty:', error);
            const errorMsg = error.response?.data?.error || 'Failed to assign faculty';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (window.confirm('Are you sure you want to remove this assignment?')) {
            try {
                await facultyClassSubjectAPI.removeAssignment(assignmentId);
                toast.success('Assignment removed successfully');
                fetchData();
            } catch (error) {
                console.error('Error removing assignment:', error);
                toast.error('Failed to remove assignment');
            }
        }
    };

    // Group assignments by class
    const groupedAssignments = assignments.reduce((acc, assignment) => {
        const classKey = assignment.classId;
        if (!acc[classKey]) {
            acc[classKey] = {
                className: assignment.className,
                assignments: []
            };
        }
        acc[classKey].assignments.push(assignment);
        return acc;
    }, {});

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2>Faculty-Class-Subject Management</h2>
                    <p className="text-muted">Assign faculty to teach subjects in specific classes</p>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Assign Faculty
                    </Button>
                </Col>
            </Row>

            {loading && <Alert variant="info">Loading...</Alert>}

            {Object.keys(groupedAssignments).length === 0 && !loading ? (
                <Alert variant="info">
                    No faculty assignments yet. Click "Assign Faculty" to create one.
                </Alert>
            ) : (
                Object.values(groupedAssignments).map((group, index) => (
                    <Card key={index} className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">{group.className}</h5>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Faculty Name</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.assignments.map((assignment) => (
                                        <tr key={assignment.id}>
                                            <td>{assignment.facultyName}</td>
                                            <td><Badge bg="primary">{assignment.subject}</Badge></td>
                                            <td>
                                                {assignment.isActive ? (
                                                    <Badge bg="success">Active</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Inactive</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                ))
            )}

            {/* Assignment Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Assign Faculty to Class Subject</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Faculty *</Form.Label>
                            <Form.Select
                                value={formData.facultyId}
                                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                                required
                            >
                                <option value="">Choose faculty...</option>
                                {faculty.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.fullName} {f.subject ? `(${f.subject})` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Select Class *</Form.Label>
                            <Form.Select
                                value={formData.classId}
                                onChange={(e) => handleClassChange(e.target.value)}
                                required
                            >
                                <option value="">Choose class...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.division ? `- ${c.division}` : ''} {c.year ? `(${c.year})` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Select Subject *</Form.Label>
                            {selectedClassSubjects.length > 0 ? (
                                <Form.Select
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                >
                                    <option value="">Choose subject...</option>
                                    {selectedClassSubjects.map((subject, idx) => (
                                        <option key={idx} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </Form.Select>
                            ) : (
                                <>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter subject name"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        {formData.classId ? 'No subjects defined for this class. Enter manually.' : 'Select a class first'}
                                    </Form.Text>
                                </>
                            )}
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Assigning...' : 'Assign Faculty'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default FacultyClassSubjectManagement;
