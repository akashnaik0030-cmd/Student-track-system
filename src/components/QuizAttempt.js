import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';

const QuizAttempt = () => {
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(null);

    const { quizId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadQuiz();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    useEffect(() => {
        if (quiz) {
            const timer = setInterval(() => {
                const now = new Date();
                const end = new Date(quiz.endTime);
                const diff = end - now;

                if (diff <= 0) {
                    clearInterval(timer);
                    submitQuiz();
                } else {
                    setTimeLeft(Math.floor(diff / 1000));
                }
            }, 1000);

            return () => clearInterval(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quiz]);

    const loadQuiz = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await quizAPI.getById(quizId);
            const quizData = response.data;
            
            // Check if quiz is available
            const availResponse = await quizAPI.isAvailable(quizId);
            if (!availResponse.data) {
                setError('This quiz is not available at the moment');
                toast.error('Quiz is not available');
                setLoading(false);
                return;
            }

            setQuiz(quizData);
            
            // Initialize time left
            const now = new Date();
            const end = new Date(quizData.endTime);
            const diff = end - now;
            setTimeLeft(Math.floor(diff / 1000));
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to load quiz';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const handleAnswer = (questionId, selectedOptionId) => {
        setAnswers({
            ...answers,
            [questionId]: selectedOptionId
        });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const submitQuiz = async () => {
        setLoading(true);
        setError('');
        try {
            // Format submissions
            const submissions = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                questionId: parseInt(questionId),
                selectedOptionId: parseInt(selectedOptionId)
            }));

            await quizAPI.submit(quizId, currentUser.id, submissions);
            toast.success('Quiz submitted successfully!');
            navigate('/quizzes');
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to submit quiz';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    if (!quiz) {
        return (
            <Card>
                <Card.Body>
                    {error ? (
                        <Alert variant="danger">{error}</Alert>
                    ) : (
                        <div className="text-center">Loading quiz...</div>
                    )}
                </Card.Body>
            </Card>
        );
    }

    // Guard against quizzes without questions (e.g., external Google Form based)
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (questions.length === 0) {
        return (
            <Card>
                <Card.Body>
                    <h2>{quiz.title}</h2>
                    {quiz.googleFormLink ? (
                        <>
                            <Alert variant="info" className="mb-3">
                                This quiz has no configured questions in the app. It may be taken via the linked Google Form.
                            </Alert>
                            <Button variant="primary" onClick={() => window.open(quiz.googleFormLink, '_blank')}>Open Quiz Form</Button>
                        </>
                    ) : (
                        <Alert variant="warning">No questions available for this quiz.</Alert>
                    )}
                </Card.Body>
            </Card>
        );
    }

    // Clamp current question index to valid range
    const clampedIndex = Math.max(0, Math.min(currentQuestion, questions.length - 1));
    const currentQuestionData = questions[clampedIndex];
    const progress = ((clampedIndex + 1) / questions.length) * 100;

    return (
        <Card>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>{quiz.title}</h2>
                    <div className="text-danger">Time Left: {formatTime(timeLeft)}</div>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <ProgressBar now={progress} className="mb-3" />

                <Card className="mb-3">
                    <Card.Body>
                        <h5>Question {clampedIndex + 1} of {questions.length}</h5>
                        <p>{currentQuestionData.questionText}</p>

                        <Form>
                            {(Array.isArray(currentQuestionData.options) ? currentQuestionData.options : []).map(option => (
                                <Form.Check
                                    key={option.id}
                                    type="radio"
                                    id={`option-${option.id}`}
                                    label={option.optionText}
                                    name={`question-${currentQuestionData.id}`}
                                    checked={answers[currentQuestionData.id] === option.id}
                                    onChange={() => handleAnswer(currentQuestionData.id, option.id)}
                                    className="mb-2"
                                />
                            ))}
                        </Form>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-between">
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentQuestion(prev => prev - 1)}
                        disabled={currentQuestion === 0}
                    >
                        Previous
                    </Button>

                    {clampedIndex === questions.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={submitQuiz}
                            disabled={loading}
                        >
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => setCurrentQuestion(prev => Math.min(prev + 1, questions.length - 1))}
                        >
                            Next
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default QuizAttempt;