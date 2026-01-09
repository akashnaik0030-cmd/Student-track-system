import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ROLE_HOD': return 'HOD';
      case 'ROLE_FACULTY': return 'Faculty';
      case 'ROLE_STUDENT': return 'Student';
      default: return role;
    }
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Student Track System
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                
                {/* Input/Create Actions Only in Navbar */}
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Tasks" id="tasks-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/tasks/new">
                      Create New Task
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Notes" id="notes-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/notes/new">
                      Create Note
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Resources" id="resources-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/resources/new">
                      Upload Resource
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Live Classes" id="live-classes-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/live-classes/new">
                      Schedule Live Class
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Quiz" id="quiz-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/quiz/create">
                      Create Quiz
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Marks" id="marks-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/marks/add">
                      Add Marks
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/assessment-types">
                      Manage Assessment Types
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_FACULTY') && (
                  <NavDropdown title="Attendance" id="attendance-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/attendance/mark">
                      Mark Attendance
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {hasRole('ROLE_HOD') && (
                  <NavDropdown title="Management" id="hod-management-dropdown">
                    <NavDropdown.Item as={Link} to="/users">
                      Manage Users
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/faculty">
                      Manage Faculty
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/classes">
                      Manage Classes
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/faculty-class-subjects">
                      Faculty-Class-Subject
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </Nav>
              <Nav>
                <NavDropdown
                  title={`${user.username} (${getRoleDisplayName(user.roles[0])})`}
                  id="basic-nav-dropdown"
                >
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;