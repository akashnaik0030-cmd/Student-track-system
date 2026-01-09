import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const AssessmentTypeManager = () => {
    const { user } = useAuth();
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxMarks: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAssessmentTypes();
    }, []);

    const fetchAssessmentTypes = async () => {
        try {
            const response = await api.get('/api/assessment-types/my-types');
            setAssessmentTypes(response.data);
        } catch (error) {
            console.error('Error fetching assessment types:', error);
            toast.error('Failed to load assessment types');
        }
    };

    const handleShowModal = (type = null) => {
        if (type) {
            setEditMode(true);
            setCurrentId(type.id);
            setFormData({
                name: type.name,
                description: type.description || '',
                maxMarks: type.maxMarks || ''
            });
        } else {
            setEditMode(false);
            setCurrentId(null);
            setFormData({
                name: '',
                description: '',
                maxMarks: ''
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            name: '',
            description: '',
            maxMarks: ''
        });
        setErrors({});
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (formData.maxMarks && (formData.maxMarks <= 0 || formData.maxMarks > 1000)) {
            newErrors.maxMarks = 'Max marks must be between 1 and 1000';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                maxMarks: formData.maxMarks ? parseInt(formData.maxMarks) : null
            };

            if (editMode) {
                await api.put(`/api/assessment-types/${currentId}`, payload);
                toast.success('Assessment type updated successfully');
            } else {
                await api.post('/api/assessment-types', payload);
                toast.success('Assessment type created successfully');
            }

            fetchAssessmentTypes();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving assessment type:', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to save assessment type');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this assessment type?')) {
            return;
        }

        try {
            await api.delete(`/api/assessment-types/${id}`);
            toast.success('Assessment type deactivated successfully');
            fetchAssessmentTypes();
        } catch (error) {
            console.error('Error deleting assessment type:', error);
            toast.error('Failed to deactivate assessment type');
        }
    };

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Assessment Type Manager</h4>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        <i className="bi bi-plus-circle"></i> Create New Type
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Alert variant="info">
                        <strong>Note:</strong> Create custom assessment types (e.g., Unit Test 1, Semester Exam, Assignment) 
                        to use when entering marks for students. Once created, these types will appear in the marks entry form.
                    </Alert>

                    {assessmentTypes.length === 0 ? (
                        <Alert variant="warning">
                            No assessment types created yet. Click "Create New Type" to add your first assessment type.
                        </Alert>
                    ) : (
                        <Table responsive striped hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Max Marks</th>
                                    <th>Created At</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assessmentTypes.map((type) => (
                                    <tr key={type.id}>
                                        <td><strong>{type.name}</strong></td>
                                        <td>{type.description || '-'}</td>
                                        <td>{type.maxMarks || '-'}</td>
                                        <td>{new Date(type.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {type.isActive ? (
                                                <Badge bg="success">Active</Badge>
                                            ) : (
                                                <Badge bg="secondary">Inactive</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {type.isActive && (
                                                <>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleShowModal(type)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(type.id)}
                                                    >
                                                        Deactivate
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editMode ? 'Edit' : 'Create'} Assessment Type</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                                placeholder="e.g., Unit Test 1, Semester Exam"
                                maxLength={100}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Optional description"
                                maxLength={255}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Max Marks</Form.Label>
                            <Form.Control
                                type="number"
                                name="maxMarks"
                                value={formData.maxMarks}
                                onChange={handleChange}
                                isInvalid={!!errors.maxMarks}
                                placeholder="Optional (e.g., 100)"
                                min="1"
                                max="1000"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.maxMarks}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Specify the maximum marks for this assessment type (optional)
                            </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AssessmentTypeManager;
