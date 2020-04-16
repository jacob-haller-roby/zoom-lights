import Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import Slack from "../api/Slack";
import Logger from "../classes/Logger";

export default class SlackCheck extends CachedChecker {
    pollingPeriod = moment.duration(1, "minutes");

    fetch() : Promise<boolean> {
        return Promise.resolve(this.data)
            .then((wasSlackAvailable) => wasSlackAvailable ? this.setAwayOnWeekends() : Promise.resolve())
            .then(() => Slack.getDndStatus());
    };

    generateLogMessage(isAvailable: boolean): string {
        return isAvailable ?
            "User became available on Slack" :
            "User set to DnD on Slack";
    }

    setAwayOnWeekends() : Promise<void>{
        let weekday = moment().isoWeekday();

        let start = moment().hour(16).minute(0).second(0);
        let end = start.clone().add(1, "minutes");
        //set to away on friday @ 4:00
        //Limit to 1 minute duration.  If set to available after 1 minute, respect the manual change

        let result = Promise.resolve();
        if(weekday === 5 && moment().isBetween(start, end)) {
            let until: moment.Moment = moment().isoWeekday(8).hour(7).minute(30);
            result
                .then(() => Slack.setDndStatus(until))
                .then(() => Logger.log("Slack set to away until:", until));
        }
        return result;
    }
}