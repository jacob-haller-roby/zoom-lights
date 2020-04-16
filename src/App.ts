import dotenv from 'dotenv';
import Promise from 'bluebird';
import moment from 'moment';

import Logger from './classes/Logger';

import ZoomCheck from "./statusChecks/ZoomCheck";
import SlackCheck from "./statusChecks/SlackCheck";
import Active from "./websockets/Active";
import Programs from "./websockets/Programs";

import ProgramCollection from "./classes/ProgramCollection";
import CachedChecker from "./statusChecks/CachedChecker";
import OutlookCheck from "./statusChecks/OutlookCheck";
import Program from "./classes/Program";
import Vars from "./websockets/Vars";
import ScheduleItemCollection from "./classes/ScheduleItemCollection";
import Slack from "./api/Slack";

dotenv.config();

const noop = () => {};

class App {
    activeProgramName: string = "";

    Programs: ProgramCollection = new ProgramCollection();
    getPrograms() : void {
        Logger.log("Getting Programs...");
        new Programs().get()
            .then(programs => this.Programs.set(programs))
            .catch(() => {
                Logger.log("Retrying programs fetch...");
                this.getPrograms()
            });

    };

    Checkers: Array<CachedChecker> = [
        new SlackCheck(),
        new ZoomCheck(),
        new OutlookCheck()
    ];

    getData() : Array<Promise<any>> {
        return this.Checkers.map(checker => checker.get());
    }

    pollAndUpdateLoop() : void {
        setTimeout(
            () => Promise.resolve()
                .then(() => Logger.status("Polling..."))
                .then(this.setAwayOnWeekends)
                .then(() => Promise.all(this.getData()))
                .then(([isSlackAvailable, isInMeeting, meetings]) :  Promise<[typeof Program.validName, ScheduleItemCollection]> => {
                    let programNamePromise = this.getNextProgramName(isSlackAvailable, isInMeeting, meetings);
                    return Promise.all([programNamePromise, meetings]);
                })
                .then(([programName, meetings]) : Promise<[boolean, typeof Program.validName, ScheduleItemCollection]> => {
                    let shouldSetProgramPromise = this.checkShouldSetProgram(programName);
                    return Promise.all([shouldSetProgramPromise, programName, meetings]);
                })
                .then(([shouldSetProgramPromise, programName, meetings]): Promise<boolean> => {
                    if(shouldSetProgramPromise) {
                        return this.setActiveProgram(programName, meetings);
                    }
                    return Promise.resolve(false);
                })
                .catch((error) => Logger.error(error))
                .finally(() => this.pollAndUpdateLoop()),
            1000
        );
    };

    setAwayOnWeekends() {
        let weekday = moment().isoWeekday();
        // if(weekday > 5) {
            let until: moment.Moment = moment().isoWeekday(8).hour(7).minute(30);
            Slack.setDndStatus(until)
                .then(() => Logger.log("Slack set to away until:", until.toString()));
        // }
    }

    getNextProgramName(isSlackAvailable: boolean, isInMeeting: boolean, meetings: ScheduleItemCollection): typeof Program.validName {
        if (isInMeeting) {
            //In a meeting. ACAB
            if(this.activeProgramName !== Program.Options.ACAB){
                //remove current meetings only when first joining
                meetings.clearCurrentMeetings();
            }
            return Program.Options.ACAB;
        } else if (!isSlackAvailable) {
            //Outside office hours.  Happy light for free time
            return Program.Options.NO_MORE_WORK;
        } else if (meetings.hasMeeting()) {
            //Should be in a meeting!! Hurry up!
            return Program.Options.LATE;
        } else if (meetings.meetingStartingSoon()) {
            //Warning for upcoming meeting...
            return Program.Options.GET_READY;
        } else if (meetings.isBean30()) {
            //Bean 30!
            return Program.Options.BEAN;
        } else {
            //Work hours, but no meetings!
            return Program.Options.CODING_TIME;
        }
    }

    checkShouldSetProgram(programName: typeof Program.validName): Promise<boolean>{
        if (this.activeProgramName === programName) {
            let message = "No Change, keeping: " + programName
            Logger.status(message);
            return Promise.resolve(false);
        }
        if (!this.Programs.hasProgram(programName)) {
            let message = "Program Not Found: " + programName;
            return Promise.reject(message);
        }

        Logger.log("Setting program to: " + programName);

        return Promise.resolve(true);
    }

    setActiveProgram(programName: string, meetings: ScheduleItemCollection) : Promise<boolean> {
        return new Active().post(this.Programs.getProgramIdByName(programName))
            .then(() => this.activeProgramName = programName)
            .then(() => Logger.success("Successfully changed program to:", programName))
            .then(() : Promise<boolean> => {
                if (programName === Program.Options.GET_READY) {
                    return this.setGetReadyStartTime(meetings);
                }
                return Promise.resolve(true);
            })
            .catch((error) => {
                Logger.error(error);
                return false;
            });
    }

    setGetReadyStartTime(meetings: ScheduleItemCollection) : Promise<boolean> {
        let duration : moment.Duration = moment.duration((<moment.Moment>meetings.getNextMeeting().start).diff(moment()));
        let postData = {startTime: duration.as('seconds')};
        Logger.log("Attempting to set start time to:", postData.startTime);
        return new Vars().post(postData)
            .then((vars: { startTime: unknown }) => {
                Logger.success("Successfully set start time to:", vars.startTime);
                return true;
            })
            .catch((error) => {
                Logger.error(error);
                return false;
            });
    }

    start() : Promise<void> {
        return Promise.resolve()
            .then(() => this.getPrograms())
            .then(() => this.pollAndUpdateLoop());

    }

}

let app = new App();
app.start();
