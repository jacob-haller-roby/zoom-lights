import Promise from "bluebird";
import * as https from "https";
import {IncomingMessage} from "http";
import * as queryString from "querystring";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import Environment from "../classes/Environment";

export default class SlackCheck extends CachedChecker {
    pollingPeriod = moment.duration(1, "minutes");

    fetch() : Promise<boolean> {
        return this.isUserAvailable(Environment.vars().SLACK_USER_ID) as Promise<boolean>;
    };

    isUserAvailable(userId: string) : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const req =https.request(this.getRequestOptions(userId), (res : IncomingMessage) => {
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
            });
            req.end();
        })
    };

    getRequestOptions(userId: string) : object {
        return {
            hostname: 'slack.com',
            port: 443,
            path: '/api/dnd.info?' +
                queryString.stringify({
                    user: userId
                }),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Environment.vars().SLACK_API_KEY
            }
        };
    }

    generateLogMessage(isAvailable: boolean): string {
        return isAvailable ?
            "User is Available on Slack" :
            "User is DnD on Slack";
    }
}