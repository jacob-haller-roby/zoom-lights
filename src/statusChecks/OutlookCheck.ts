import Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import ScheduleItemCollection from "../classes/ScheduleItemCollection";
import OutlookApi from "../api/OutlookApi";

export default class OutlookCheck extends CachedChecker {
    pollingPeriod: moment.Duration = moment.duration(12, "hours");

    fetch() : Promise<ScheduleItemCollection> {
        return OutlookApi.getScheduleItems();
    };

    generateLogMessage(newData: ScheduleItemCollection): string {
        return "Outlook Calendar Updated";
    }
}