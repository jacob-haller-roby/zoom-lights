interface Variables {
    [x: string] : string;
}

class Variables {

    OUTLOOK_CLIENT_ID: string = "";
    OUTLOOK_EMAIL: string = "";
    OUTLOOK_REFRESH_TOKEN: string = "";
    OUTLOOK_TENANT: string = "";
    SLACK_API_KEY: string = "";

    constructor() {
        Object.keys(this)
            .map((key: string ): void => {
            let value = process.env[key];
            if(value === undefined) {
                throw new Error("Undefined environment variable: " + key);
            }
            this[key] = value;
        });
    }
}

export default class Environment {

    private static variables: Variables;

    static vars() {
        if(this.variables === undefined) {
            this.variables = new Variables();
        }
        return this.variables;
    }
}