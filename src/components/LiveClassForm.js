import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { liveClassAPI, classAPI } from '../services/api';
import { toast } from 'react-toastify';

const LiveClassForm = ({ liveClass, onClassCreated, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        scheduledAt: '',
        durationMinutes: 60,
        platform: 'ZOOM',
        meetingUrl: '',
        meetingId: '',
        meetingPassword: '',
        classId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [classes, setClasses] = useState([]);

    const platforms = [
        { value: 'ZOOM', label: 'Zoom' },
        { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams' },
        { value: 'GOOGLE_MEET', label: 'Google Meet' },
        { value: 'OTHER', label: 'Other' }
    ];

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await classAPI.getActive();
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load classes');
        }
    };

    useEffect(() => {
        if (liveClass) {
            // Format datetime for input field
            const scheduledDate = new Date(liveClass.scheduledAt);
            const formattedDate = scheduledDate.toISOString().slice(0, 16);
            
            setFormData({
                title: liveClass.title || '',
                description: liveClass.description || '',
                subject: liveClass.subject || '',
                scheduledAt: formattedDate,
                durationMinutes: liveClass.durationMinutes || 60,
                platform: liveClass.platform || 'ZOOM',
                meetingUrl: liveClass.meetingUrl || '',
                meetingId: liveClass.meetingId || '',
                meetingPassword: liveClass.meetingPassword || '',
                classId: liveClass.classEntity?.id || ''
            });
        }
    }, [liveClass]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
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

        if (!formData.scheduledAt) {
            setError('Scheduled date and time is required');
            return false;
        }

        // Check if scheduled time is in the future
        const scheduledDate = new Date(formData.scheduledAt);
        const now = new Date();
        if (scheduledDate <= now) {
            setError('Scheduled time must be in the future');
            return false;
        }

        if (!formData.meetingUrl.trim()) {
            setError('Meeting URL is required');
            return false;
        }

        // Basic URL validation
        try {
            new URL(formData.meetingUrl);
        } catch {
            setError('Please enter a valid meeting URL');
            return false;
        }

        if (formData.durationMinutes < 15 || formData.durationMinutes > 480) {
            setError('Duration must be between 15 and 480 minutes');
            return false;
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

            const submitData = {
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                scheduledAt: formData.scheduledAt,
                durationMinutes: parseInt(formData.durationMinutes),
                platform: formData.platform,
                meetingUrl: formData.meetingUrl,
                meetingId: formData.meetingId,
                meetingPassword: formData.meetingPassword
            };

            if (formData.classId) {
                submitData.classId = parseInt(formData.classId);
            }

            if (liveClass) {
                // Update existing live class
                await liveClassAPI.update(liveClass.id, submitData);
                toast.success('Live class updated successfully');
            } else {
                // Create new live class
                await liveClassAPI.create(submitData);
                toast.success('Live class scheduled successfully');
            }

            // Reset form
            setFormData({
                title: '',
                description: '',
                subject: '',
                scheduledAt: '',
                durationMinutes: 60,
                platform: 'ZOOM',
                meetingUrl: '',
                meetingId: '',
                meetingPassword: '',
                classId: ''
            });

            if (onClassCreated) {
                onClassCreated();
            }
        } catch (error) {
            console.error('Error saving live class:', error);
            setError(error.response?.data?.message || 'Failed to save live class');
            toast.error('Failed to save live class');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum datetime (current time)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15); // Minimum 15 minutes from now
        return now.toISOString().slice(0, 16);
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
                            placeholder="Enter class title"
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
                        <Form.Label>Platform *</Form.Label>
                        <Form.Select
                            name="platform"
                            value={formData.platform}
                            onChange={handleChange}
                            required
                        >
                            {platforms.map(platform => (
                                <option key={platform.value} value={platform.value}>
                                    {platform.label}
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
                    placeholder="Enter class description (optional)"
                />
            </Form.Group>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Scheduled Date & Time *</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            name="scheduledAt"
                            value={formData.scheduledAt}
                            onChange={handleChange}
                            min={getMinDateTime()}
                            required
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Duration (minutes) *</Form.Label>
                        <Form.Control
                            type="number"
                            name="durationMinutes"
                            value={formData.durationMinutes}
                            onChange={handleChange}
                            min="15"
                            max="480"
                            step="15"
                            required
                        />
                        <Form.Text className="text-muted">
                            15-480 minutes (8 hours max)
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mb-3">
                <Form.Label>Meeting URL *</Form.Label>
                <Form.Control
                    type="url"
                    name="meetingUrl"
                    value={formData.meetingUrl}
                    onChange={handleChange}
                    placeholder="https://zoom.us/j/123456789 or Teams meeting link"
                    required
                />
            </Form.Group>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Meeting ID (Optional)</Form.Label>
                        <Form.Control
                            type="text"
                            name="meetingId"
                            value={formData.meetingId}
                            onChange={handleChange}
                            placeholder="e.g., 123 456 789"
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Meeting Password (Optional)</Form.Label>
                        <Form.Control
                            type="text"
                            name="meetingPassword"
                            value={formData.meetingPassword}
                            onChange={handleChange}
                            placeholder="Meeting password"
                        />
                    </Form.Group>
                </Col>
            </Row>

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
                    Select a specific class or leave as "All Classes" to make it available to everyone
                </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : (liveClass ? 'Update' : 'Schedule')} Live Class
                </Button>
            </div>
        </Form>
    );
};

export default LiveClassForm;
