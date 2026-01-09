import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';

const QuizForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        totalMarks: 0,
        subject: '',
        googleFormLink: '',
        googleFormResponsesLink: ''
    });

    const [useGoogleForm, setUseGoogleForm] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate based on quiz type
            if (useGoogleForm) {
                // For Google Form, validate link and total marks
                if (!formData.googleFormLink || !formData.googleFormLink.trim()) {
                    setError('Please provide a Google Form link');
                    toast.error('Please provide a Google Form link');
                    setLoading(false);
                    return;
                }
                if (!formData.totalMarks || formData.totalMarks <= 0) {
                    setError('Please enter valid total marks');
                    toast.error('Please enter valid total marks');
                    setLoading(false);
                    return;
                }
            } else {
                // For system quiz, validate questions
                if (questions.length === 0) {
                    setError('Please add at least one question');
                    toast.error('Please add at least one question');
                    setLoading(false);
                    return;
                }
            }

            // Calculate total marks from questions if not using Google Form
            const totalMarks = useGoogleForm 
                ? parseInt(formData.totalMarks) || 0 
                : questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

            const quizData = {
                ...formData,
                totalMarks,
                faculty: { id: currentUser.id },
                createdBy: { id: currentUser.id },
                questions: useGoogleForm ? [] : questions.map(q => ({
                    questionText: q.questionText,
                    marks: parseInt(q.marks) || 0,
                    options: q.options.map(opt => ({
                        optionText: opt.optionText,
                        isCorrect: opt.isCorrect
                    }))
                }))
            };

            await quizAPI.create(quizData);
            toast.success('Quiz created successfully!');
            navigate('/quizzes');
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to create quiz';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            questionText: '',
            marks: 1,
            options: [
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false }
            ]
        }]);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    return (
        <Card>
            <Card.Body>
                <h2 className="text-center mb-4">Create New Quiz</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Subject</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Mathematics"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="switch"
                            id="google-form-switch"
                            label="Use Google Form"
                            checked={useGoogleForm}
                            onChange={(e) => setUseGoogleForm(e.target.checked)}
                        />
                        <Form.Text className="text-muted">
                            Toggle this to use a Google Form link instead of creating questions here
                        </Form.Text>
                    </Form.Group>

                    {useGoogleForm && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Google Form Link (For Students)</Form.Label>
                                <Form.Control
                                    type="url"
                                    placeholder="https://forms.gle/..."
                                    value={formData.googleFormLink}
                                    onChange={(e) => setFormData({...formData, googleFormLink: e.target.value})}
                                    required={useGoogleForm}
                                />
                                <Form.Text className="text-muted">
                                    Paste your Google Form link here. Students will be redirected to this form to attempt the quiz.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Google Form Responses Link (For Faculty)</Form.Label>
                                <Form.Control
                                    type="url"
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                    value={formData.googleFormResponsesLink}
                                    onChange={(e) => setFormData({...formData, googleFormResponsesLink: e.target.value})}
                                />
                                <Form.Text className="text-muted">
                                    Optional: Paste the link to view responses (usually the spreadsheet link). Faculty can view who attempted the quiz.
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}

                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Start Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>End Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Total Marks {!useGoogleForm && '(Auto-calculated from questions)'}
                        </Form.Label>
                        <Form.Control
                            type="number"
                            value={useGoogleForm ? formData.totalMarks : questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0)}
                            onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                            disabled={!useGoogleForm}
                            required={useGoogleForm}
                            min="1"
                        />
                        {useGoogleForm && (
                            <Form.Text className="text-muted">
                                Enter the total marks for this Google Form quiz
                            </Form.Text>
                        )}
                    </Form.Group>

                    {!useGoogleForm && questions.map((question, index) => (
                        <Card key={index} className="mb-3">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Question {index + 1}</h5>
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleRemoveQuestion(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Question Text</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={question.questionText}
                                        onChange={(e) => {
                                            const newQuestions = [...questions];
                                            newQuestions[index].questionText = e.target.value;
                                            setQuestions(newQuestions);
                                        }}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Marks</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={question.marks}
                                        onChange={(e) => {
                                            const newQuestions = [...questions];
                                            newQuestions[index].marks = e.target.value;
                                            setQuestions(newQuestions);
                                        }}
                                        required
                                        min="1"
                                    />
                                </Form.Group>

                                <Form.Label>Options</Form.Label>

                                {question.options.map((option, optIndex) => (
                                    <Row key={optIndex} className="mb-2">
                                        <Col md={10}>
                                            <Form.Control
                                                type="text"
                                                placeholder={`Option ${optIndex + 1}`}
                                                value={option.optionText}
                                                onChange={(e) => {
                                                    const newQuestions = [...questions];
                                                    newQuestions[index].options[optIndex].optionText = e.target.value;
                                                    setQuestions(newQuestions);
                                                }}
                                                required
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Check
                                                type="radio"
                                                name={`correct-${index}`}
                                                label="Correct"
                                                checked={option.isCorrect}
                                                onChange={() => {
                                                    const newQuestions = [...questions];
                                                    newQuestions[index].options.forEach((opt, i) => {
                                                        opt.isCorrect = i === optIndex;
                                                    });
                                                    setQuestions(newQuestions);
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                ))}
                            </Card.Body>
                        </Card>
                    ))}

                    {!useGoogleForm && (
                        <Button variant="secondary" className="mb-3" onClick={handleAddQuestion}>
                            Add Question
                        </Button>
                    )}

                    <div className="text-center">
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Quiz'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default QuizForm;