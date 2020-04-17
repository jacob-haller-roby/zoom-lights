import Promise from 'bluebird';
import request from 'request';
import moment from 'moment';
import ScheduleItemCollection from "../classes/ScheduleItemCollection";
import Environment from "../classes/Environment";

class OutlookApiAuth {
    refreshToken: string;
    clientId: string;
    tenant: string;
    email: string;

    constructor(tenant: string, clientId: string, refreshToken: string, email: string) {
        this.tenant = tenant;
        this.clientId = clientId;
        this.refreshToken = refreshToken;
        this.email = email;
    }

}

export default class OutlookApi {

    private static outlookApiAuth: OutlookApiAuth;

    private static checkInit() {
        if(OutlookApi.outlookApiAuth === undefined) {
            OutlookApi.outlookApiAuth = new OutlookApiAuth(
                Environment.vars().OUTLOOK_TENANT,
                Environment.vars().OUTLOOK_CLIENT_ID,
                Environment.vars().OUTLOOK_REFRESH_TOKEN,
                Environment.vars().OUTLOOK_EMAIL
            );
        }
    }

    static fetchAccessToken() : Promise<string> {
        return Promise.resolve()
            .then(OutlookApi.checkInit)
            .then(() => {
                return new Promise((resolve, reject) => {
                    request.post(
                        `https://login.microsoftonline.com/${OutlookApi.outlookApiAuth.tenant}/oauth2/v2.0/token`,
                        {
                            form: {
                                client_id: OutlookApi.outlookApiAuth.clientId,
                                scope: "calendars.read",
                                grant_type: "refresh_token",
                                refresh_token: OutlookApi.outlookApiAuth.refreshToken
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
            });
    }

    static getScheduleItems(duration: moment.Duration) : Promise<ScheduleItemCollection> {
        let start = moment();
        let end = moment().add(duration);
        return OutlookApi.fetchAccessToken()
            .then((accessToken: string) => {
                return new Promise((resolve, reject) => {
                    request.post(
                        'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
                        {
                            json: {
                                schedules: [OutlookApi.outlookApiAuth.email],
                                startTime: {
                                    dateTime: start.toDate(),
                                    timeZone: "Pacific Standard Time"
                                },
                                endTime: {
                                    dateTime: end.toDate(),
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
            })
    }
}