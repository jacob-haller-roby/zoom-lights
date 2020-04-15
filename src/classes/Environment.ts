import * as ts from 'typescript';

enum EnvironmentVariables {
    OUTLOOK_CLIENT_ID,
    OUTLOOK_EMAIL,
    OUTLOOK_REFRESH_TOKEN,
    OUTLOOK_TENANT,
    SLACK_API_KEY,
    SLACK_USER_ID
}

interface Variables {
    [x: string] : string;
}


class Variables {

    constructor() {
        Object.values(EnvironmentVariables)
            .filter (<(variable: string | number) => variable is string>(variable => typeof variable === "string"))
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