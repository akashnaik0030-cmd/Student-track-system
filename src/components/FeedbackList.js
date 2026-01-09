import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { feedbackAPI } from '../services/api';

const FeedbackList = () => {
  const { user, hasRole } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      let response;
      // Students should see feedback given TO them
      if (hasRole('ROLE_STUDENT')) {
        response = await feedbackAPI.getByStudent(user.id);
      } else {
        // Faculty/HOD see feedback they have authored
        response = await feedbackAPI.getMyFeedback();
      }
      setFeedbacks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to load feedback');
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Feedback</h2>
        {hasRole('ROLE_FACULTY') && (
          <Button as={Link} to="/tasks" variant="primary">
            View Tasks to Provide Feedback
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {feedbacks.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <p className="text-muted">No feedback found.</p>
            {hasRole('ROLE_FACULTY') && (
              <Button as={Link} to="/tasks" variant="primary">
                View Tasks to Provide Feedback
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {feedbacks.map((feedback) => (
            <Col md={6} lg={4} key={feedback.id}>
              <Card className="feedback-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title">{feedback.taskTitle || 'Untitled Task'}</h6>
                    <Badge bg="success">Feedback</Badge>
                  </div>
                  <p className="card-text text-muted small">
                    {feedback.content && feedback.content.length > 150
                      ? `${feedback.content.substring(0, 150)}...`
                      : feedback.content}
                  </p>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>From:</strong> {feedback.facultyName || 'Unknown'}
                    </small>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>To:</strong> {feedback.studentName || 'Unknown'}
                    </small>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>Date:</strong> {feedback.createdAt ? formatDate(feedback.createdAt) : 'N/A'}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      as={Link}
                      to={`/feedback/${feedback.id}`}
                      variant="outline-primary"
                      size="sm"
                    >
                      View Details
                    </Button>
                    {feedback.taskId && (
                      <Button
                        as={Link}
                        to={`/submissions/task/${feedback.taskId}`}
                        variant="outline-info"
                        size="sm"
                      >
                        View Submission
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default FeedbackList;