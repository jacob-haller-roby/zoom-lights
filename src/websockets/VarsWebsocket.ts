import WebsocketRequest from "./WebsocketRequest";

export default class VarsWebsocket extends WebsocketRequest {
    getType: string = "getVars";
    postType: string = "setVars";
    responseFromPost: boolean = false;

    protected resolveMessage(message: string) : boolean {
        return !!JSON.parse(message).vars;
    }

    protected handleMessage(message: string): object | string {
        return JSON.parse(message).vars;
    }

}