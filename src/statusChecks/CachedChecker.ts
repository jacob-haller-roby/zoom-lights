import Promise from 'bluebird';
import moment from 'moment';

export default abstract class CachedChecker {
    data: boolean | object | void | undefined;
    abstract pollingPeriod: moment.Duration;
    refetchTime: moment.Moment = moment();

    get() : Promise<any> {
        if (moment().isAfter(this.refetchTime)) {
            this.refetchTime = moment().add(this.pollingPeriod);
            return this.fetch()
                .catch((error: any) => {
                    console.error("Error: " + error);
                    console.log("retrying fetch");
                    this.refetchTime = moment().subtract(this.pollingPeriod)
                })
                .tap((data: boolean | object | void) => {
                    if (JSON.stringify(data) !== JSON.stringify(this.data)) {
                        console.log(new Date(), this.generateLogMessage(data));
                    }
                })
                .then((data: boolean | object | void) => {
                    this.data = data;
                    return this.data;
                })

        }
        return Promise.resolve(this.data);
    }

    abstract fetch() : Promise<boolean | object | void>;
    generateLogMessage(newData: boolean | object | void): string {
        return JSON.stringify(newData);
    }


}