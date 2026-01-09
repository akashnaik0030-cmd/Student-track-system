import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const QuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [attemptStatus, setAttemptStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser, hasRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizzes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadQuizzes = async () => {
        setLoading(true);
        setError('');
        try {
            const response = hasRole('ROLE_FACULTY') 
                ? await quizAPI.getByFaculty(currentUser.id)
                : await quizAPI.getAll();
            const quizData = response.data || [];
            setQuizzes(quizData);
            
            // Check attempt status for students
            if (hasRole('ROLE_STUDENT')) {
                const statusChecks = {};
                for (const quiz of quizData) {
                    try {
                        const attemptResponse = await quizAPI.hasAttempted(quiz.id, currentUser.id);
                        statusChecks[quiz.id] = attemptResponse.data;
                    } catch (err) {
                        statusChecks[quiz.id] = false;
                    }
                }
                setAttemptStatus(statusChecks);
            }
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to load quizzes';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const getQuizStatus = (quiz) => {
        const now = new Date();
        const start = new Date(quiz.startTime);
        const end = new Date(quiz.endTime);

        if (now < start) {
            return <Badge bg="warning">Upcoming</Badge>;
        } else if (now > end) {
            return <Badge bg="secondary">Ended</Badge>;
        } else {
            return <Badge bg="success">Active</Badge>;
        }
    };

    return (
        <Card>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Quizzes</h2>
                    {hasRole('ROLE_FACULTY') && (
                        <Button variant="primary" onClick={() => navigate('/quiz/create')}>
                            Create Quiz
                        </Button>
                    )}
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Total Marks</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quizzes.map(quiz => (
                            <tr key={quiz.id}>
                                <td>{quiz.title}</td>
                                <td>{new Date(quiz.startTime).toLocaleString()}</td>
                                <td>{new Date(quiz.endTime).toLocaleString()}</td>
                                <td>{quiz.totalMarks}</td>
                                <td>{getQuizStatus(quiz)}</td>
                                <td>
                                    {quiz.googleFormLink ? (
                                        <Badge bg="info">Google Form</Badge>
                                    ) : (
                                        <Badge bg="primary">System Quiz</Badge>
                                    )}
                                </td>
                                <td>
                                    {hasRole('ROLE_STUDENT') ? (
                                        quiz.googleFormLink ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => window.open(quiz.googleFormLink, '_blank')}
                                                disabled={new Date() < new Date(quiz.startTime) || new Date() > new Date(quiz.endTime)}
                                            >
                                                Open Form
                                            </Button>
                                        ) : attemptStatus[quiz.id] ? (
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => navigate(`/quiz/${quiz.id}/my-result`)}
                                            >
                                                View Score
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => navigate(`/quiz/${quiz.id}/attempt`)}
                                                disabled={new Date() < new Date(quiz.startTime) || new Date() > new Date(quiz.endTime)}
                                            >
                                                Attempt Quiz
                                            </Button>
                                        )
                                    ) : (
                                        quiz.googleFormLink ? (
                                            <>
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    className="me-1"
                                                    onClick={() => window.open(quiz.googleFormLink, '_blank')}
                                                >
                                                    View Form
                                                </Button>
                                                {quiz.googleFormResponsesLink && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => window.open(quiz.googleFormResponsesLink, '_blank')}
                                                    >
                                                        View Responses
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button
                                                variant="info"
                                                size="sm"
                                                onClick={() => navigate(`/quiz/${quiz.id}/results`)}
                                            >
                                                View Results
                                            </Button>
                                        )
                                    )}
                                </td>
                            </tr>
                        ))}
                        {quizzes.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    {loading ? 'Loading...' : 'No quizzes available'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default QuizList;