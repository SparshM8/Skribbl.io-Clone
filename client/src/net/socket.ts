type Listener = (payload: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private reconnectTimer: any = null;
  private shouldReconnect = true;

  get isOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOpen) return resolve();

      const url = import.meta.env.VITE_WS_URL || 
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.emit('_connected', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && typeof data.type === 'string') {
              this.dispatch(data.type, data.payload ?? {});
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        this.ws.onclose = () => {
          this.ws = null;
          this.emit('_disconnected', {});
          if (this.shouldReconnect) {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.connect(), 2000);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket error:', err);
        };
      } catch (err) {
        console.error('Connection attempt failed:', err);
        if (this.shouldReconnect) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), 2000);
        }
      }
    });
  }

  send(type: string, payload: unknown = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(type: string, listener: Listener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    return () => this.off(type, listener);
  }

  off(type: string, listener: Listener): void {
    const set = this.listeners.get(type);
    if (set) set.delete(listener);
  }

  private dispatch(type: string, payload: any): void {
    const set = this.listeners.get(type);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`Error in socket listener for ${type}:`, e);
        }
      });
    }
  }

  private emit(internalEvent: string, payload: any): void {
    this.dispatch(internalEvent, payload);
  }
}

export const socket = new SocketService();
