import React, { useState, useEffect, useRef } from 'react';
import { Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../services/api';
import webSocketService from '../services/WebSocketService';
import { toast } from 'react-toastify';
import './NotificationBell.css';

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user && user.id) {
            // Fetch initial notifications
            fetchNotifications();
            fetchUnreadCount();

            // Connect to WebSocket
            webSocketService.connect(user.id, handleNewNotification);

            // Cleanup on unmount
            return () => {
                webSocketService.disconnect();
            };
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getRecent();
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            setUnreadCount(response.data);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleNewNotification = (notification) => {
        // Add new notification to the list
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            
            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, read: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            
            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const handleDeleteNotification = async (notificationId, event) => {
        event.stopPropagation();
        try {
            await notificationAPI.delete(notificationId);
            
            // Update local state
            setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            'TASK_ASSIGNED': '📝',
            'SUBMISSION_RECEIVED': '📬',
            'SUBMISSION_GRADED': '✅',
            'ATTENDANCE_MARKED': '📋',
            'FEEDBACK_RECEIVED': '💬',
            'RESOURCE_ADDED': '📚',
            'LIVE_CLASS_SCHEDULED': '🎥',
            'DEADLINE_REMINDER': '⏰',
            'GENERAL': '🔔'
        };
        return icons[type] || '🔔';
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container">
            <Dropdown show={showDropdown} onToggle={setShowDropdown} ref={dropdownRef}>
                <Dropdown.Toggle
                    variant="link"
                    className="notification-bell-toggle"
                    id="notification-dropdown"
                >
                    <span className="bell-icon">🔔</span>
                    {unreadCount > 0 && (
                        <Badge bg="danger" className="notification-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className="notification-dropdown-menu">
                    <div className="notification-header">
                        <h6>Notifications</h6>
                        {unreadCount > 0 && (
                            <button
                                className="btn btn-link btn-sm"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="text-center p-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center text-muted p-3">
                                No notifications
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {notifications.map((notification) => (
                                    <ListGroup.Item
                                        key={notification.id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                        action
                                    >
                                        <div className="d-flex align-items-start">
                                            <span className="notification-type-icon me-2">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <strong className="notification-title">
                                                        {notification.title}
                                                    </strong>
                                                    <button
                                                        className="btn btn-link btn-sm text-danger p-0 ms-2"
                                                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                        title="Delete"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <p className="notification-message mb-1">
                                                    {notification.message}
                                                </p>
                                                <small className="text-muted">
                                                    {formatTimestamp(notification.createdAt)}
                                                </small>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <span className="unread-indicator"></span>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </div>

                    <Dropdown.Divider />
                    <Dropdown.Item
                        className="text-center view-all-link"
                        href="/notifications"
                    >
                        View All Notifications
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default NotificationBell;
