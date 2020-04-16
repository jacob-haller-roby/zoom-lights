import WebsocketRequest from "./WebsocketRequest";

export default class Active extends WebsocketRequest {
    getType: string = "getConfig";
    postType: string = "activeProgramId";
    responseFromPost: boolean = false;

    protected resolveMessage(message: string) {
        return !!JSON.parse(message).activeProgram;
    }

    protected handleMessage(message: string): string | undefined {
        let response = JSON.parse(message).activeProgram;
        if (response) {
            return response.activeProgramId;
        }
    }

}