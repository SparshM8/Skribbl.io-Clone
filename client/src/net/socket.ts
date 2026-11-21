type Listener = (payload: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private reconnectTimer: any = null;
  private shouldReconnect = true;
  private connectPromise: Promise<void> | null = null;
  private outboundQueue: string[] = [];

  get isOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    if (this.isOpen) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve) => {
      const url =
        import.meta.env.VITE_WS_URL ||
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(url);
        this.ws = ws;

        ws.onopen = () => {
          this.connectPromise = null;
          this.emit('_connected', {});
          // Flush any queued outbound messages immediately
          while (this.outboundQueue.length > 0) {
            const rawMsg = this.outboundQueue.shift();
            if (rawMsg && ws.readyState === WebSocket.OPEN) {
              ws.send(rawMsg);
            }
          }
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && typeof data.type === 'string') {
              this.dispatch(data.type, data.payload ?? {});
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          this.connectPromise = null;
          this.ws = null;
          this.emit('_disconnected', {});
          if (this.shouldReconnect) {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.connect(), 2000);
          }
        };

        ws.onerror = (err) => {
          console.warn('WebSocket error:', err);
          this.connectPromise = null;
          resolve();
        };
      } catch (err) {
        this.connectPromise = null;
        console.error('Connection attempt failed:', err);
        resolve();
      }
    });

    return this.connectPromise;
  }

  send(type: string, payload: unknown = {}): void {
    const rawMsg = JSON.stringify({ type, payload });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(rawMsg);
    } else {
      // Queue message and trigger connection
      this.outboundQueue.push(rawMsg);
      this.connect();
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
