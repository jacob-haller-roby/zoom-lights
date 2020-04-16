import Promise from 'bluebird';
import https from 'https';
import {IncomingMessage} from "http";
import moment from 'moment';
import queryString from "querystring";
import Environment from "../classes/Environment";


export default class Slack {

    private static getRequestOptions(path: string) : object {
        return {
            hostname: 'slack.com',
            port: 443,
            path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Environment.vars().SLACK_API_KEY
            }
        };
    }

    static getDndStatus(userId: string) : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const req =https.request(this.getRequestOptions('/api/dnd.info'),
            (res : IncomingMessage) => {
                res.setEncoding('utf8');
                res.on('data', (data: string) => {
                    let jsonData : {
                        next_dnd_start_ts: number,
                        next_dnd_end_ts: number
                    } = JSON.parse(data);
                    let start : moment.Moment = moment(jsonData.next_dnd_start_ts * 1000);
                    let end : moment.Moment = moment(jsonData.next_dnd_end_ts * 1000);
                    let dndOn : boolean = start.isSameOrBefore(moment()) && end.isAfter(moment());
                    resolve(!dndOn);
                });
                res.on('error', reject);
            });
            req.end();
        })
    }

    static setDndStatus(until: moment.Moment) : Promise<void> {

        let num_minutes = moment.duration(until.diff(moment())).as('minutes');

        return new Promise<void>((resolve, reject) => {
            const req =https.request(this.getRequestOptions('/api/dnd.setSnooze?' + queryString.stringify({num_minutes})),
                (res : IncomingMessage) => {
                    res.setEncoding('utf8');
                    res.on('data', (data: string) => {
                        let jsonData : {
                            ok: boolean
                        } = JSON.parse(data);

                        jsonData.ok ? resolve() : reject();
                    });
                    res.on('error', reject);
                });
            req.end();
        })
    }
}