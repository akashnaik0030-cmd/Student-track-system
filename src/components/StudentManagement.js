import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { userAPI, classAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const StudentManagement = () => {
  const { hasRole } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    rollNumber: '',
    password: '',
    classId: ''
  });

  useEffect(() => {
    if (hasRole('ROLE_FACULTY') || hasRole('ROLE_HOD')) {
      loadStudents();
      loadClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getStudents();
      // Sort by roll number
      const sorted = response.data.sort((a, b) => {
        const rollA = a.rollNumber || '';
        const rollB = b.rollNumber || '';
        return rollA.localeCompare(rollB);
      });
      setStudents(sorted);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load students';
      setError(errorMessage);
      console.error('Error loading students:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classAPI.getActive();
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const studentData = { ...formData };
      if (studentData.classId) {
        studentData.classId = parseInt(studentData.classId);
      }
      await userAPI.createStudent(studentData);
      toast.success('Student created successfully!');
      setShowModal(false);
      setFormData({ username: '', email: '', fullName: '', rollNumber: '', password: '', classId: '' });
      loadStudents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create student';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      username: student.username,
      email: student.email,
      fullName: student.fullName,
      rollNumber: student.rollNumber || '',
      password: '', // Don't pre-fill password
      classId: student.classEntity?.id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const updateData = {
        email: formData.email,
        fullName: formData.fullName,
        rollNumber: formData.rollNumber
      };
      if (formData.classId) {
        updateData.classId = parseInt(formData.classId);
      }
      if (formData.password) {
        updateData.newPassword = formData.password;
      }
      await userAPI.updateById(selectedStudent.id, updateData);
      toast.success('Student updated successfully!');
      setShowEditModal(false);
      setSelectedStudent(null);
      setFormData({ username: '', email: '', fullName: '', rollNumber: '', password: '', classId: '' });
      loadStudents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await userAPI.deleteById(selectedStudent.id);
      toast.success('Student deleted successfully!');
      setShowDeleteModal(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete student';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!hasRole('ROLE_FACULTY') && !hasRole('ROLE_HOD')) {
    return (
      <div className="main-content">
        <Alert variant="danger">You don't have permission to access this page.</Alert>
      </div>
    );
  }

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
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Student Management</h2>
            {hasRole('ROLE_FACULTY') && (
              <Button variant="primary" onClick={() => setShowModal(true)}>
                + Add New Student
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong className="text-primary">
                        {student.rollNumber || 'N/A'}
                      </strong>
                    </td>
                    <td><strong>{student.fullName}</strong></td>
                    <td>{student.username}</td>
                    <td>{student.email}</td>
                    <td>
                      {student.classEntity ? (
                        <Badge bg="info">
                          {student.classEntity.name} {student.classEntity.division ? `- ${student.classEntity.division}` : ''}
                        </Badge>
                      ) : (
                        <span className="text-muted">No Class</span>
                      )}
                    </td>
                    <td>
                      {hasRole('ROLE_FACULTY') && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(student)}
                            className="me-1"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(student)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add Student Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Student</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                minLength={3}
                maxLength={20}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                    placeholder="e.g., CS202301"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Class *</Form.Label>
              <Form.Select
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.division ? `- ${cls.division}` : ''} ({cls.year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                maxLength={50}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                maxLength={40}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Student
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Student</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={selectedStudent?.username}
                disabled
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Class *</Form.Label>
              <Form.Select
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.division ? `- ${cls.division}` : ''} ({cls.year})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                maxLength={50}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password (leave empty to keep current)</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                minLength={6}
                maxLength={40}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Student
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete student <strong>{selectedStudent?.fullName}</strong> ({selectedStudent?.rollNumber || selectedStudent?.username})?
          <br />
          <small className="text-danger">This action cannot be undone.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentManagement;









