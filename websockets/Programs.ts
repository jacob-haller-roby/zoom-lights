import WebsocketRequest from "./WebsocketRequest";

export default class Programs extends WebsocketRequest {
    private resultBuilder: string = "";
    getType: string = "listPrograms";

    protected resolveMessage(message: ArrayBuffer) {
        const view = new Uint8Array(message);
        let isPatternList = view[0] === 7;
        let isEnd = view[1] === 4;
        return isPatternList && isEnd;
    }

    protected handleMessage(message: ArrayBuffer): string {
        let view = new Uint8Array(message);
        let subView= Object.values(view.subarray(2));
        this.resultBuilder += String.fromCharCode(...subView);
        return this.resultBuilder;
    }

    protected processMessage(message: string): object {
        let lines = message.split("\n");
        lines.pop();
        return lines.map(line => {
            let splitLine = line.split("\t");
            return {
                id: splitLine[0],
                name: splitLine[1]
            }
        });
    }

}