import * as Promise from "bluebird";
import * as https from "https";
import {IncomingMessage} from "http";
import * as queryString from "querystring";

const options = (userId) => ({
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
});

const isUserAvailable = (userId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const req =https.request(options(userId), (res : IncomingMessage) => {
            res.setEncoding('utf8');
            res.on('data', (data) => {
                resolve(!JSON.parse(data).snooze_enabled);
            });
        });
        req.end();
    });
};

export default () => isUserAvailable(process.env.SLACK_USER_ID)
    .tap((isAvailable : boolean) => {

        let message = isAvailable ?
            "User is Available" :
            "User is Away";

        console.log(new Date(), message);
    });