import ScheduleItem from "./ScheduleItem";
import moment from "moment";

export default class ScheduleItemCollection  {
    scheduleItems: Array<ScheduleItem>;

    constructor(scheduleItems: Array<ScheduleItem>) {
        this.scheduleItems = scheduleItems.map(scheduleItem => new ScheduleItem(scheduleItem));
    }

    isBean30(time: moment.Moment = moment()) : boolean {
        return this.scheduleItems.some((scheduleItem : ScheduleItem) => {
            return scheduleItem.subject === "It's Bean 30!";
                (<moment.Moment>scheduleItem.start).isSameOrBefore(time) &&
                (<moment.Moment>scheduleItem.end).isAfter(time);
        });
    }

    hasMeeting(time: moment.Moment = moment()) : boolean {
        return this.scheduleItems.some((scheduleItem : ScheduleItem) => {
            return scheduleItem.subject != "It's Bean 30!" &&
                (<moment.Moment>scheduleItem.start).isSameOrBefore(time) &&
                (<moment.Moment>scheduleItem.end).isAfter(time);
        });
    }

    meetingStartingSoon(duration: moment.Duration = moment.duration(15, "minutes")) : boolean {
        return this.hasMeeting(moment().add(duration)) || this.hasMeeting(moment().add(moment.duration(1, "minutes")));
    }

    clearCurrentMeetings() : void {
        this.scheduleItems = this.scheduleItems.filter(scheduleItem => {
            return !(
                (<moment.Moment>scheduleItem.start).isSameOrBefore(moment()) &&
                (<moment.Moment>scheduleItem.end).isAfter(moment())
            );
        })
    }
}