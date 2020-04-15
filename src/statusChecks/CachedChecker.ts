import Promise from 'bluebird';
import moment from 'moment';

export default abstract class CachedChecker {
    data: Promise<any> = Promise.resolve();
    abstract pollingPeriod: moment.Duration;
    refetchTime: moment.Moment = moment();

    get() : Promise<any> {
        if (moment().isAfter(this.refetchTime)) {
            this.refetchTime = moment().add(this.pollingPeriod);
            this.data = this.fetch()
                .catch((error: any) => {
                    console.error("Error: " + error);
                    console.log("retrying fetch");
                    this.refetchTime = moment().subtract(this.pollingPeriod)
                });
        }
        return Promise.resolve(this.data);
    }

    abstract fetch() : Promise<boolean | object | void>;


}