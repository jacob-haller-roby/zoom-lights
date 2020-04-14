import * as Promise from 'bluebird';
import * as moment from 'moment';

export default abstract class CachedChecker {
    data: Promise;
    refetchTime: moment.Moment = moment();
    abstract pollingPeriod: moment.Duration;

    get() : Promise {
        if (moment().isAfter(this.refetchTime)) {
            this.refetchTime = moment().add(this.pollingPeriod);
            this.data = this.fetch()
                .catch((error) => {
                    console.error("Error: " + error);
                    console.log("retrying fetch");
                    this.refetchTime = moment().subtract(this.pollingPeriod)
                });
        }
        return Promise.resolve(this.data);
    }

    abstract fetch() : Promise;


}