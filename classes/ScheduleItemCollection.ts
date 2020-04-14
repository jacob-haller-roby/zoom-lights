import ScheduleItem from "./ScheduleItem";
import * as moment from "moment";

export default class ScheduleItemCollection  {
    scheduleItems: Array<ScheduleItem>;

    constructor(scheduleItems: Array<ScheduleItem>) {
        this.scheduleItems = scheduleItems.map(scheduleItem => new ScheduleItem(scheduleItem));
    }

    hasMeeting(time: moment.Moment = moment()) : boolean {
        return this.scheduleItems.some((scheduleItem : ScheduleItem) => {
            return (<moment.Moment>scheduleItem.start).isSameOrBefore(time) &&
                (<moment.Moment>scheduleItem.end).isAfter(time);
        });
    }

    meetingStartingSoon(duration: moment.Duration = moment.duration(15, "minutes")) : boolean {
        return this.hasMeeting(moment().add(duration));
    }
}