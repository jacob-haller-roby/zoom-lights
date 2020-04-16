import Promise from 'bluebird';
import moment from 'moment';
import Logger from '../classes/Logger';
import ScheduleItemCollection from "../classes/ScheduleItemCollection";


export default abstract class CachedChecker {
    static readonly ReturnTypes: boolean | ScheduleItemCollection | void;
    data: typeof CachedChecker.ReturnTypes | undefined;
    abstract pollingPeriod: moment.Duration;
    refetchTime: moment.Moment = moment();

    refresh(): Promise<typeof CachedChecker.ReturnTypes> {
        this.refetchTime = moment();
        return this.get();
    }

    get() : Promise<typeof CachedChecker.ReturnTypes> {
        if (moment().isAfter(this.refetchTime)) {
            this.refetchTime = moment().add(this.pollingPeriod);
            return this.fetch()
                .catch((error: any) => {
                    Logger.error("Error: " + error);
                    Logger.error("retrying fetch");
                    this.refetchTime = moment().subtract(this.pollingPeriod)
                })
                .tap((data: typeof CachedChecker.ReturnTypes) => {
                    if (JSON.stringify(data) !== JSON.stringify(this.data)) {
                        Logger.log(this.generateLogMessage(data));
                    }
                })
                .then((data: typeof CachedChecker.ReturnTypes) => {
                    this.data = data;
                    return this.data;
                })

        }
        return Promise.resolve(this.data);
    }

    abstract fetch() : Promise<typeof CachedChecker.ReturnTypes>;
    generateLogMessage(newData: typeof CachedChecker.ReturnTypes): string {
        return JSON.stringify(newData);
    }


}