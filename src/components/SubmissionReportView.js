import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Table, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const SubmissionReportView = () => {
    const { user, hasRole } = useAuth();
    const isHOD = hasRole('ROLE_HOD');
    
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [subjectList, setSubjectList] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [taskList, setTaskList] = useState([]);
    const [selectedTask, setSelectedTask] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isHOD) {
            loadFacultyList();
            loadAllSubjects();
            loadAllTasks(); // Load all tasks for HOD initially
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

    const loadTasks = async (facultyId, subject) => {
        try {
            const params = {};
            if (facultyId) {
                params.facultyId = facultyId;
            }
            if (subject) {
                params.subject = subject;
            }
            
            const response = await api.get('/api/tasks', { params });
            console.log('Tasks loaded:', response.data);
            
            // Deduplicate tasks by title - keep only unique tasks
            const uniqueTasks = [];
            const seenTitles = new Set();
            response.data.forEach(task => {
                if (!seenTitles.has(task.title)) {
                    seenTitles.add(task.title);
                    uniqueTasks.push(task);
                }
            });
            console.log('Unique tasks:', uniqueTasks);
            setTaskList(uniqueTasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const loadAllTasks = async () => {
        try {
            // For HOD, get all tasks initially
            const response = await api.get('/api/tasks');
            console.log('All tasks loaded:', response.data);
            
            // Deduplicate tasks by title
            const uniqueTasks = [];
            const seenTitles = new Set();
            response.data.forEach(task => {
                if (!seenTitles.has(task.title)) {
                    seenTitles.add(task.title);
                    uniqueTasks.push(task);
                }
            });
            console.log('Unique all tasks:', uniqueTasks);
            setTaskList(uniqueTasks);
        } catch (error) {
            console.error('Failed to load all tasks:', error);
        }
    };

    const handleFacultyChange = (e) => {
        const facultyId = e.target.value;
        setSelectedFaculty(facultyId);
        setSelectedSubject('');
        setSelectedTask('');
        if (facultyId) {
            loadSubjects(facultyId);
            setTaskList([]); // Clear tasks until subject is selected
        } else if (isHOD) {
            // If HOD clears faculty selection, load all subjects and tasks again
            loadAllSubjects();
            loadAllTasks();
        }
    };

    const handleSubjectChange = (e) => {
        const subject = e.target.value;
        setSelectedSubject(subject);
        setSelectedTask('');
        if (subject) {
            // Load tasks with facultyId if selected, or all tasks for the subject if HOD with no faculty selected
            loadTasks(selectedFaculty, subject);
        } else {
            // Clear task list if subject is cleared
            setTaskList([]);
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

            if (selectedTask) {
                params.taskId = selectedTask;
            }

            const response = await api.get('/api/reports/submissions/task', { params });
            setReports(response.data);
            
            if (response.data.length === 0) {
                toast.info('No submission records found for the selected criteria');
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

    const getStatusBadge = (status) => {
        if (status === 'COMPLETED') return 'success';
        return 'warning';
    };

    const getTimelinessBadge = (timeliness) => {
        if (timeliness === 'ON_TIME') return 'success';
        if (timeliness === 'LATE') return 'danger';
        return 'secondary';
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
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="mb-0">Task Submission Report</h2>
                        <small className="text-muted">
                            Report Generated On: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
                        </small>
                    </div>
                    {reports.length > 0 && (
                        <Button variant="success" onClick={handlePrint} className="no-print">
                            <i className="bi bi-printer"></i> Print Report
                        </Button>
                    )}
                </div>

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
                                        onChange={handleSubjectChange}
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
                                    <Form.Label>Task (Optional)</Form.Label>
                                    <Form.Select
                                        value={selectedTask}
                                        onChange={(e) => setSelectedTask(e.target.value)}
                                    >
                                        <option value="">All Tasks</option>
                                        {taskList.map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.title}
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
                                    <span><strong>Task:</strong> {report.taskTitle}</span>
                                </div>
                                <div>
                                    <Badge bg="light" text="dark" className="px-3">
                                        Due: {new Date(report.taskDueDate).toLocaleDateString()} | Rate: {report.submissionRate?.toFixed(1)}% | Total: {report.totalStudents}
                                    </Badge>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <h6 className="mb-3">Student-wise Submissions</h6>
                            <Table striped bordered hover responsive size="sm">
                                <thead>
                                    <tr>
                                        <th>Roll No</th>
                                        <th>Student Name</th>
                                        <th>Status</th>
                                        <th>Timeliness</th>
                                        <th>Submitted At</th>
                                        <th>Faculty Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.studentSubmissions?.sort((a, b) => {
                                        const rollA = parseInt(a.rollNumber) || 0;
                                        const rollB = parseInt(b.rollNumber) || 0;
                                        return rollA - rollB;
                                    }).map((submission, i) => (
                                        <tr key={i}>
                                            <td>{submission.rollNumber}</td>
                                            <td>{submission.studentName}</td>
                                            <td>
                                                <Badge bg={getStatusBadge(submission.status)}>
                                                    {submission.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={getTimelinessBadge(submission.timeliness)}>
                                                    {submission.timeliness || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td>
                                                {submission.submittedAt 
                                                    ? new Date(submission.submittedAt).toLocaleString()
                                                    : 'Not submitted'}
                                            </td>
                                            <td>{submission.facultyRemark || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                ))}

                {!loading && reports.length === 0 && (
                    <Alert variant="info" className="text-center">
                        Select filters and click "Generate" to view submission reports
                    </Alert>
                )}
            </Card.Body>
        </Card>
        </>
    );
};

export default SubmissionReportView;
