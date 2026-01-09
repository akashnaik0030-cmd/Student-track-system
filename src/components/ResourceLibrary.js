import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { resourceAPI } from '../services/api';
import { toast } from 'react-toastify';
import ResourceForm from './ResourceForm';
import './ResourceLibrary.css';

const ResourceLibrary = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(location.pathname === '/resources/new');
    const [filters, setFilters] = useState({
        subject: '',
        type: '',
        searchTerm: ''
    });

    const resourceTypes = [
        'LECTURE_NOTES',
        'VIDEO',
        'PRESENTATION',
        'DOCUMENT',
        'LINK',
        'OTHER'
    ];

    useEffect(() => {
        fetchResources();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [filters, resources]);

    useEffect(() => {
        // Auto-open form when navigating to /resources/new
        if (location.pathname === '/resources/new') {
            setShowModal(true);
        }
    }, [location]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            let response;
            
            if (user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD') {
                response = await resourceAPI.getAll();
            } else {
                response = await resourceAPI.getAll(); // Students see public resources
            }
            
            setResources(response.data);
        } catch (error) {
            console.error('Error fetching resources:', error);
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...resources];

        if (filters.subject) {
            filtered = filtered.filter(resource =>
                resource.subject.toLowerCase().includes(filters.subject.toLowerCase())
            );
        }

        if (filters.type) {
            filtered = filtered.filter(resource =>
                resource.type === filters.type
            );
        }

        if (filters.searchTerm) {
            filtered = filtered.filter(resource =>
                resource.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                (resource.description && resource.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
            );
        }

        setFilteredResources(filtered);
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const handleDownload = async (resourceId, fileName) => {
        try {
            const response = await resourceAPI.download(resourceId);
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Resource downloaded successfully');
        } catch (error) {
            console.error('Error downloading resource:', error);
            toast.error('Failed to download resource');
        }
    };

    const handleOpenLink = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (resourceId) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            try {
                await resourceAPI.delete(resourceId);
                toast.success('Resource deleted successfully');
                fetchResources();
            } catch (error) {
                console.error('Error deleting resource:', error);
                toast.error('Failed to delete resource');
            }
        }
    };

    const handleResourceCreated = () => {
        setShowModal(false);
        fetchResources();
    };

    const getResourceIcon = (type) => {
        const icons = {
            'LECTURE_NOTES': '📝',
            'VIDEO': '🎥',
            'PRESENTATION': '📊',
            'DOCUMENT': '📄',
            'LINK': '🔗',
            'OTHER': '📚'
        };
        return icons[type] || '📚';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return 'N/A';
        }
    };

    const canModify = user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD';

    return (
        <Container className="resource-library py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <h2>📚 Resource Library</h2>
                        {canModify && (
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                + Add Resource
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Filters */}
            <Row className="mb-4">
                <Col md={4}>
                    <Form.Group>
                        <Form.Control
                            type="text"
                            placeholder="Search by title or description..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Control
                            type="text"
                            placeholder="Filter by subject..."
                            value={filters.subject}
                            onChange={(e) => handleFilterChange('subject', e.target.value)}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        {resourceTypes.map(type => (
                            <option key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>

            {/* Resources Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filteredResources.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <h5 className="text-muted">No resources found</h5>
                        <p className="text-muted">
                            {canModify ? 'Add your first resource to get started!' : 'Check back later for new resources'}
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {filteredResources.map((resource) => (
                        <Col key={resource.id} md={6} lg={4} className="mb-4">
                            <Card className="resource-card h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <span className="resource-icon">
                                            {getResourceIcon(resource.type)}
                                        </span>
                                        <Badge bg={resource.isPublic ? 'success' : 'secondary'}>
                                            {resource.isPublic ? 'Public' : 'Private'}
                                        </Badge>
                                    </div>
                                    
                                    <Card.Title className="resource-title">
                                        {resource.title}
                                    </Card.Title>
                                    
                                    <Badge bg="info" className="mb-2">
                                        {resource.subject}
                                    </Badge>
                                    
                                    {resource.description && (
                                        <Card.Text className="resource-description">
                                            {resource.description}
                                        </Card.Text>
                                    )}
                                    
                                    <div className="resource-meta">
                                        <small className="text-muted d-block">
                                            Type: {resource.type.replace(/_/g, ' ')}
                                        </small>
                                        {resource.fileSize && (
                                            <small className="text-muted d-block">
                                                Size: {formatFileSize(resource.fileSize)}
                                            </small>
                                        )}
                                        <small className="text-muted d-block">
                                            Downloads: {resource.downloadCount || 0}
                                        </small>
                                        <small className="text-muted d-block">
                                            Added: {formatDate(resource.createdAt)}
                                        </small>
                                    </div>
                                </Card.Body>
                                
                                <Card.Footer className="bg-white">
                                    <div className="d-flex justify-content-between">
                                        {resource.type === 'LINK' ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleOpenLink(resource.url)}
                                            >
                                                Open Link
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleDownload(resource.id, resource.fileName)}
                                                disabled={!resource.filePath}
                                            >
                                                Download
                                            </Button>
                                        )}
                                        
                                        {canModify && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(resource.id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add Resource Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Resource</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ResourceForm
                        onResourceCreated={handleResourceCreated}
                        onCancel={() => setShowModal(false)}
                    />
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ResourceLibrary;
