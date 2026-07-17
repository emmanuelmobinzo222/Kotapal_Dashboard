/**
 * WebSocket Real-time Update Service
 * Manages WebSocket connections for live dashboard updates
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketService extends EventEmitter {
  constructor(server, config = {}) {
    super();
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 1000,
      compression: config.compression || false,
      ...config
    };

    this.wss = new WebSocket.Server({ server, clientTracking: false });
    this.clients = new Set();
    this.userConnections = new Map();
    this.messageQueues = new Map();
    this.subscriptions = new Map();

    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server
   */
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const client = {
        id: clientId,
        ws,
        userId: null,
        subscriptions: new Set(),
        isAlive: true,
        connectedAt: Date.now(),
        messageCount: 0
      };

      this.clients.add(client);

      this.setupClientHandlers(client);
      this.emit('client-connected', { clientId });
    });

    // Setup heartbeat
    this.setupHeartbeat();
  }

  /**
   * Setup handlers for individual client
   */
  setupClientHandlers(client) {
    const { ws, id } = client;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(client, message);
      } catch (error) {
        console.error('Message parsing error:', error);
        this.sendToClient(client, {
          type: 'error',
          message: 'Invalid message format'
        });
      }
    });

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('close', () => {
      this.handleClientDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${id}:`, error);
      this.emit('client-error', { clientId: id, error: error.message });
    });
  }

  /**
   * Handle client messages
   */
  handleClientMessage(client, message) {
    const { type, data, token } = message;

    switch (type) {
      case 'authenticate':
        this.authenticateClient(client, token);
        break;
      case 'subscribe':
        this.subscribeClient(client, data.channels);
        break;
      case 'unsubscribe':
        this.unsubscribeClient(client, data.channels);
        break;
      case 'ping':
        this.sendToClient(client, { type: 'pong', timestamp: Date.now() });
        break;
      default:
        this.emit('message-received', { clientId: client.id, type, data });
    }

    client.messageCount++;
  }

  /**
   * Authenticate client
   */
  authenticateClient(client, token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      
      const decoded = jwt.verify(token, JWT_SECRET);
      client.userId = decoded.id;

      // Track user connections
      if (!this.userConnections.has(decoded.id)) {
        this.userConnections.set(decoded.id, []);
      }
      this.userConnections.get(decoded.id).push(client);

      this.sendToClient(client, {
        type: 'authenticated',
        userId: decoded.id,
        timestamp: Date.now()
      });

      this.emit('client-authenticated', {
        clientId: client.id,
        userId: decoded.id
      });
    } catch (error) {
      this.sendToClient(client, {
        type: 'authentication-failed',
        message: error.message
      });
    }
  }

  /**
   * Subscribe client to channels
   */
  subscribeClient(client, channels = []) {
    if (!Array.isArray(channels)) {
      channels = [channels];
    }

    channels.forEach(channel => {
      client.subscriptions.add(channel);

      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
      this.subscriptions.get(channel).add(client);

      this.emit('client-subscribed', {
        clientId: client.id,
        channel
      });
    });

    this.sendToClient(client, {
      type: 'subscribed',
      channels,
      timestamp: Date.now()
    });
  }

  /**
   * Unsubscribe client from channels
   */
  unsubscribeClient(client, channels = []) {
    if (!Array.isArray(channels)) {
      channels = [channels];
    }

    channels.forEach(channel => {
      client.subscriptions.delete(channel);

      if (this.subscriptions.has(channel)) {
        this.subscriptions.get(channel).delete(client);
      }

      this.emit('client-unsubscribed', {
        clientId: client.id,
        channel
      });
    });

    this.sendToClient(client, {
      type: 'unsubscribed',
      channels
    });
  }

  /**
   * Handle client disconnect
   */
  handleClientDisconnect(client) {
    this.clients.delete(client);

    // Remove from user connections
    if (client.userId && this.userConnections.has(client.userId)) {
      const connections = this.userConnections.get(client.userId);
      const index = connections.indexOf(client);
      if (index > -1) {
        connections.splice(index, 1);
      }
    }

    // Remove from subscriptions
    client.subscriptions.forEach(channel => {
      if (this.subscriptions.has(channel)) {
        this.subscriptions.get(channel).delete(client);
      }
    });

    this.emit('client-disconnected', {
      clientId: client.id,
      userId: client.userId
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(client, data) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  }

  /**
   * Send message to all clients
   */
  broadcast(data) {
    this.clients.forEach(client => {
      this.sendToClient(client, data);
    });
  }

  /**
   * Send message to specific channel subscribers
   */
  publishToChannel(channel, data) {
    const subscribers = this.subscriptions.get(channel);

    if (subscribers) {
      subscribers.forEach(client => {
        this.sendToClient(client, {
          type: 'channel-message',
          channel,
          data,
          timestamp: Date.now()
        });
      });
    }
  }

  /**
   * Send message to user's all connections
   */
  publishToUser(userId, data) {
    const connections = this.userConnections.get(userId);

    if (connections) {
      connections.forEach(client => {
        this.sendToClient(client, {
          type: 'user-message',
          userId,
          data,
          timestamp: Date.now()
        });
      });
    }
  }

  /**
   * Setup heartbeat
   */
  setupHeartbeat() {
    setInterval(() => {
      this.clients.forEach(client => {
        if (!client.isAlive) {
          client.ws.terminate();
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Get client info
   */
  getClientInfo(clientId) {
    const client = Array.from(this.clients).find(c => c.id === clientId);
    if (!client) return null;

    return {
      id: client.id,
      userId: client.userId,
      subscriptions: Array.from(client.subscriptions),
      connectedFor: Date.now() - client.connectedAt,
      messageCount: client.messageCount
    };
  }

  /**
   * Get user connections
   */
  getUserConnections(userId) {
    const connections = this.userConnections.get(userId) || [];
    return connections.map(client => ({
      id: client.id,
      subscriptions: Array.from(client.subscriptions),
      connectedFor: Date.now() - client.connectedAt
    }));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalConnections: this.clients.size,
      totalUsers: this.userConnections.size,
      totalChannels: this.subscriptions.size,
      channels: Array.from(this.subscriptions.entries()).map(([channel, clients]) => ({
        name: channel,
        subscribers: clients.size
      }))
    };
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close server
   */
  close() {
    this.wss.close();
  }
}

module.exports = WebSocketService;
