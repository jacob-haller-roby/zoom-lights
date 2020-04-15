import * as moment from 'moment';

interface ScheduleItemDate {
    dateTime: string,
    timeZone: 'UTC'
}
const isScheduleItemDate = (object: any): object is ScheduleItemDate => {
    return "dateTime" in object;
};

interface ScheduleItem {
    isPrivate: boolean;
    status: string;
    subject: string;
    location: string;
    start: moment.Moment | ScheduleItemDate;
    end: moment.Moment | ScheduleItemDate;
}

class ScheduleItem {
    constructor(scheduleItem: ScheduleItem) {
        this.isPrivate = scheduleItem.isPrivate;
        this.status = scheduleItem.status;
        this.subject = scheduleItem.subject;
        this.location = scheduleItem.location;

        if(isScheduleItemDate(scheduleItem.start)) {
            this.start = moment.utc(scheduleItem.start.dateTime);
        } else {
            this.start = scheduleItem.start;
        }

        if(isScheduleItemDate(scheduleItem.end)) {
            this.end = moment.utc(scheduleItem.end.dateTime);
        } else {
            this.end = scheduleItem.end;
        }
    }
}

export default ScheduleItem;