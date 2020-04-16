import Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import request from 'request';
import ScheduleItemCollection from "../classes/ScheduleItemCollection";
import Environment from "../classes/Environment";

export default class OutlookCheck extends CachedChecker {
    pollingPeriod: moment.Duration = moment.duration(12, "hours");
    refreshToken: string;
    clientId: string;
    tenant: string;
    email: string;
    constructor() {
        super();
        this.clientId = Environment.vars().OUTLOOK_CLIENT_ID;
        this.refreshToken = Environment.vars().OUTLOOK_REFRESH_TOKEN;
        this.tenant = Environment.vars().OUTLOOK_TENANT;
        this.email = Environment.vars().OUTLOOK_EMAIL;
    }

    fetch() : Promise<ScheduleItemCollection> {
        return this.fetchAccessToken()
            .then((accessToken: string) => this.fetchSchedule(accessToken));

    };

    fetchSchedule(accessToken: string) : Promise<ScheduleItemCollection> {
        return new Promise((resolve, reject) => {
            request.post(
                'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
                {
                    json: {
                        schedules: [this.email],
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

    fetchAccessToken() : Promise<string> {
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

    generateLogMessage(newData: ScheduleItemCollection): string {
        return "Outlook Calendar Updated";
    }
}