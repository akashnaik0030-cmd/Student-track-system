import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI, submissionAPI, feedbackAPI } from '../services/api';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    mySubmissions: 0,
    myFeedback: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      let tasksResponse, submissionsResponse, feedbackResponse;
      
      if (hasRole('ROLE_HOD')) {
        // HOD sees all tasks and all submissions in the system
        [tasksResponse, submissionsResponse, feedbackResponse] = await Promise.all([
          taskAPI.getAll(),
          submissionAPI.getHODOverview(),
          feedbackAPI.getMyFeedback().catch(() => ({ data: [] })) // HOD may not have feedback
        ]);
      } else if (hasRole('ROLE_FACULTY')) {
        // Faculty sees tasks they assigned and their submissions
        [tasksResponse, submissionsResponse, feedbackResponse] = await Promise.all([
          taskAPI.getAssignedByMe(),
          submissionAPI.getFacultySubmissions(),
          feedbackAPI.getMyFeedback().catch(() => ({ data: [] }))
        ]);
      } else {
        // Students see tasks assigned to them
        [tasksResponse, submissionsResponse, feedbackResponse] = await Promise.all([
          taskAPI.getMyTasks(),
          submissionAPI.getMySubmissions(),
          feedbackAPI.getMyFeedback()
        ]);
      }

      const tasks = tasksResponse.data || [];
      const submissions = submissionsResponse.data || [];
      const feedback = feedbackResponse.data || [];

      setStats({
        totalTasks: tasks.length || 0,
        pendingTasks: tasks.filter(t => t.status === 'PENDING').length || 0,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length || 0,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length || 0,
        mySubmissions: submissions.length || 0,
        myFeedback: feedback.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ROLE_HOD': return 'Head of Department';
      case 'ROLE_FACULTY': return 'Faculty Member';
      case 'ROLE_STUDENT': return 'Student';
      default: return role;
    }
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
      {/* Welcome Header */}
      <div className="dashboard-stats mb-4">
        <h1>Welcome, {user.fullName}!</h1>
        <p className="text-muted">
          {getRoleDisplayName(user.roles[0])} Dashboard
        </p>
      </div>

      {/* Quick Statistics Section */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-4">
          <div className="bg-primary" style={{width: '4px', height: '24px', marginRight: '12px'}}></div>
          <h4 className="mb-0">Quick Statistics</h4>
        </div>
        <Row className="g-4">
          <Col lg={3} md={6}>
            <Card className="dashboard-card h-100 shadow">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-list-task fs-1 text-primary"></i>
                </div>
                <h3 className="text-primary mb-2">{stats.totalTasks}</h3>
                <p className="mb-0 text-muted">Total Tasks</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="dashboard-card h-100 shadow">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-hourglass-split fs-1 text-warning"></i>
                </div>
                <h3 className="text-warning mb-2">{stats.pendingTasks}</h3>
                <p className="mb-0 text-muted">Pending Tasks</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="dashboard-card h-100 shadow">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-arrow-repeat fs-1 text-info"></i>
                </div>
                <h3 className="text-info mb-2">{stats.inProgressTasks}</h3>
                <p className="mb-0 text-muted">In Progress</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="dashboard-card h-100 shadow">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-check-circle fs-1 text-success"></i>
                </div>
                <h3 className="text-success mb-2">{stats.completedTasks}</h3>
                <p className="mb-0 text-muted">Completed Tasks</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Academic Management Section */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-4">
          <div className="bg-primary" style={{width: '4px', height: '24px', marginRight: '12px'}}></div>
          <h4 className="mb-0">📚 Academic Management</h4>
        </div>
        <Row className="g-4">
        <Col lg={3} md={4} sm={6}>
          <Card className="h-100 shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-list-check fs-4 text-primary me-2"></i>
                <h6 className="mb-0">Tasks</h6>
              </div>
              <p className="text-muted small mb-2">
                {stats.totalTasks} total tasks
              </p>
              <Button as={Link} to="/tasks" variant="primary" size="sm" className="w-100">
                View Tasks
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={4} sm={6}>
          <Card className="h-100 shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-file-earmark-text fs-4 text-success me-2"></i>
                <h6 className="mb-0">Submissions</h6>
              </div>
              <p className="text-muted small mb-2">
                {stats.mySubmissions} submissions
              </p>
              <Button 
                as={Link} 
                to={hasRole('ROLE_HOD') ? "/hod-submissions" : "/submissions"} 
                variant="success" 
                size="sm" 
                className="w-100"
              >
                View Submissions
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={4} sm={6}>
          <Card className="h-100 shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-chat-square-text fs-4 text-info me-2"></i>
                <h6 className="mb-0">Notes</h6>
              </div>
              <p className="text-muted small mb-2">
                Shared notes & materials
              </p>
              <Button as={Link} to="/notes" variant="info" size="sm" className="w-100">
                View Notes
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={4} sm={6}>
          <Card className="h-100 shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-folder fs-4 text-warning me-2"></i>
                <h6 className="mb-0">Resources</h6>
              </div>
              <p className="text-muted small mb-2">
                Learning materials
              </p>
              <Button as={Link} to="/resources" variant="warning" size="sm" className="w-100">
                View Resources
              </Button>
            </Card.Body>
          </Card>
        </Col>
        </Row>
      </div>

      {/* Assessment & Communication Section */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-4">
          <div className="bg-success" style={{width: '4px', height: '24px', marginRight: '12px'}}></div>
          <h4 className="mb-0">📊 Assessment & Communication</h4>
        </div>
        <Row className="g-4">
        {(hasRole('ROLE_FACULTY') || hasRole('ROLE_STUDENT')) && (
          <Col lg={3} md={4} sm={6}>
            <Card className="h-100 shadow">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-pencil-square fs-4 text-primary me-2"></i>
                  <h6 className="mb-0">Quizzes</h6>
                </div>
                <p className="text-muted small mb-2">
                  Take or create quizzes
                </p>
                <Button as={Link} to="/quizzes" variant="primary" size="sm" className="w-100">
                  View Quizzes
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}

        {(hasRole('ROLE_FACULTY') || hasRole('ROLE_STUDENT')) && (
          <Col lg={3} md={4} sm={6}>
            <Card className="h-100 shadow">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-graph-up fs-4 text-success me-2"></i>
                  <h6 className="mb-0">Marks</h6>
                </div>
                <p className="text-muted small mb-2">
                  View academic performance
                </p>
                <Button as={Link} to="/marks" variant="success" size="sm" className="w-100">
                  View Marks
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col lg={3} md={4} sm={6}>
          <Card className="h-100 shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-chat-left-dots fs-4 text-info me-2"></i>
                <h6 className="mb-0">Feedback</h6>
              </div>
              <p className="text-muted small mb-2">
                {stats.myFeedback} feedback items
              </p>
              <Button as={Link} to="/feedback" variant="info" size="sm" className="w-100">
                View Feedback
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={4} sm={6}>
          <Card className="h-100 shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-camera-video fs-4 text-danger me-2"></i>
                <h6 className="mb-0">Live Classes</h6>
              </div>
              <p className="text-muted small mb-2">
                Join scheduled sessions
              </p>
              <Button as={Link} to="/live-classes" variant="danger" size="sm" className="w-100">
                View Classes
              </Button>
            </Card.Body>
          </Card>
        </Col>
        </Row>
      </div>

      {/* Attendance Section - Faculty and Student */}
      {(hasRole('ROLE_FACULTY') || hasRole('ROLE_STUDENT')) && (
        <div className="mb-5">
          <div className="d-flex align-items-center mb-4">
            <div className="bg-info" style={{width: '4px', height: '24px', marginRight: '12px'}}></div>
            <h4 className="mb-0">📅 Attendance</h4>
          </div>
          <Row className="g-4">
            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-calendar-check fs-4 text-primary me-2"></i>
                    <h6 className="mb-0">Attendance</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    {hasRole('ROLE_FACULTY') ? 'Mark & view attendance' : 'My attendance records'}
                  </p>
                  <Button as={Link} to="/attendance" variant="primary" size="sm" className="w-100">
                    View Attendance
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {hasRole('ROLE_FACULTY') && (
              <Col lg={3} md={4} sm={6}>
                <Card className="h-100 shadow">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-people fs-4 text-info me-2"></i>
                      <h6 className="mb-0">Students</h6>
                    </div>
                    <p className="text-muted small mb-2">
                      Manage student records
                    </p>
                    <Button as={Link} to="/students" variant="info" size="sm" className="w-100">
                      View Students
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* HOD Management Section */}
      {hasRole('ROLE_HOD') && (
        <div className="mb-5">
          <div className="d-flex align-items-center mb-4">
            <div className="bg-warning" style={{width: '4px', height: '24px', marginRight: '12px'}}></div>
            <h4 className="mb-0">👨‍💼 HOD Management</h4>
          </div>
          <Row className="g-4">
            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-people-fill fs-4 text-primary me-2"></i>
                    <h6 className="mb-0">Users</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Manage all system users
                  </p>
                  <Button as={Link} to="/users" variant="primary" size="sm" className="w-100">
                    Manage Users
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-person-badge fs-4 text-success me-2"></i>
                    <h6 className="mb-0">Faculty</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Faculty management
                  </p>
                  <Button as={Link} to="/faculty" variant="success" size="sm" className="w-100">
                    Manage Faculty
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-building fs-4 text-warning me-2"></i>
                    <h6 className="mb-0">Classes</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Class management
                  </p>
                  <Button as={Link} to="/classes" variant="warning" size="sm" className="w-100">
                    Manage Classes
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-journal-text fs-4 text-info me-2"></i>
                    <h6 className="mb-0">Faculty-Class</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Subject assignments
                  </p>
                  <Button as={Link} to="/faculty-class-subjects" variant="info" size="sm" className="w-100">
                    Assign Subjects
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-file-earmark-check fs-4 text-primary me-2"></i>
                    <h6 className="mb-0">All Submissions</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    System-wide submissions
                  </p>
                  <Button as={Link} to="/hod-submissions" variant="primary" size="sm" className="w-100">
                    View Submissions
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-calendar2-check fs-4 text-success me-2"></i>
                    <h6 className="mb-0">All Attendance</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    System-wide attendance
                  </p>
                  <Button as={Link} to="/hod-attendance" variant="success" size="sm" className="w-100">
                    View Attendance
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Reports Section - Faculty and HOD Only */}
      {(hasRole('ROLE_FACULTY') || hasRole('ROLE_HOD')) && (
        <div className="mb-5">
          <div className="d-flex align-items-center mb-4">
            <div className="bg-danger" style={{width: '4px', height: '24px', marginRight: '12px'}}></div>
            <h4 className="mb-0">📈 Reports & Analytics</h4>
          </div>
          <Row className="g-4">
            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-person-lines-fill fs-4 text-primary me-2"></i>
                    <h6 className="mb-0">Student Report</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Individual student analysis
                  </p>
                  <Button as={Link} to="/reports/student-detailed" variant="primary" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-diagram-3 fs-4 text-success me-2"></i>
                    <h6 className="mb-0">Class Report</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Class-wise performance
                  </p>
                  <Button as={Link} to="/reports/class" variant="success" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-calendar-check fs-4 text-info me-2"></i>
                    <h6 className="mb-0">Attendance Report</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Attendance statistics
                  </p>
                  <Button as={Link} to="/reports/attendance" variant="info" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-award fs-4 text-warning me-2"></i>
                    <h6 className="mb-0">Marks Report</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Academic performance
                  </p>
                  <Button as={Link} to="/reports/marks" variant="warning" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-file-earmark-check fs-4 text-success me-2"></i>
                    <h6 className="mb-0">Submissions Report</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Task submission analysis
                  </p>
                  <Button as={Link} to="/reports/submissions" variant="success" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-list-task fs-4 text-primary me-2"></i>
                    <h6 className="mb-0">Task-wise Report</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Task performance breakdown
                  </p>
                  <Button as={Link} to="/reports/tasks" variant="primary" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={4} sm={6}>
              <Card className="h-100 shadow">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-trophy fs-4 text-danger me-2"></i>
                    <h6 className="mb-0">Student Results</h6>
                  </div>
                  <p className="text-muted small mb-2">
                    Comprehensive results
                  </p>
                  <Button as={Link} to="/reports/student-results" variant="danger" size="sm" className="w-100">
                    View Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {hasRole('ROLE_HOD') && (
              <>
                <Col lg={3} md={4} sm={6}>
                  <Card className="h-100 shadow">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-people fs-4 text-info me-2"></i>
                        <h6 className="mb-0">All Students</h6>
                      </div>
                      <p className="text-muted small mb-2">
                        Complete student data
                      </p>
                      <Button as={Link} to="/reports/student-detailed" variant="info" size="sm" className="w-100">
                        View Report
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={3} md={4} sm={6}>
                  <Card className="h-100 shadow">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-person-workspace fs-4 text-warning me-2"></i>
                        <h6 className="mb-0">All Faculty</h6>
                      </div>
                      <p className="text-muted small mb-2">
                        Faculty performance
                      </p>
                      <Button as={Link} to="/reports/faculty-performance" variant="warning" size="sm" className="w-100">
                        View Report
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </div>
      )}


    </div>
  );
};

export default Dashboard;
