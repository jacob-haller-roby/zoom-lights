export default class Logger {
    static log(...messages: any[]) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(Logger.format(...messages) + "\n");
    }

    static status(...messages: any[]) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.uncork();
        process.stdout.write(Logger.format(...messages));
        process.stdout.cork();
    }

    private static format(...messages: any[]){
        return messages.reduce((acc, cur) => {
            if(cur instanceof Date) {
                cur = "\x1b[35m" + cur.toLocaleDateString() + " " + cur.toLocaleTimeString() + "\x1b[0m"
            }
            return acc + ' ' + cur;
        }, "");
    }
}