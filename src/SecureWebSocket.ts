export class SecureWebSocket {
    url: string;
    ws: WebSocket | null;

    constructor(url: string) {
        this.url = url;
        this.ws = null;
        this.connect();
    }

    // Connection shuru karne ka function
    connect() {
        console.log("WebSocket connecting...");
        this.ws = new WebSocket(this.url);

        // Jab connection safal ho jaaye
        this.ws.onopen = () => {
            console.log("WebSocket Connected successfully! 🎉");
        };

        // Jab server se koi message aaye
        this.ws.onmessage = (event) => {
            console.log("Message from server:", event.data);
            // Yahan aap apna data handle karne ka logic likh sakte hain
        };

        // Jab connection band ho jaaye
        this.ws.onclose = (event) => {
            console.log("WebSocket closed. Reconnecting in 3 seconds...");
            // Agar bina open hue close hua ya server down hai, to 3 sec baad dobara connect karega
            setTimeout(() => this.connect(), 3000); 
        };

        // Agar koi error aaye
        this.ws.onerror = (error) => {
            console.error("WebSocket Error caught:", error);
        };
    }

    // Data bhejne ka SAHI aur SAFE tareeka (Isse error kabhi nahi aayegi)
    sendMessage(message: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log("Message sent:", message);
        } else {
            console.warn("Cannot send message. WebSocket is not open yet. Current state:", this.ws ? this.ws.readyState : 'null');
        }
    }
}
