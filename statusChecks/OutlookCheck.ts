import * as Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import * as moment from "moment";
import * as request from 'request';
import ScheduleItem from "../classes/ScheduleItem";
import ScheduleItemCollection from "../classes/ScheduleItemCollection";

export default class OutlookCheck extends CachedChecker {
    pollingPeriod: moment.Duration = moment.duration(10, "minutes");
    refreshToken: string;
    clientId: string;
    tenant: string;
    constructor() {
        super();
        this.clientId = process.env.OUTLOOK_CLIENT_ID;
        this.refreshToken = process.env.OUTLOOK_REFRESH_TOKEN;
        this.tenant = process.env.OUTLOOK_TENANT;
    }

    fetch() : Promise {
        return this.fetchAccessToken()
            .then((accessToken: string) => this.fetchSchedule(accessToken))
            .tap(() => console.log(new Date(), "Outlook Calendar Updated"));

    };

    fetchSchedule(accessToken: string) : Promise {
        return new Promise((resolve, reject) => {
            request.post(
                'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
                {
                    json: {
                        schedules: [process.env.EMAIL],
                        startTime: {
                            dateTime: moment().startOf("day").toDate(),
                            timeZone: "Pacific Standard Time"
                        },
                        endTime: {
                            dateTime: moment().endOf("day").toDate(),
                            timeZone: "Pacific Standard Time"
                        },
                        availabilityViewInterval: 15
                    },
                    auth: {
                        bearer: accessToken
                    }
                },
                (error, res, body) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(new ScheduleItemCollection(body.value[0].scheduleItems));
                }
            )
        })
    }

    fetchAccessToken() : Promise {
        return new Promise((resolve, reject) => {
            request.post(
                `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`,
                {
                    form: {
                        client_id: this.clientId,
                        scope: "calendars.read",
                        grant_type: "refresh_token",
                        refresh_token: this.refreshToken
                    }
                },
                (error, res, body) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(JSON.parse(body).access_token);
                }
            );
        })

    }

    // fetchAccessToken() : Promise {
    //     let that = this;
    //     return new Promise((resolve, reject) => {
    //         console.log('fetching access token...');
    //         let options = {
    //             host: "login.microsoftonline.com",
    //             path: "/" + that.tenant + "/oauth2/v2.0/token",
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/x-www-form-urlencoded'
    //             }
    //         };
    //         console.log(options);
    //         const req = https.request(options, (res: IncomingMessage) => {
    //             console.log('statusCode: ' + res.statusCode);
    //             res.setEncoding('utf8');
    //             if(res.statusCode != 200) {
    //                 reject(res.statusMessage);
    //             }
    //             res.on('data', (data) => {
    //                 console.log(data);
    //                 resolve(!JSON.parse(data).access_token);
    //             });
    //         });
    //
    //         req.on('error', (error) => console.log(error));
    //         let data = queryString.stringify({
    //             client_id: that.clientId,
    //             scope: "calendars.read",
    //             grant_type: "refresh_token",
    //             refresh_token: that.refreshToken
    //         });
    //         req.write(data);
    //         req.end();
    //     });
    // }
}