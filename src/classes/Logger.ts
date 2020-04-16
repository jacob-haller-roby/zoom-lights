export default class Logger {

    static error(...messages: any[]) {
        Logger.log("\x1b[31m", ...messages, "\x1b[0m");
    }

    static success(...messages: any[]) {
        Logger.log("\x1b[32m", ...messages, "\x1b[0m");
    }

    static log(...messages: any[]) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(Logger.format(new Date(), ...messages) + "\n");
    }

    static status(...messages: any[]) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.uncork();
        process.stdout.write(Logger.format(...messages));
        process.stdout.cork();
    }

    static errorStatus(...messages: any[]) {
        Logger.status("\x1b[31m", ...messages, "\x1b[0m");
    }

    private static format(...messages: any[]){
        return messages.reduce((acc, cur) => {
            if(cur instanceof Date) {
                cur = "\x1b[35m" + cur.toLocaleDateString() + " " + cur.toLocaleTimeString() + "\x1b[0m"
            }

            if(acc.length !== 0 && acc.charAt(acc.length - 1) !== " " && cur.charCodeAt(0) !== 27) {
                acc += " ";
            }

            return acc + cur;

        }, "");
    }
}