import * as Promise from "bluebird";

const isProcessRunning = (processName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        require('child_process').exec(`tasklist`, (err: Error, stdout: string, stderr: string) => {
            if (err) reject(err)
            resolve(stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1)
        })
    })
};

export default () => isProcessRunning("CptHost.exe")
    .tap((isRunning : boolean) => {

        let message = isRunning ?
            "Currently in Zoom Meeting" :
            "Not in Zoom Meeting";

        console.log(new Date(), message);
    });