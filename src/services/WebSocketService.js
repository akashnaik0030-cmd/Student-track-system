import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = [];
        this.messageHandlers = [];
        this.reconnectDelay = 5000;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(userId, onNotificationReceived) {
        if (this.connected) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            this.stompClient = new Client({
                webSocketFactory: () => new SockJS('http://localhost:9090/ws'),
                debug: (msg) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log(msg);
                    }
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: (frame) => {
                    console.log('WebSocket Connected:', frame);
                    this.connected = true;
                    this.reconnectAttempts = 0;

                    // Use setTimeout to ensure connection is fully established
                    setTimeout(() => {
                        // Check if stompClient is still active before subscribing
                        if (!this.stompClient || !this.stompClient.connected) {
                            console.error('STOMP client not ready for subscription');
                            return;
                        }

                        try {
                            // Subscribe to user-specific notification queue
                            const subscription = this.stompClient.subscribe(
                                `/user/${userId}/queue/notifications`,
                                (message) => {
                                    try {
                                        const notification = JSON.parse(message.body);
                                        console.log('Received notification:', notification);
                                        
                                        // Call the callback
                                        if (onNotificationReceived) {
                                            onNotificationReceived(notification);
                                        }

                                        // Show toast notification
                                        this.showToastNotification(notification);

                                        // Call all registered handlers
                                        this.messageHandlers.forEach(handler => handler(notification));
                                    } catch (error) {
                                        console.error('Error processing notification:', error);
                                    }
                                }
                            );

                            this.subscriptions.push(subscription);

                            // Subscribe to broadcast topic for general announcements
                            const broadcastSubscription = this.stompClient.subscribe(
                                '/topic/notifications',
                                (message) => {
                                    try {
                                        const notification = JSON.parse(message.body);
                                        console.log('Received broadcast notification:', notification);
                                        this.showToastNotification(notification);
                                    } catch (error) {
                                        console.error('Error processing broadcast notification:', error);
                                    }
                                }
                            );

                            this.subscriptions.push(broadcastSubscription);
                        } catch (error) {
                            console.error('Error subscribing to notifications:', error);
                        }
                    }, 100); // Small delay to ensure connection is ready
                },
                onStompError: (frame) => {
                    console.error('WebSocket STOMP error:', frame);
                    this.connected = false;
                    this.handleReconnect(userId, onNotificationReceived);
                },
                onWebSocketClose: () => {
                    console.log('WebSocket connection closed');
                    this.connected = false;
                    this.handleReconnect(userId, onNotificationReceived);
                }
            });

            this.stompClient.activate();
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
            this.handleReconnect(userId, onNotificationReceived);
        }
    }

    disconnect() {
        if (this.stompClient && this.connected) {
            // Unsubscribe from all subscriptions
            this.subscriptions.forEach(subscription => {
                try {
                    subscription.unsubscribe();
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                }
            });
            this.subscriptions = [];

            try {
                this.stompClient.deactivate();
                console.log('WebSocket disconnected');
            } catch (error) {
                console.error('Error disconnecting:', error);
            }
            
            this.connected = false;
            this.stompClient = null;
        }
    }

    handleReconnect(userId, onNotificationReceived) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
                this.connect(userId, onNotificationReceived);
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
            toast.error('Real-time notifications unavailable. Please refresh the page.');
        }
    }

    showToastNotification(notification) {
        const notificationTypes = {
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

        const icon = notificationTypes[notification.type] || '🔔';
        const message = `${icon} ${notification.title}`;

        toast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: () => {
                // Mark notification as read when clicked
                this.markAsRead(notification.id);
            }
        });
    }

    markAsRead(notificationId) {
        // This will be called from the notification handler
        // The actual API call should be made from the component
        console.log('Marking notification as read:', notificationId);
    }

    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }

    removeMessageHandler(handler) {
        this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    }

    isConnected() {
        return this.connected;
    }

    // Send message to server (if needed for future features)
    send(destination, message) {
        if (this.connected && this.stompClient) {
            this.stompClient.publish({
                destination: destination,
                body: JSON.stringify(message)
            });
        } else {
            console.error('WebSocket not connected');
        }
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
