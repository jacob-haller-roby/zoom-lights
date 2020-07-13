import ScheduleItem from "./ScheduleItem";
import moment from "moment";

export default class ScheduleItemCollection  {
    private meetingStartGracePeriod : moment.Duration = moment.duration(30, "seconds");
    scheduleItems: Array<ScheduleItem>;

    constructor(scheduleItems: Array<ScheduleItem>) {
        this.scheduleItems = scheduleItems.map(scheduleItem => new ScheduleItem(scheduleItem))
            .filter(scheduleItem => scheduleItem.status !== "free");
    }

    apply(scheduleItemCollection: ScheduleItemCollection) : ScheduleItemCollection {

        let newItems = scheduleItemCollection.scheduleItems.filter((scheduleItem : ScheduleItem) => {
            return (<moment.Moment>scheduleItem.start).isAfter(moment()) &&
                !this.contains(scheduleItem)
        })

        this.scheduleItems.push(...newItems);
        return this;
    }

    contains(scheduleItem: ScheduleItem) : boolean {
        return this.scheduleItems.some((existingItem : ScheduleItem) => {
            return existingItem.subject === scheduleItem.subject
                && existingItem.start === scheduleItem.start
        });
    }

    isBean30(time: moment.Moment = moment()) : boolean {
        return this.scheduleItems.some((scheduleItem : ScheduleItem) => {
            return scheduleItem.subject === "It's Bean 30!" &&
                (<moment.Moment>scheduleItem.start).isSameOrBefore(time) &&
                (<moment.Moment>scheduleItem.end).isAfter(time);
        });
    }

    hasMeeting(time: moment.Moment = moment()) : boolean {
        let graceAdjustedTime = time.subtract(this.meetingStartGracePeriod);
        return this.scheduleItems.some((scheduleItem : ScheduleItem) => {
            return scheduleItem.subject != "It's Bean 30!" &&
                (<moment.Moment>scheduleItem.start).isSameOrBefore(graceAdjustedTime) &&
                (<moment.Moment>scheduleItem.end).isAfter(graceAdjustedTime);
        });
    }

    meetingStartingSoon(duration: moment.Duration = moment.duration(15, "minutes")) : boolean {
        let start = moment().subtract(this.meetingStartGracePeriod);
        let end = moment().add(duration).subtract(this.meetingStartGracePeriod);
        return this.scheduleItems.some(scheduleItem => {
            return scheduleItem.subject != "It's Bean 30!" &&
            (<moment.Moment>scheduleItem.start).isBetween(start, end)
        });
    }

    getNextMeeting(time: moment.Moment = moment()) : ScheduleItem {
        let eod = time.clone().endOf('day');
        return this.scheduleItems.reduce((acc: ScheduleItem, cur: ScheduleItem) : ScheduleItem => {
            if((<moment.Moment>cur.start).isBetween(time, <moment.Moment>acc.start)){
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

    clearCurrentMeetings(gracePeriod: moment.Duration = moment.duration(5, "minutes")) : void {
        this.scheduleItems = this.scheduleItems.filter(scheduleItem => {
            return scheduleItem.subject != "It's Bean 30!" &&
            !(
                (<moment.Moment>scheduleItem.start).isSameOrBefore(moment().add(gracePeriod)) &&
                (<moment.Moment>scheduleItem.end).isAfter(moment().subtract(gracePeriod))
            );
        })
    }
}