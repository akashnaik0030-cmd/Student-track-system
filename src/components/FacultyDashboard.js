import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Row, Col, Form, Button, Tab, Tabs, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, feedbackAPI, taskAPI } from '../services/api';
import { toast } from 'react-toastify';

const FacultyDashboard = () => {
    const [attendanceStats, setAttendanceStats] = useState({});
    const [marksStats, setMarksStats] = useState({});
    const [taskStats, setTaskStats] = useState({});
    const [students, setStudents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedTask, setSelectedTask] = useState('');
    const [feedbackContent, setFeedbackContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        loadDashboardData();
        loadStudents();
        loadTasks();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Add API calls to fetch dashboard data
            setAttendanceStats({});
            setMarksStats({});
            setTaskStats({});
        } catch (error) {
            setError('Failed to load dashboard data');
            toast.error('Failed to load dashboard data');
        }
        setLoading(false);
    };

    const loadStudents = async () => {
        try {
            const response = await userAPI.getStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadTasks = async () => {
        try {
            const response = await taskAPI.getAssignedByMe();
            setTasks(response.data || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const handleProvideFeedback = (student) => {
        setSelectedStudent(student);
        setSelectedTask('');
        setFeedbackContent('');
        setShowFeedbackModal(true);
    };

    const handleSubmitFeedback = async () => {
        if (!selectedTask || !feedbackContent.trim()) {
            toast.error('Please select a task and provide feedback content');
            return;
        }

        try {
            setLoading(true);
            await feedbackAPI.create(selectedTask, selectedStudent.id, { content: feedbackContent });
            toast.success('Feedback provided successfully!');
            setShowFeedbackModal(false);
            setSelectedStudent(null);
            setSelectedTask('');
            setFeedbackContent('');
        } catch (error) {
            toast.error(error.response?.data || 'Failed to provide feedback');
        } finally {
            setLoading(false);
        }
    };

    const AttendanceReport = () => (
        <Card className="mb-4">
            <Card.Header>Attendance Statistics</Card.Header>
            <Card.Body>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Present</td>
                            <td>{attendanceStats.present || 0}</td>
                            <td>{attendanceStats.presentPercentage || '0%'}</td>
                        </tr>
                        <tr>
                            <td>Absent</td>
                            <td>{attendanceStats.absent || 0}</td>
                            <td>{attendanceStats.absentPercentage || '0%'}</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    const MarksReport = () => (
        <Card className="mb-4">
            <Card.Header>Academic Performance</Card.Header>
            <Card.Body>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Average Score</th>
                            <th>Highest Score</th>
                            <th>Lowest Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Unit Test 1</td>
                            <td>{marksStats.ut1?.average || '-'}</td>
                            <td>{marksStats.ut1?.highest || '-'}</td>
                            <td>{marksStats.ut1?.lowest || '-'}</td>
                        </tr>
                        <tr>
                            <td>Unit Test 2</td>
                            <td>{marksStats.ut2?.average || '-'}</td>
                            <td>{marksStats.ut2?.highest || '-'}</td>
                            <td>{marksStats.ut2?.lowest || '-'}</td>
                        </tr>
                        <tr>
                            <td>Semester Exam</td>
                            <td>{marksStats.semester?.average || '-'}</td>
                            <td>{marksStats.semester?.highest || '-'}</td>
                            <td>{marksStats.semester?.lowest || '-'}</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    const TaskReport = () => (
        <Card className="mb-4">
            <Card.Header>Task Completion Statistics</Card.Header>
            <Card.Body>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Submitted On Time</td>
                            <td>{taskStats.onTime || 0}</td>
                            <td>{taskStats.onTimePercentage || '0%'}</td>
                        </tr>
                        <tr>
                            <td>Late Submissions</td>
                            <td>{taskStats.late || 0}</td>
                            <td>{taskStats.latePercentage || '0%'}</td>
                        </tr>
                        <tr>
                            <td>Pending</td>
                            <td>{taskStats.pending || 0}</td>
                            <td>{taskStats.pendingPercentage || '0%'}</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    return (
        <div>
            <h2 className="text-center mb-4">Faculty Dashboard</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Tabs defaultActiveKey="attendance" className="mb-3">
                <Tab eventKey="attendance" title="Attendance Report">
                    <AttendanceReport />
                </Tab>
                <Tab eventKey="marks" title="Marks Analysis">
                    <MarksReport />
                </Tab>
                <Tab eventKey="tasks" title="Task Statistics">
                    <TaskReport />
                </Tab>
                <Tab eventKey="feedback" title="Provide Feedback">
                    <Card className="mb-4">
                        <Card.Header>Provide Feedback to Students</Card.Header>
                        <Card.Body>
                            <p className="text-muted">Select a student to provide feedback on their tasks</p>
                            {students.length === 0 ? (
                                <Alert variant="info">No students found</Alert>
                            ) : (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Roll Number</th>
                                            <th>Student Name</th>
                                            <th>Email</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.id}>
                                                <td>{student.rollNumber || 'N/A'}</td>
                                                <td>{student.fullName}</td>
                                                <td>{student.email}</td>
                                                <td>
                                                    <Button 
                                                        variant="primary" 
                                                        size="sm"
                                                        onClick={() => handleProvideFeedback(student)}
                                                    >
                                                        Provide Feedback
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
            
            <h4 className="mt-4 mb-3">Overview & Reports</h4>
            <Row className="g-3">
                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Students</Card.Title>
                            <p className="text-muted mb-1">
                                Total students: <strong>{students.length}</strong>
                            </p>
                            <Button variant="outline-primary" size="sm" className="w-100" href="/students">
                                View All Students
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Tasks</Card.Title>
                            <p className="text-muted mb-1">
                                Tasks assigned: <strong>{tasks.length}</strong>
                            </p>
                            <Button variant="outline-success" size="sm" className="w-100" href="/tasks">
                                View All Tasks
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Attendance</Card.Title>
                            <p className="text-muted mb-1">
                                Attendance records
                            </p>
                            <Button variant="outline-warning" size="sm" className="w-100" href="/attendance">
                                View Attendance
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Submissions</Card.Title>
                            <p className="text-muted mb-1">
                                Student submissions
                            </p>
                            <Button variant="outline-info" size="sm" className="w-100" href="/submissions">
                                View Submissions
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mt-2">
                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Notes</Card.Title>
                            <p className="text-muted mb-1">
                                Shared notes
                            </p>
                            <Button variant="outline-secondary" size="sm" className="w-100" href="/notes">
                                View Notes
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Resources</Card.Title>
                            <p className="text-muted mb-1">
                                Learning materials
                            </p>
                            <Button variant="outline-primary" size="sm" className="w-100" href="/resources">
                                View Resources
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Live Classes</Card.Title>
                            <p className="text-muted mb-1">
                                Scheduled sessions
                            </p>
                            <Button variant="outline-danger" size="sm" className="w-100" href="/live-classes">
                                View Live Classes
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Quizzes</Card.Title>
                            <p className="text-muted mb-1">
                                Available quizzes
                            </p>
                            <Button variant="outline-success" size="sm" className="w-100" href="/quizzes">
                                View Quizzes
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mt-2">
                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Marks</Card.Title>
                            <p className="text-muted mb-1">
                                Student marks
                            </p>
                            <Button variant="outline-info" size="sm" className="w-100" href="/marks">
                                View Marks
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Task Report</Card.Title>
                            <p className="text-muted mb-1">
                                Task analytics
                            </p>
                            <Button variant="outline-warning" size="sm" className="w-100" href="/reports/tasks">
                                View Report
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="h6">Feedback</Card.Title>
                            <p className="text-muted mb-1">
                                Feedback history
                            </p>
                            <Button variant="outline-secondary" size="sm" className="w-100" href="/feedback">
                                View Feedback
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Feedback Modal */}
            <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Provide Feedback to {selectedStudent?.fullName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Task</Form.Label>
                            <Form.Select 
                                value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}
                                required
                            >
                                <option value="">-- Select a Task --</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>
                                        {task.title} - {task.subject || 'No Subject'}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Choose the task you want to provide feedback on
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Feedback Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                value={feedbackContent}
                                onChange={(e) => setFeedbackContent(e.target.value)}
                                placeholder="Provide constructive feedback to help the student improve..."
                                required
                            />
                            <Form.Text className="text-muted">
                                Be specific and constructive in your feedback
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitFeedback}
                        disabled={loading || !selectedTask || !feedbackContent.trim()}
                    >
                        {loading ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FacultyDashboard;