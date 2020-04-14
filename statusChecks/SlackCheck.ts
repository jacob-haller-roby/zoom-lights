import * as Promise from "bluebird";
import * as https from "https";
import {IncomingMessage} from "http";
import * as queryString from "querystring";
import CachedChecker from "./CachedChecker";
import * as moment from "moment";

export default class SlackCheck extends CachedChecker {
    pollingPeriod = moment.duration(1, "seconds");

    fetch() : Promise {
        return this.isUserAvailable(process.env.SLACK_USER_ID);
    };

    isUserAvailable(userId: string) : Promise<boolean> {
        return new Promise((resolve, reject) => {
            const req =https.request(this.getRequestOptions(userId), (res : IncomingMessage) => {
                res.setEncoding('utf8');
                res.on('data', (data) => {
                    resolve(!JSON.parse(data).snooze_enabled);
                });
            });
            req.end();
        })
            .tap((isAvailable : boolean) => {
                let message = isAvailable ?
                    "User is Available" :
                    "User is Away";
                console.log(new Date(), message);
            });
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
                'Authorization': 'Bearer ' + process.env.SLACK_API_KEY
            }
        };
    }
}