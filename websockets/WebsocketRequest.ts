import * as WebSocket from 'ws';
import * as Promise from 'bluebird';

interface WebsocketRequest {
    postType?: string;
}

abstract class WebsocketRequest {

    private result: string;

    abstract getType: string;
    protected abstract handleMessage(message: string | ArrayBuffer): string;
    protected abstract resolveMessage(message?: string | ArrayBuffer): boolean;
    protected host: string = "192.168.0.87";

    private ws: WebSocket;

    protected processMessage(message: any): object {
        return message;
    }

    protected getCheckWebSocket() : WebSocket {
        if (this.ws === undefined) {
            this.ws = new WebSocket("ws://" + this.host + ":81");
            this.ws.on('close', this.handleClose);
            this.ws.binaryType = "arraybuffer";
        }
        return this.ws;
    }

    private getHandleMessage(resolve: (result: object) => void) {
        let that = this;
        return (message: string | ArrayBuffer) => {
            let result = that.handleMessage(message);
            if (that.resolveMessage(message)) {
                that.result = result;
                resolve(that.processMessage(that.result));
            }
        }
    }
    private handleClose(): void {
        console.log("Closing Websocket Connection");
    }

    protected handleError(error: string) {
        console.error("Error: " + error);
    }

    public get() : Promise {
        if(this.result !== undefined) {
            return Promise.resolve(this.result);
        }

        let frame = {};
        frame[this.getType] = true;
        const ws = this.getCheckWebSocket();
        ws.on('open', () => ws.send(JSON.stringify(frame)));

        return new Promise((resolve, reject) => {
            setTimeout(() => reject("Operation Timed Out"), 5000);
            ws.on('message', this.getHandleMessage(resolve));
            ws.on('error', reject);
        })
            .catch(this.handleError)
            .finally(() => ws.close());
    }
    public post(postData: object | string) : Promise {

        if (!this.postType) {
            return Promise.reject("Missing Post Type");
        }
        if(this.result !== undefined) {
            console.log("returning cached result")
            return Promise.resolve(this.result);
        }

        let frame = {};
        frame[this.postType] = postData;
        const ws = this.getCheckWebSocket();
        ws.on('open', () => ws.send(JSON.stringify(frame)));
        return this.get();
    }

}

export default WebsocketRequest;