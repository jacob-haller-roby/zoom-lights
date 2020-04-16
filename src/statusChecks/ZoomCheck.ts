import Promise from "bluebird";
import CachedChecker from "./CachedChecker";
import moment from "moment";
import ZoomApi from "../api/ZoomApi";

export default class ZoomCheck extends CachedChecker {
    pollingPeriod = moment.duration(1, "seconds");

    fetch() : Promise<boolean> {
        return ZoomApi.isInZoomMeeting();
    };

    generateLogMessage(isRunning: boolean): string {
        return isRunning ?
            "Joined Zoom Meeting" :
            "Exited Zoom Meeting";
    }
}