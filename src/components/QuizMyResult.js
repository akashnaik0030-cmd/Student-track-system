import React, { useState, useEffect } from 'react';
import { Card, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';

const QuizMyResult = () => {
    const [attempt, setAttempt] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { quizId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        loadResult();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    const loadResult = async () => {
        setLoading(true);
        setError('');
        try {
            const [attemptResponse, quizResponse] = await Promise.all([
                quizAPI.getMyAttempt(quizId),
                quizAPI.getById(quizId)
            ]);
            setAttempt(attemptResponse.data);
            setQuiz(quizResponse.data);
            
            // Load student's answers
            if (attemptResponse.data?.id) {
                const answersResponse = await quizAPI.getAttemptAnswers(attemptResponse.data.id);
                setAnswers(answersResponse.data);
            }
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to load result';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'info';
        if (percentage >= 60) return 'warning';
        return 'danger';
    };

    const getGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    };

    if (loading) {
        return (
            <Card>
                <Card.Body>
                    <div className="text-center">Loading result...</div>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <Card.Body>
                    <Alert variant="danger">{error}</Alert>
                    <button className="btn btn-secondary" onClick={() => navigate('/quizzes')}>
                        Back to Quizzes
                    </button>
                </Card.Body>
            </Card>
        );
    }

    if (!attempt || !quiz) {
        return (
            <Card>
                <Card.Body>
                    <div className="text-center">Loading...</div>
                </Card.Body>
            </Card>
        );
    }

    const percentage = attempt.percentage || 0;

    return (
        <Card>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Quiz Result</h2>
                    <button className="btn btn-secondary" onClick={() => navigate('/quizzes')}>
                        Back to Quizzes
                    </button>
                </div>

                <Alert variant="success" className="text-center mb-4">
                    <h3 className="mb-3">{quiz.title}</h3>
                    <div className="d-flex justify-content-around align-items-center flex-wrap">
                        <div className="text-center p-3">
                            <h1 className="display-4 mb-2">
                                <Badge bg={getGradeColor(percentage)} className="px-4 py-3">
                                    {getGrade(percentage)}
                                </Badge>
                            </h1>
                            <p className="mb-0">Grade</p>
                        </div>
                        <div className="text-center p-3">
                            <h1 className="display-4 mb-2">{attempt.score}/{attempt.totalMarks}</h1>
                            <p className="mb-0">Score</p>
                        </div>
                        <div className="text-center p-3">
                            <h1 className="display-4 mb-2">{percentage.toFixed(2)}%</h1>
                            <p className="mb-0">Percentage</p>
                        </div>
                    </div>
                </Alert>

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Performance Overview</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Your Score</span>
                                <span><strong>{attempt.score} / {attempt.totalMarks}</strong></span>
                            </div>
                            <ProgressBar 
                                now={percentage} 
                                variant={getGradeColor(percentage)}
                                label={`${percentage.toFixed(1)}%`}
                                style={{ height: '25px' }}
                            />
                        </div>
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Quiz Details</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="row">
                            <div className="col-md-6 mb-2">
                                <strong>Subject:</strong> {quiz.subject || 'N/A'}
                            </div>
                            <div className="col-md-6 mb-2">
                                <strong>Faculty:</strong> {quiz.facultyName || 'N/A'}
                            </div>
                            <div className="col-md-6 mb-2">
                                <strong>Start Time:</strong> {new Date(quiz.startTime).toLocaleString()}
                            </div>
                            <div className="col-md-6 mb-2">
                                <strong>End Time:</strong> {new Date(quiz.endTime).toLocaleString()}
                            </div>
                            <div className="col-md-6 mb-2">
                                <strong>Submitted At:</strong> {new Date(attempt.submittedAt).toLocaleString()}
                            </div>
                            <div className="col-md-6 mb-2">
                                <strong>Status:</strong> <Badge bg="success">{attempt.status}</Badge>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {quiz.description && (
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Quiz Description</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-0">{quiz.description}</p>
                        </Card.Body>
                    </Card>
                )}

                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Your Answers</h5>
                    </Card.Header>
                    <Card.Body>
                        {answers.length === 0 ? (
                            <p className="text-muted">No answers recorded</p>
                        ) : (
                            answers.map((answer, index) => (
                                <Card key={answer.id} className={`mb-3 border-${answer.isCorrect ? 'success' : 'danger'}`}>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0">Question {index + 1}</h6>
                                            <Badge bg={answer.isCorrect ? 'success' : 'danger'}>
                                                {answer.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                            </Badge>
                                        </div>
                                        <p className="mb-3"><strong>{answer.questionText}</strong></p>
                                        
                                        <div className="mb-2">
                                            <small className="text-muted">Your Answer:</small>
                                            <div className={`p-2 rounded ${answer.isCorrect ? 'bg-success bg-opacity-10 border border-success' : 'bg-danger bg-opacity-10 border border-danger'}`}>
                                                {answer.selectedOptionText}
                                            </div>
                                        </div>
                                        
                                        {!answer.isCorrect && (
                                            <div>
                                                <small className="text-muted">Correct Answer:</small>
                                                <div className="p-2 rounded bg-success bg-opacity-10 border border-success">
                                                    {answer.correctOptionText}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                Marks: {answer.isCorrect ? answer.marks : 0} / {answer.marks}
                                            </small>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </Card.Body>
                </Card>
            </Card.Body>
        </Card>
    );
};

export default QuizMyResult;
