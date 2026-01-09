import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && id !== 'undefined') {
      loadTask();
    } else {
      setError('Invalid task ID');
      setLoading(false);
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getById(id);
      setTask(response.data);
    } catch (error) {
      setError('Failed to load task details');
      console.error('Error loading task:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus) => {
    try {
      await taskAPI.updateStatus(id, newStatus);
      toast.success('Task status updated successfully');
      loadTask();
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Error updating task status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { variant: 'warning', text: 'Pending' },
      IN_PROGRESS: { variant: 'info', text: 'In Progress' },
      COMPLETED: { variant: 'success', text: 'Completed' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mt-4">
        <Alert variant="warning">Task not found</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const taskStatus = typeof task.status === 'string' ? task.status : (task.status?.name || task.status);

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">{task.title}</h3>
          {getStatusBadge(taskStatus)}
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h5 className="text-muted">Description</h5>
            <p className="lead">{task.description}</p>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Subject:</strong> {task.subject || 'N/A'}
            </div>
            <div className="col-md-6">
              <strong>Due Date:</strong> {formatDate(task.dueDate)}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Assigned By:</strong> {task.assignedBy?.fullName || task.assignedByFullName || 'Unknown'}
            </div>
            <div className="col-md-6">
              <strong>Assigned To:</strong> {task.assignedTo?.fullName || task.assignedToFullName || 'Unknown'}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Created At:</strong> {formatDate(task.createdAt)}
            </div>
            <div className="col-md-6">
              <strong>Status:</strong> {getStatusBadge(taskStatus)}
            </div>
          </div>

          <hr />

          <div className="d-flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>

            {hasRole('ROLE_STUDENT') && taskStatus === 'PENDING' && (
              <Button
                variant="success"
                onClick={() => updateTaskStatus('IN_PROGRESS')}
              >
                Start Task
              </Button>
            )}

            {hasRole('ROLE_STUDENT') && taskStatus === 'IN_PROGRESS' && (
              <>
                <Button
                  as={Link}
                  to={`/submissions/new/${task.id}`}
                  variant="primary"
                >
                  Submit Work
                </Button>
                <Button
                  variant="success"
                  onClick={() => updateTaskStatus('COMPLETED')}
                >
                  Mark as Complete
                </Button>
              </>
            )}

            {hasRole('ROLE_FACULTY') && (
              <Button
                as={Link}
                to={`/submissions?taskId=${task.id}`}
                variant="info"
              >
                View Submissions
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TaskDetail;
