import Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import ScheduleItemCollection from "../classes/ScheduleItemCollection";
import OutlookApi from "../api/OutlookApi";

export default class OutlookCheck extends CachedChecker {
    pollingPeriod: moment.Duration = moment.duration(15, "minutes");

    fetch() : Promise<ScheduleItemCollection> {
        let until: moment.Duration = this.pollingPeriod.clone().add(2, "hours");
        let scheduleItemsPromise : Promise<ScheduleItemCollection> = OutlookApi.getScheduleItems(until)
        if (!this.data) {
            return scheduleItemsPromise;
        }
        return scheduleItemsPromise
            .then((scheduleItems : ScheduleItemCollection) =>
                (<ScheduleItemCollection>this.data).apply(scheduleItems));
    };

    generateLogMessage(newData: ScheduleItemCollection): string {
        return "Outlook Calendar Updated";
    }
}