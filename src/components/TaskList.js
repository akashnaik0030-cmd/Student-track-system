import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../services/api';
import { toast } from 'react-toastify';

const TaskList = () => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      let response;
      
      // HOD sees all tasks, Faculty sees only tasks they assigned, Students see only tasks assigned to them
      if (hasRole('ROLE_HOD')) {
        response = await taskAPI.getAll();
      } else if (hasRole('ROLE_FACULTY')) {
        // Use aggregated endpoint to avoid duplicate entries per student when same task assigned broadly
        response = await taskAPI.getAggregatedAssignedByMe();
      } else {
        response = await taskAPI.getMyTasks();
      }

      // Handle both JSON string and object responses
      let tasksData = response.data;
      if (typeof tasksData === 'string') {
        tasksData = JSON.parse(tasksData);
      }

      // Normalize status field (handle both string and enum object formats)
      const normalizedTasks = (tasksData || []).map(task => {
        // Aggregated DTO may not have individual status; derive a synthetic status if possible
        if (task.statusCounts && !task.status) {
          // Choose most frequent status as representative
          const entries = Object.entries(task.statusCounts);
          if (entries.length > 0) {
            entries.sort((a,b) => b[1]-a[1]);
            task.status = entries[0][0];
          } else {
            task.status = 'PENDING';
          }
        }
        if (task.status && typeof task.status === 'object') {
          return { ...task, status: task.status.name || task.status };
        }
        return task;
      });

      // Apply status filter client-side for reliability
      const filtered = filter === 'all' ? normalizedTasks : normalizedTasks.filter(t => {
        const status = typeof t.status === 'string' ? t.status : (t.status?.name || t.status);
        return status === filter;
      });
      setTasks(filtered);
      
      // Clear error if we successfully loaded tasks (even if empty)
      if (filtered.length === 0 && normalizedTasks.length === 0) {
        setError(''); // No error, just no tasks
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to load tasks';
      
      if (!error.response) {
        // Network error - server is not reachable
        errorMessage = 'Network Error: Unable to connect to server. Please check if the backend server is running.';
      } else if (error.response.status === 401) {
        errorMessage = 'Unauthorized: Please login again.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server Error: ' + (error.response.data?.message || 'Internal server error');
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      toast.success('Task status updated successfully');
      loadTasks();
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
    return new Date(dateString).toLocaleDateString();
  };

  // Group tasks by faculty for students and HOD
  const groupTasksByFaculty = (tasks) => {
    // For Faculty, show all tasks in one group (they only see their own tasks)
  if (hasRole('ROLE_FACULTY')) return { 'Aggregated Tasks': tasks };
    
    // For Students and HOD, group by faculty
    const grouped = {};
    tasks.forEach(task => {
      // Handle both Task entity (with assignedBy object) and TaskDTO (with assignedById)
      const facultyName = task.assignedBy?.fullName || task.assignedByFullName || 'Unknown Faculty';
      if (!grouped[facultyName]) {
        grouped[facultyName] = [];
      }
      grouped[facultyName].push(task);
    });
    
    // Sort faculty names alphabetically
    const sortedGroups = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGroups[key] = grouped[key];
    });
    
    return sortedGroups;
  };

  // Helper function to get faculty name from task
  const getFacultyName = (task) => {
    return task.assignedBy?.fullName || task.assignedByFullName || 'Unknown';
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

  const groupedTasks = groupTasksByFaculty(tasks);

  return (
    <div className="main-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Tasks</h2>
        {hasRole('ROLE_FACULTY') && (
          <Button as={Link} to="/tasks/new" variant="primary">
            Assign New Task
          </Button>
        )}
      </div>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {!error && (
        tasks.length === 0 ? (
          <Card>
            <Card.Body className="text-center">
              <p className="text-muted">No tasks found.</p>
            </Card.Body>
          </Card>
        ) : (
          <div>
            {Object.entries(groupedTasks).map(([facultyName, facultyTasks], index) => (
              <Card key={facultyName} className="mb-4" style={{ borderLeft: `4px solid ${index % 2 === 0 ? '#007bff' : '#28a745'}` }}>
                <Card.Header style={{ backgroundColor: index % 2 === 0 ? '#e7f3ff' : '#e8f5e9' }}>
                  <h5 className="mb-0">
                    <strong>{hasRole('ROLE_HOD') ? facultyName : `Section ${index + 1}: ${facultyName}`}</strong>
                    <Badge bg="secondary" className="ms-2">{facultyTasks.length} Task{facultyTasks.length !== 1 ? 's' : ''}</Badge>
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-4">
                    {facultyTasks.map((task) => (
                      <Col md={6} lg={4} key={task.id}>
                        <Card className="task-card h-100">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title">{task.title}</h6>
                              {getStatusBadge(typeof task.status === 'string' ? task.status : (task.status?.name || task.status))}
                            </div>
                            {hasRole('ROLE_STUDENT') && (
                              <p className="card-text text-muted small mb-2">
                                <strong>Subject:</strong> {task.subject || 'N/A'}
                              </p>
                            )}
                            <div className="mb-2">
                              <small className="text-muted">
                                <strong>Assigned by:</strong> {getFacultyName(task)}
                              </small>
                            </div>
                            <div className="mb-2">
                              <small className="text-muted">
                                <strong>Due Date:</strong> {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                              </small>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              {hasRole('ROLE_STUDENT') && (
                                <Button
                                  as={Link}
                                  to={`/tasks/${task.id}`}
                                  variant="info"
                                  size="sm"
                                >
                                  View Details
                                </Button>
                              )}
                              {hasRole('ROLE_STUDENT') && (typeof task.status === 'string' ? task.status : (task.status?.name || task.status)) === 'PENDING' && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                >
                                  Start Task
                                </Button>
                              )}
                              {hasRole('ROLE_STUDENT') && (typeof task.status === 'string' ? task.status : (task.status?.name || task.status)) === 'IN_PROGRESS' && (
                                <>
                                  <Button
                                    as={Link}
                                    to={`/submissions/new/${task.id}`}
                                    variant="primary"
                                    size="sm"
                                  >
                                    Submit Task
                                  </Button>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                                  >
                                    Mark Complete
                                  </Button>
                                </>
                              )}
                              {hasRole('ROLE_FACULTY') && (
                                <Button
                                  as={Link}
                                  to={`/tasks/${task.id}`}
                                  variant="outline-primary"
                                  size="sm"
                                >
                                  View Details
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default TaskList;