import WebSocket from 'ws';
import Promise from 'bluebird';

import Logger from '../classes/Logger';

interface WebsocketRequest {
    postType?: string;
}

abstract class WebsocketRequest {

    private result: string | undefined | object;

    abstract getType: string;
    protected abstract handleMessage(message: string | object | ArrayBuffer): string | undefined | object;
    protected abstract resolveMessage(message?: string | object | ArrayBuffer): boolean;
    protected host: string = "192.168.0.87";
    protected abstract responseFromPost: boolean;

    private ws: WebSocket | undefined;

    protected processMessage(message: any): Promise<any> {
        return Promise.resolve(message);
    }

    protected getCheckWebSocket() : WebSocket {
        if (this.ws === undefined) {
            this.ws = new WebSocket("ws://" + this.host + ":81");
            this.ws.on('close', this.handleClose);
            this.ws.binaryType = "arraybuffer";
        }
        return this.ws;
    }

    private getHandleMessage(resolve: (result: Promise<string>) => void) {
        let that = this;
        return (message: string | ArrayBuffer | object) => {
            let result = that.handleMessage(message);
            if (that.resolveMessage(message)) {
                that.result = result;
                resolve(that.processMessage(that.result));
            }
        }
    }
    private handleClose(): void {
        Logger.status("Closing Websocket Connection");
    }

    protected handleError(error: string) {
        Logger.error("Error: ", error);
        throw new Error();
    }

    public get() : Promise<any> {
        if(this.result !== undefined) {
            return Promise.resolve(this.result);
        }

        let frame : { [x: string]: boolean } = {};
        frame[this.getType] = true;
        const ws = this.getCheckWebSocket();
        ws.on('open', () => ws.send(JSON.stringify(frame)));

        return new Promise<string>((resolve, reject) => {
            setTimeout(() => reject("Operation Timed Out: " + this.getType), 5000);
            ws.on('message', this.getHandleMessage(resolve));
            ws.on('error', reject);
        })
            .catch(this.handleError)
            .finally(() => ws.close());
    }
    public post(postData: object | string) : Promise<any> {

        if (!this.postType) {
            return Promise.reject("Missing Post Type");
        }
        if(this.result !== undefined) {
            Logger.status("returning cached result")
            return Promise.resolve(this.result);
        }

        let frame : { [x: string]: object | string } = {
            [this.postType]: postData
        };
        const ws = this.getCheckWebSocket();
        ws.on('open', () => ws.send(JSON.stringify(frame)));
        if(this.responseFromPost) {
            return new Promise<string>((resolve, reject) => {
                setTimeout(() => reject("Operation Timed Out"), 5000);
                ws.on('message', this.getHandleMessage(resolve));
                ws.on('error', reject);
            })
                .finally(() => ws.close())
        } else {
            return this.get();
        }

    }

}

export default WebsocketRequest;