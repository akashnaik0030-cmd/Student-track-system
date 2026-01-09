import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const FacultyManagement = () => {
  const { hasRole } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    subject: ''
  });

  useEffect(() => {
    if (hasRole('ROLE_HOD')) {
      loadFaculty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getFaculty();
      setFaculty(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load faculty';
      setError(errorMessage);
      console.error('Error loading faculty:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
      await userAPI.createFaculty(formData);
      toast.success('Faculty created successfully!');
      setShowModal(false);
  setFormData({ username: '', email: '', fullName: '', password: '', subject: '' });
      loadFaculty();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create faculty';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEdit = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setFormData({
      username: facultyMember.username,
      email: facultyMember.email,
      fullName: facultyMember.fullName,
      password: '', // Don't pre-fill password
      subject: facultyMember.subject || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const updateData = {
        email: formData.email,
        fullName: formData.fullName
      };
      if (formData.password) {
        updateData.newPassword = formData.password;
      }
      await userAPI.updateById(selectedFaculty.id, updateData);
      toast.success('Faculty updated successfully!');
      setShowEditModal(false);
      setSelectedFaculty(null);
  setFormData({ username: '', email: '', fullName: '', password: '', subject: '' });
      loadFaculty();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update faculty';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await userAPI.deleteById(selectedFaculty.id);
      toast.success('Faculty deleted successfully!');
      setShowDeleteModal(false);
      setSelectedFaculty(null);
      loadFaculty();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete faculty';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!hasRole('ROLE_HOD')) {
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
            <h2>Faculty Management</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              + Add New Faculty
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No faculty members found
                  </td>
                </tr>
              ) : (
                faculty.map((facultyMember) => (
                  <tr key={facultyMember.id}>
                    <td><strong>{facultyMember.fullName}</strong></td>
                    <td>{facultyMember.username}</td>
                    <td>{facultyMember.email}</td>
                    <td>
                      <Badge bg="primary">Faculty</Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(facultyMember)}
                        className="me-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(facultyMember)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add Faculty Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Faculty</Modal.Title>
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
            <Form.Group className="mb-3">
              <Form.Label>Subject (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                maxLength={100}
                placeholder="e.g. Mathematics"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Faculty
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Faculty</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={selectedFaculty?.username}
                disabled
              />
            </Form.Group>
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
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                maxLength={100}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Faculty
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
          Are you sure you want to delete faculty member <strong>{selectedFaculty?.fullName}</strong> ({selectedFaculty?.username})?
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

export default FacultyManagement;









