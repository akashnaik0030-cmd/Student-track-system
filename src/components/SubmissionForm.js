import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, submissionAPI } from '../services/api';
import { toast } from 'react-toastify';

const SubmissionForm = () => {
  const { taskId } = useParams();
  const [formData, setFormData] = useState({
    content: ''
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
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
      let taskData = response.data;
      
      // Handle if the response is a nested object
      if (taskData && taskData.data) {
        taskData = taskData.data;
      }
      
      setTask(taskData);
    } catch (error) {
      setError('Failed to load task details');
      console.error('Error loading task:', error);
      toast.error('Failed to load task details');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Please upload a PDF, PPT, PPTX, DOC, or DOCX file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('content', formData.content);
      
      if (file) {
        submitData.append('file', file);
      }

      await submissionAPI.create(taskId, submitData);
      toast.success('Submission created successfully!');
      navigate('/submissions');
    } catch (error) {
      let errorMessage = 'Failed to create submission';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Submission error:', error);
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
          <h2 className="text-center mb-4">Submit Work</h2>
          <div className="mb-4">
            <h5>{task?.title || 'Task Details'}</h5>
            <p className="text-muted">{task?.description || 'No description available'}</p>
            <small className="text-muted">
              Due Date: {task?.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}
            </small>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Submission Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Describe your work, findings, or provide your submission details..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload File (Optional)</Form.Label>
              <p className="text-muted small">
                Supported formats: PDF, PPT, PPTX, DOC, DOCX (Max 10MB)
              </p>
              {!file ? (
                <Form.Control
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                />
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    value={fileName}
                    readOnly
                  />
                  <Button variant="outline-danger" size="sm" onClick={removeFile}>
                    Remove
                  </Button>
                </div>
              )}
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Work'}
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

export default SubmissionForm;
