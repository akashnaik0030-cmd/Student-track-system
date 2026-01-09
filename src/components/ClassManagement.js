import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { classAPI } from '../services/api';

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    division: '',
    year: '',
    department: '',
    academicYear: '',
    isActive: true
  });
  const [nameExists, setNameExists] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classAPI.getAll();
      setClasses(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (classData = null) => {
    if (classData) {
      setEditingClass(classData);
      setFormData({
        name: classData.name,
        division: classData.division || '',
        year: classData.year || '',
        department: classData.department || '',
        academicYear: classData.academicYear || '',
        isActive: classData.isActive
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        division: '',
        year: '',
        department: '',
        academicYear: '',
        isActive: true
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'name') {
      // Debounced existence check
      const newName = value.trim();
      if (newName.length > 0) {
        setCheckingName(true);
        classAPI.checkExists(newName)
          .then(res => setNameExists(!!res?.data?.exists))
          .catch(() => setNameExists(false))
          .finally(() => setCheckingName(false));
      } else {
        setNameExists(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      // Pre-validation: prevent duplicate class names
      try {
        const existsRes = await classAPI.checkExists(formData.name);
        if (existsRes?.data?.exists && !editingClass) {
          setError(`Class with name '${formData.name}' already exists`);
          setLoading(false);
          return;
        }
      } catch (checkErr) {
        console.warn('Name existence check failed (continuing):', checkErr);
      }

    console.log('=== Form submitted ===');
    console.log('Form data:', formData);
    console.log('Is editing:', !!editingClass);
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingClass) {
        console.log('Calling update API for class ID:', editingClass.id);
        const response = await classAPI.update(editingClass.id, formData);
        console.log('Update response:', response);
        setSuccess('Class updated successfully!');
      } else {
        console.log('Calling create API with data:', formData);
        const response = await classAPI.create(formData);
        console.log('Create response:', response);
        console.log('Created class:', response.data);
        setSuccess('Class created successfully!');
      }
      
      console.log('Closing modal and reloading classes...');
      handleCloseModal();
      await loadClasses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('=== Error saving class ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      // Friendly error messages based on status
      let errorMsg = err.response?.data?.error || err.response?.data?.message;
      if (!errorMsg) {
        if (err.response?.status === 400) {
          errorMsg = 'Invalid class data or duplicate name.';
        } else if (err.response?.status === 403) {
          errorMsg = 'You do not have permission. Please login as HOD.';
        } else if (err.response?.status === 500) {
          errorMsg = 'Server error while saving class. Please try again.';
        } else {
          errorMsg = err.message || 'Failed to save class';
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      console.log('=== Form submission completed ===');
    }
  };

  const handleToggleActive = async (classId, currentStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentStatus) {
        await classAPI.deactivate(classId);
        setSuccess('Class deactivated successfully!');
      } else {
        await classAPI.activate(classId);
        setSuccess('Class activated successfully!');
      }
      
      loadClasses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update class status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete class "${className}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await classAPI.delete(classId);
      setSuccess('Class deleted successfully!');
      loadClasses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Class Management</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          Add New Class
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Card>
        <Card.Body>
          {loading && classes.length === 0 ? (
            <div className="text-center py-4">Loading classes...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-4">No classes found. Create your first class!</div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Division</th>
                  <th>Year</th>
                  <th>Department</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(classItem => (
                  <tr key={classItem.id}>
                    <td><strong>{classItem.name}</strong></td>
                    <td>{classItem.division || '-'}</td>
                    <td>{classItem.year || '-'}</td>
                    <td>{classItem.department || '-'}</td>
                    <td>{classItem.academicYear || '-'}</td>
                    <td>
                      <Badge bg={classItem.isActive ? 'success' : 'secondary'}>
                        {classItem.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(classItem)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={classItem.isActive ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="me-2"
                        onClick={() => handleToggleActive(classItem.id, classItem.isActive)}
                      >
                        {classItem.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(classItem.id, classItem.name)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingClass ? 'Edit Class' : 'Add New Class'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Class Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., TE Computer A"
                required
                isInvalid={nameExists}
              />
              {checkingName && <Form.Text className="text-muted">Checking name availability...</Form.Text>}
              {nameExists && <Form.Text className="text-danger">Class name already exists. Please choose a different name.</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Division</Form.Label>
              <Form.Control
                type="text"
                name="division"
                value={formData.division}
                onChange={handleInputChange}
                placeholder="e.g., A, B, C"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
              >
                <option value="">Select Year</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Computer Engineering, IT"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Academic Year</Form.Label>
              <Form.Control
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                placeholder="e.g., 2024-25"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                label="Active"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ClassManagement;
