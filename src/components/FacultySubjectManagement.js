import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import { facultyClassSubjectAPI, userAPI, classAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const FacultySubjectManagement = () => {
    const { hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState('assign');
    const [faculty, setFaculty] = useState([]);
    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [classSubjects, setClassSubjects] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Form states
    const [assignForm, setAssignForm] = useState({
        facultyId: '',
        classId: '',
        subject: ''
    });
    
    const [subjectForm, setSubjectForm] = useState({
        classId: '',
        subject: ''
    });

    useEffect(() => {
        if (hasRole('ROLE_HOD')) {
            loadData();
        }
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [facultyRes, classesRes, assignmentsRes] = await Promise.all([
                userAPI.getFaculty(),
                classAPI.getActive(),
                facultyClassSubjectAPI.getAll()
            ]);
            
            setFaculty(facultyRes.data);
            setClasses(classesRes.data);
            setAssignments(assignmentsRes.data);
            
            // Load subjects for each class
            const subjectsData = {};
            for (const cls of classesRes.data) {
                try {
                    const subjectsRes = await facultyClassSubjectAPI.getSubjectsByClass(cls.id);
                    subjectsData[cls.id] = subjectsRes.data;
                } catch (error) {
                    subjectsData[cls.id] = [];
                }
            }
            setClassSubjects(subjectsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSubject = async (e) => {
        e.preventDefault();
        try {
            await facultyClassSubjectAPI.assign(assignForm);
            toast.success('Subject assigned to faculty successfully');
            setAssignForm({ facultyId: '', classId: '', subject: '' });
            loadData();
        } catch (error) {
            console.error('Error assigning subject:', error);
            toast.error(error.response?.data?.error || 'Failed to assign subject');
        }
    };

    const handleRemoveAssignment = async (facultyId, classId, subject) => {
        if (window.confirm(`Remove ${subject} assignment?`)) {
            try {
                await facultyClassSubjectAPI.remove(facultyId, classId, subject);
                toast.success('Assignment removed successfully');
                loadData();
            } catch (error) {
                console.error('Error removing assignment:', error);
                toast.error('Failed to remove assignment');
            }
        }
    };

    const handleAddSubjectToClass = async (e) => {
        e.preventDefault();
        try {
            await facultyClassSubjectAPI.addSubjectToClass(subjectForm.classId, subjectForm.subject);
            toast.success('Subject added to class successfully');
            setSubjectForm({ classId: '', subject: '' });
            loadData();
        } catch (error) {
            console.error('Error adding subject:', error);
            toast.error(error.response?.data?.error || 'Failed to add subject');
        }
    };

    const handleRemoveSubjectFromClass = async (classId, subject) => {
        if (window.confirm(`Remove ${subject} from class?`)) {
            try {
                await facultyClassSubjectAPI.removeSubjectFromClass(classId, subject);
                toast.success('Subject removed from class successfully');
                loadData();
            } catch (error) {
                console.error('Error removing subject:', error);
                toast.error('Failed to remove subject');
            }
        }
    };

    if (!hasRole('ROLE_HOD')) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">Access Denied: HOD only</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Faculty & Subject Management</h2>
            
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                {/* Tab 1: Assign Faculty to Subjects */}
                <Tab eventKey="assign" title="Assign Faculty to Subject">
                    <Row>
                        <Col md={5}>
                            <Card>
                                <Card.Header>
                                    <h5>Assign Subject to Faculty</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleAssignSubject}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Faculty *</Form.Label>
                                            <Form.Select
                                                value={assignForm.facultyId}
                                                onChange={(e) => setAssignForm({...assignForm, facultyId: e.target.value})}
                                                required
                                            >
                                                <option value="">Select Faculty</option>
                                                {faculty.map(f => (
                                                    <option key={f.id} value={f.id}>
                                                        {f.fullName} {f.subject && `(${f.subject})`}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Class *</Form.Label>
                                            <Form.Select
                                                value={assignForm.classId}
                                                onChange={(e) => setAssignForm({...assignForm, classId: e.target.value})}
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.name} - {cls.division} ({cls.year})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Subject *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter subject name"
                                                value={assignForm.subject}
                                                onChange={(e) => setAssignForm({...assignForm, subject: e.target.value})}
                                                required
                                            />
                                        </Form.Group>

                                        <Button type="submit" variant="primary" className="w-100">
                                            Assign Subject
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={7}>
                            <Card>
                                <Card.Header>
                                    <h5>Current Assignments</h5>
                                </Card.Header>
                                <Card.Body>
                                    {assignments.length === 0 ? (
                                        <Alert variant="info">No assignments yet</Alert>
                                    ) : (
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Faculty</th>
                                                    <th>Class</th>
                                                    <th>Subject</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignments.map(assignment => (
                                                    <tr key={assignment.id}>
                                                        <td>{assignment.facultyName}</td>
                                                        <td>{assignment.className}</td>
                                                        <td>
                                                            <Badge bg="primary">{assignment.subject}</Badge>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleRemoveAssignment(
                                                                    assignment.facultyId,
                                                                    assignment.classId,
                                                                    assignment.subject
                                                                )}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* Tab 2: Manage Class Subjects */}
                <Tab eventKey="subjects" title="Manage Class Subjects">
                    <Row>
                        <Col md={5}>
                            <Card>
                                <Card.Header>
                                    <h5>Add Subject to Class</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleAddSubjectToClass}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Class *</Form.Label>
                                            <Form.Select
                                                value={subjectForm.classId}
                                                onChange={(e) => setSubjectForm({...subjectForm, classId: e.target.value})}
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.name} - {cls.division} ({cls.year})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Subject *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter subject name"
                                                value={subjectForm.subject}
                                                onChange={(e) => setSubjectForm({...subjectForm, subject: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Example: Mathematics, Physics, Computer Science
                                            </Form.Text>
                                        </Form.Group>

                                        <Button type="submit" variant="primary" className="w-100">
                                            Add Subject
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={7}>
                            <Card>
                                <Card.Header>
                                    <h5>Subjects by Class</h5>
                                </Card.Header>
                                <Card.Body>
                                    {classes.map(cls => (
                                        <Card key={cls.id} className="mb-3">
                                            <Card.Header>
                                                <strong>{cls.name} - {cls.division} ({cls.year})</strong>
                                            </Card.Header>
                                            <Card.Body>
                                                {classSubjects[cls.id] && classSubjects[cls.id].length > 0 ? (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {classSubjects[cls.id].map((subject, idx) => (
                                                            <Badge key={idx} bg="info" className="d-flex align-items-center gap-2">
                                                                {subject}
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="text-white p-0"
                                                                    onClick={() => handleRemoveSubjectFromClass(cls.id, subject)}
                                                                    style={{ textDecoration: 'none', fontSize: '1.2em' }}
                                                                >
                                                                    ×
                                                                </Button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Alert variant="secondary" className="mb-0">
                                                        No subjects added yet
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default FacultySubjectManagement;
