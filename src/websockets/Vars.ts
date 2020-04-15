import WebsocketRequest from "./WebsocketRequest";

export default class Vars extends WebsocketRequest {
    getType: string = "getVars";
    postType: string = "setVars";

    protected resolveMessage() {
        return true;
    }

    protected handleMessage(message: string): string {
        return JSON.parse(message).vars;
    }

}