import React, { useState, useEffect } from 'react';
import { Card, Alert, Badge, ListGroup, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { toast } from 'react-toastify';

const QuizResults = () => {
    const [quiz, setQuiz] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [showAttempts, setShowAttempts] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { quizId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizAndAttempts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    const loadQuizAndAttempts = async () => {
        setLoading(true);
        setError('');
        try {
            const [quizResponse, studentsResponse] = await Promise.all([
                quizAPI.getById(quizId),
                quizAPI.getAllStudentsStatus(quizId)
            ]);
            setQuiz(quizResponse.data);
            setAllStudents(studentsResponse.data || []);
        } catch (error) {
            const errorMsg = error.response?.data || 'Failed to load quiz';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setLoading(false);
    };

    const exportToExcel = () => {
        try {
            // Create worksheet data
            const worksheetData = [
                ['Quiz Title:', quiz.title],
                ['Subject:', quiz.subject || 'N/A'],
                ['Faculty:', quiz.facultyName || 'N/A'],
                ['Total Marks:', quiz.totalMarks],
                ['Start Time:', new Date(quiz.startTime).toLocaleString()],
                ['End Time:', new Date(quiz.endTime).toLocaleString()],
                [],
                ['Roll Number', 'Student Name', 'Status', 'Score', 'Percentage', 'Grade', 'Submitted At']
            ];

            // Add student data
            allStudents.forEach(student => {
                const percentage = student.percentage || 0;
                const grade = percentage >= 90 ? 'A+' : 
                             percentage >= 80 ? 'A' : 
                             percentage >= 70 ? 'B' : 
                             percentage >= 60 ? 'C' : 
                             percentage >= 50 ? 'D' : 'F';
                
                worksheetData.push([
                    student.rollNumber || 'N/A',
                    student.studentName,
                    student.hasAttempted ? 'Attempted' : 'Not Attempted',
                    student.hasAttempted ? `${student.score}/${student.totalMarks}` : `-/${student.totalMarks}`,
                    student.hasAttempted ? `${percentage.toFixed(2)}%` : '-',
                    student.hasAttempted ? grade : '-',
                    student.hasAttempted && student.submittedAt ? new Date(student.submittedAt).toLocaleString() : '-'
                ]);
            });

            // Create CSV content
            const csvContent = worksheetData.map(row => 
                row.map(cell => {
                    // Escape cells containing commas or quotes
                    const cellStr = String(cell);
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                }).join(',')
            ).join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_Results.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Excel file downloaded successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export data');
        }
    };

    if (loading) {
        return (
            <Card>
                <Card.Body>
                    <div className="text-center">Loading quiz...</div>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <Card.Body>
                    <Alert variant="danger">{error}</Alert>
                </Card.Body>
            </Card>
        );
    }

    if (!quiz) {
        return (
            <Card>
                <Card.Body>
                    <div className="text-center">Loading...</div>
                </Card.Body>
            </Card>
        );
    }

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

    return (
        <Card>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>{quiz.title}</h2>
                    <button className="btn btn-secondary" onClick={() => navigate('/quizzes')}>
                        Back to Quizzes
                    </button>
                </div>

                {quiz.description && (
                    <Alert variant="info" className="mb-4">
                        <strong>Description:</strong> {quiz.description}
                    </Alert>
                )}

                <div className="mb-4">
                    <p><strong>Subject:</strong> {quiz.subject || 'N/A'}</p>
                    <p><strong>Start Time:</strong> {new Date(quiz.startTime).toLocaleString()}</p>
                    <p><strong>End Time:</strong> {new Date(quiz.endTime).toLocaleString()}</p>
                    <p><strong>Total Marks:</strong> {quiz.totalMarks}</p>
                    <p><strong>Faculty:</strong> {quiz.facultyName || 'N/A'}</p>
                </div>

                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn ${showAttempts ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowAttempts(true)}
                        >
                            All Students ({allStudents.length})
                        </button>
                        <button
                            type="button"
                            className={`btn ${!showAttempts ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowAttempts(false)}
                        >
                            Questions ({questions.length})
                        </button>
                    </div>
                    {showAttempts && !quiz.googleFormLink && allStudents.length > 0 && (
                        <Button variant="success" onClick={exportToExcel}>
                            <i className="bi bi-download"></i> Download Excel
                        </Button>
                    )}
                </div>

                {quiz.googleFormLink ? (
                    <Alert variant="info">
                        <strong>External Quiz:</strong> This quiz uses a Google Form.
                        <br />
                        <div className="mt-2">
                            <a href={quiz.googleFormLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm me-2">
                                Open Google Form (Students)
                            </a>
                            {quiz.googleFormResponsesLink && (
                                <a href={quiz.googleFormResponsesLink} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                                    View Responses (Faculty)
                                </a>
                            )}
                        </div>
                        {!quiz.googleFormResponsesLink && (
                            <div className="mt-2">
                                <small className="text-muted">Note: No responses link configured. Add it while editing the quiz.</small>
                            </div>
                        )}
                    </Alert>
                ) : showAttempts ? (
                    <>
                        <h4 className="mb-3">All Students Status</h4>
                        {allStudents.length === 0 ? (
                            <Alert variant="info">No students found.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-bordered">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Roll Number</th>
                                            <th>Student Name</th>
                                            <th>Status</th>
                                            <th>Score</th>
                                            <th>Percentage</th>
                                            <th>Grade</th>
                                            <th>Submitted At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allStudents.map(student => {
                                            const percentage = student.percentage || 0;
                                            const grade = percentage >= 90 ? 'A+' : 
                                                         percentage >= 80 ? 'A' : 
                                                         percentage >= 70 ? 'B' : 
                                                         percentage >= 60 ? 'C' : 
                                                         percentage >= 50 ? 'D' : 'F';
                                            const gradeColor = percentage >= 90 ? 'success' : 
                                                             percentage >= 75 ? 'info' : 
                                                             percentage >= 60 ? 'warning' : 'danger';
                                            
                                            return (
                                                <tr key={student.studentId}>
                                                    <td>{student.rollNumber || 'N/A'}</td>
                                                    <td>{student.studentName}</td>
                                                    <td>
                                                        {student.hasAttempted ? (
                                                            <Badge bg="success">Attempted</Badge>
                                                        ) : (
                                                            <Badge bg="secondary">Not Attempted</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {student.hasAttempted ? (
                                                            <strong>{student.score} / {student.totalMarks}</strong>
                                                        ) : (
                                                            <span className="text-muted">- / {student.totalMarks}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {student.hasAttempted ? (
                                                            `${percentage.toFixed(2)}%`
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {student.hasAttempted ? (
                                                            <Badge bg={gradeColor}>{grade}</Badge>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {student.hasAttempted && student.submittedAt ? (
                                                            new Date(student.submittedAt).toLocaleString()
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : questions.length === 0 ? (
                    <Alert variant="warning">No questions configured for this quiz.</Alert>
                ) : (
                    <>
                        <h4 className="mb-3">Questions ({questions.length})</h4>
                        {questions.map((question, index) => {
                            const correctOption = question.options?.find(opt => opt.id === question.correctOptionId);
                            
                            return (
                                <Card key={question.id} className="mb-3">
                                    <Card.Header>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <strong>Question {index + 1}</strong>
                                            <Badge bg="primary">{question.marks} marks</Badge>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-3"><strong>{question.questionText}</strong></p>
                                        
                                        <h6>Options:</h6>
                                        <ListGroup variant="flush">
                                            {(question.options || []).map(option => (
                                                <ListGroup.Item 
                                                    key={option.id}
                                                    className={option.id === question.correctOptionId ? 'bg-success bg-opacity-10 border-success' : ''}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span>{option.optionText}</span>
                                                        {option.id === question.correctOptionId && (
                                                            <Badge bg="success">Correct Answer</Badge>
                                                        )}
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                        
                                        {correctOption && (
                                            <div className="mt-2">
                                                <small className="text-success">
                                                    <strong>Correct Answer:</strong> {correctOption.optionText}
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default QuizResults;
