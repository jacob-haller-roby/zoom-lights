import Promise from 'bluebird';
import Logger from "../classes/Logger";

export default class ZoomApi {

    static isInZoomMeeting() : Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            setTimeout(() => reject("Process Timed Out"), 5000);
            require('child_process').exec(`tasklist`, (err: Error, stdout: string, stderr: string) => {
                if (err){
                    reject(err)
                }
                resolve(stdout.toLowerCase().indexOf("CptHost.exe".toLowerCase()) > -1)
            })
        })
            .catch((err: Error | string) => {
                Logger.error("Error in ZoomAPI process:", err);
                throw err;
            });
    }

}