import Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import Environment from "../classes/Environment";
import Slack from "../api/Slack";

export default class SlackCheck extends CachedChecker {
    pollingPeriod = moment.duration(1, "minutes");

    fetch() : Promise<boolean> {
        return this.isUserAvailable(Environment.vars().SLACK_USER_ID) as Promise<boolean>;
    };

    isUserAvailable(userId: string) : Promise<boolean> {
        return Slack.getDndStatus(userId);
    };

    generateLogMessage(isAvailable: boolean): string {
        return isAvailable ?
            "User became available on Slack" :
            "User set to DnD on Slack";
    }
}