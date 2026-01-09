import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, feedbackAPI } from '../services/api';
import { toast } from 'react-toastify';

const FeedbackForm = () => {
  const { taskId, studentId } = useParams();
  const [formData, setFormData] = useState({
    content: ''
  });
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadTask = async () => {
    try {
      const response = await taskAPI.getById(taskId);
      setTask(response.data);
    } catch (error) {
      setError('Failed to load task details');
      console.error('Error loading task:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await feedbackAPI.create(taskId, studentId, formData);
      toast.success('Feedback provided successfully!');
      navigate('/feedback');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to provide feedback';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!task) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Provide Feedback</h2>
          <div className="mb-4">
            <h5>{task.title}</h5>
            <p className="text-muted">{task.description}</p>
            <small className="text-muted">
              Student: {task.assignedTo.fullName}
            </small>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Feedback Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Provide constructive feedback on the student's work..."
              />
              <Form.Text className="text-muted">
                Be specific and constructive in your feedback to help the student improve.
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Providing Feedback...' : 'Provide Feedback'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tasks')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FeedbackForm;