import ScheduleItem from "./ScheduleItem";
import moment from "moment";

export default class ScheduleItemCollection  {
    scheduleItems: Array<ScheduleItem>;

    constructor(scheduleItems: Array<ScheduleItem>) {
        this.scheduleItems = scheduleItems.map(scheduleItem => new ScheduleItem(scheduleItem));
    }

    isBean30(time: moment.Moment = moment()) : boolean {
        return this.scheduleItems.some((scheduleItem : ScheduleItem) => {
            return scheduleItem.subject === "It's Bean 30!" &&
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
        let start = moment();
        let end = moment().add(duration);
        return this.scheduleItems.some(scheduleItem => (<moment.Moment>scheduleItem.start).isBetween(start, end));
    }

    getNextMeeting(time: moment.Moment = moment()) : ScheduleItem {
        let eod = time.clone().endOf('day');
        return this.scheduleItems.reduce((acc: ScheduleItem, cur: ScheduleItem) : ScheduleItem => {
            let isNextEvent = (<moment.Moment>cur.start).isBetween(time, <moment.Moment>acc.start);
            if(isNextEvent){
                return cur;
            }
            return acc;
        }, new ScheduleItem({
            start: eod,
            end: eod,
            isPrivate: true,
            location: "",
            status: "",
            subject: ""
        }))
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