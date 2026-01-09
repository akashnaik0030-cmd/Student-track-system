import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { liveClassAPI } from '../services/api';
import { toast } from 'react-toastify';
import LiveClassForm from './LiveClassForm';
import './LiveClassList.css';

const LiveClassList = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [liveClasses, setLiveClasses] = useState([]);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(location.pathname === '/live-classes/new');
    const [selectedClass, setSelectedClass] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        fetchLiveClasses();
    }, [user]);

    useEffect(() => {
        // Auto-open form when navigating to /live-classes/new
        if (location.pathname === '/live-classes/new') {
            setShowModal(true);
        }
    }, [location]);

    const fetchLiveClasses = async () => {
        try {
            setLoading(true);
            
            let response;
            if (user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD') {
                response = await liveClassAPI.getMyClasses();
            } else {
                response = await liveClassAPI.getUpcoming();
            }
            
            setLiveClasses(response.data);
            
            // Filter upcoming classes
            const now = new Date();
            const upcoming = response.data.filter(lc => {
                const scheduledDate = new Date(lc.scheduledAt);
                return scheduledDate > now && lc.status === 'SCHEDULED';
            });
            setUpcomingClasses(upcoming);
        } catch (error) {
            console.error('Error fetching live classes:', error);
            toast.error('Failed to load live classes');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClass = (meetingUrl) => {
        if (meetingUrl) {
            window.open(meetingUrl, '_blank', 'noopener,noreferrer');
        } else {
            toast.error('Meeting URL not available');
        }
    };

    const handleUpdateStatus = async (classId, newStatus) => {
        try {
            await liveClassAPI.updateStatus(classId, { status: newStatus });
            toast.success('Status updated successfully');
            fetchLiveClasses();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (classId) => {
        if (window.confirm('Are you sure you want to delete this live class?')) {
            try {
                await liveClassAPI.delete(classId);
                toast.success('Live class deleted successfully');
                fetchLiveClasses();
            } catch (error) {
                console.error('Error deleting live class:', error);
                toast.error('Failed to delete live class');
            }
        }
    };

    const handleEditClass = (liveClass) => {
        setSelectedClass(liveClass);
        setShowModal(true);
    };

    const handleClassCreated = () => {
        setShowModal(false);
        setSelectedClass(null);
        fetchLiveClasses();
    };

    const getPlatformIcon = (platform) => {
        const icons = {
            'ZOOM': '🎥',
            'MICROSOFT_TEAMS': '💼',
            'GOOGLE_MEET': '📹',
            'OTHER': '🔗'
        };
        return icons[platform] || '🔗';
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'SCHEDULED': { bg: 'primary', text: 'Scheduled' },
            'ONGOING': { bg: 'success', text: 'Ongoing' },
            'COMPLETED': { bg: 'secondary', text: 'Completed' },
            'CANCELLED': { bg: 'danger', text: 'Cancelled' }
        };
        const config = statusConfig[status] || statusConfig['SCHEDULED'];
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    const getTimeRemaining = (scheduledAt) => {
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const diffMs = scheduled - now;
        
        if (diffMs < 0) return 'Started';
        
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `Starts in ${diffMins}m`;
        if (diffHours < 24) return `Starts in ${diffHours}h`;
        return `Starts in ${diffDays}d`;
    };

    const canModify = user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD';

    const renderClassCard = (liveClass) => (
        <Col key={liveClass.id} md={6} lg={4} className="mb-4">
            <Card className="live-class-card h-100">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="platform-icon">
                            {getPlatformIcon(liveClass.platform)}
                        </span>
                        {getStatusBadge(liveClass.status)}
                    </div>
                    
                    <Card.Title className="class-title">
                        {liveClass.title}
                    </Card.Title>
                    
                    <Badge bg="info" className="mb-2">
                        {liveClass.subject}
                    </Badge>
                    
                    {liveClass.description && (
                        <Card.Text className="class-description">
                            {liveClass.description}
                        </Card.Text>
                    )}
                    
                    <div className="class-meta">
                        <div className="meta-item">
                            <strong>📅 Date:</strong> {formatDateTime(liveClass.scheduledAt)}
                        </div>
                        <div className="meta-item">
                            <strong>⏱️ Duration:</strong> {liveClass.durationMinutes} mins
                        </div>
                        <div className="meta-item">
                            <strong>💻 Platform:</strong> {liveClass.platform.replace(/_/g, ' ')}
                        </div>
                        {liveClass.status === 'SCHEDULED' && (
                            <div className="meta-item text-primary">
                                <strong>{getTimeRemaining(liveClass.scheduledAt)}</strong>
                            </div>
                        )}
                    </div>
                </Card.Body>
                
                <Card.Footer className="bg-white">
                    <div className="d-flex gap-2 flex-wrap">
                        {liveClass.status === 'SCHEDULED' && liveClass.meetingUrl && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleJoinClass(liveClass.meetingUrl)}
                                className="flex-grow-1"
                            >
                                Join Class
                            </Button>
                        )}
                        
                        {liveClass.status === 'COMPLETED' && liveClass.recordingUrl && (
                            <Button
                                variant="info"
                                size="sm"
                                onClick={() => handleJoinClass(liveClass.recordingUrl)}
                                className="flex-grow-1"
                            >
                                Watch Recording
                            </Button>
                        )}
                        
                        {canModify && (
                            <>
                                {liveClass.status === 'SCHEDULED' && (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleUpdateStatus(liveClass.id, 'ONGOING')}
                                    >
                                        Start
                                    </Button>
                                )}
                                {liveClass.status === 'ONGOING' && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleUpdateStatus(liveClass.id, 'COMPLETED')}
                                    >
                                        End
                                    </Button>
                                )}
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEditClass(liveClass)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(liveClass.id)}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </Card.Footer>
            </Card>
        </Col>
    );

    return (
        <Container className="live-class-list py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <h2>🎥 Live Classes</h2>
                        {canModify && (
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                + Schedule Live Class
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="upcoming" title={`Upcoming (${upcomingClasses.length})`}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : upcomingClasses.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <h5 className="text-muted">No upcoming classes</h5>
                                <p className="text-muted">
                                    {canModify ? 'Schedule your first live class!' : 'Check back later for scheduled classes'}
                                </p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Row>
                            {upcomingClasses.map(liveClass => renderClassCard(liveClass))}
                        </Row>
                    )}
                </Tab>

                <Tab eventKey="all" title="All Classes">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : liveClasses.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <h5 className="text-muted">No live classes found</h5>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Row>
                            {liveClasses.map(liveClass => renderClassCard(liveClass))}
                        </Row>
                    )}
                </Tab>
            </Tabs>

            {/* Schedule/Edit Live Class Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setSelectedClass(null); }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedClass ? 'Edit Live Class' : 'Schedule New Live Class'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LiveClassForm
                        liveClass={selectedClass}
                        onClassCreated={handleClassCreated}
                        onCancel={() => { setShowModal(false); setSelectedClass(null); }}
                    />
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default LiveClassList;
