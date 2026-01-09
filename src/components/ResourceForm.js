import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { resourceAPI, classAPI } from '../services/api';
import { toast } from 'react-toastify';

const ResourceForm = ({ onResourceCreated, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'LECTURE_NOTES',
        subject: '',
        url: '',
        isPublic: true,
        classId: ''
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await classAPI.getActive();
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const resourceTypes = [
        { value: 'LECTURE_NOTES', label: 'Lecture Notes' },
        { value: 'VIDEO', label: 'Video' },
        { value: 'PRESENTATION', label: 'Presentation' },
        { value: 'DOCUMENT', label: 'Document' },
        { value: 'LINK', label: 'External Link' },
        { value: 'OTHER', label: 'Other' }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check file size (10MB limit)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                setFile(null);
                e.target.value = '';
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }

        if (!formData.subject.trim()) {
            setError('Subject is required');
            return false;
        }

        if (formData.type === 'LINK') {
            if (!formData.url.trim()) {
                setError('URL is required for link resources');
                return false;
            }
            // Basic URL validation
            try {
                new URL(formData.url);
            } catch {
                setError('Please enter a valid URL');
                return false;
            }
        } else {
            if (!file) {
                setError('Please select a file to upload');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('type', formData.type);
            submitData.append('subject', formData.subject);
            submitData.append('isPublic', formData.isPublic);
            
            if (formData.classId) {
                submitData.append('classId', formData.classId);
            }

            if (formData.type === 'LINK') {
                submitData.append('url', formData.url);
            } else if (file) {
                submitData.append('file', file);
            }

            await resourceAPI.create(submitData);
            
            toast.success('Resource added successfully');
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                type: 'LECTURE_NOTES',
                subject: '',
                url: '',
                isPublic: true,
                classId: ''
            });
            setFile(null);

            if (onResourceCreated) {
                onResourceCreated();
            }
        } catch (error) {
            console.error('Error creating resource:', error);
            setError(error.response?.data?.message || 'Failed to create resource');
            toast.error('Failed to add resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Title *</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter resource title"
                            required
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Subject *</Form.Label>
                        <Form.Control
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="e.g., Mathematics, Physics"
                            required
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Type *</Form.Label>
                        <Form.Select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                        >
                            {resourceTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter resource description (optional)"
                />
            </Form.Group>

            {formData.type === 'LINK' ? (
                <Form.Group className="mb-3">
                    <Form.Label>URL *</Form.Label>
                    <Form.Control
                        type="url"
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        required
                    />
                </Form.Group>
            ) : (
                <Form.Group className="mb-3">
                    <Form.Label>File * (Max 10MB)</Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.mp4,.avi"
                        required
                    />
                    {file && (
                        <Form.Text className="text-muted">
                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </Form.Text>
                    )}
                </Form.Group>
            )}

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Assign to Class (Optional)</Form.Label>
                        <Form.Select
                            name="classId"
                            value={formData.classId}
                            onChange={handleChange}
                        >
                            <option value="">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} {cls.division ? `- ${cls.division}` : ''} {cls.year ? `(${cls.year})` : ''}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Select a specific class or leave as "All Classes"
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="isPublic"
                            label="Make this resource public"
                            checked={formData.isPublic}
                            onChange={handleChange}
                        />
                        <Form.Text className="text-muted">
                            Public resources are visible to all students
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Resource'}
                </Button>
            </div>
        </Form>
    );
};

export default ResourceForm;
