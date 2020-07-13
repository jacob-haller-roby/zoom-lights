import dotenv from 'dotenv';
import Promise from 'bluebird';
import moment from 'moment';

import Logger from './classes/Logger';

import ZoomCheck from "./statusChecks/ZoomCheck";
import SlackCheck from "./statusChecks/SlackCheck";
import ActiveProgramWebsocket from "./websockets/ActiveProgramWebsocket";
import ProgramsWebsocket from "./websockets/ProgramsWebsocket";

import ProgramCollection from "./classes/ProgramCollection";
import CachedChecker from "./statusChecks/CachedChecker";
import OutlookCheck from "./statusChecks/OutlookCheck";
import Program from "./classes/Program";
import VarsWebsocket from "./websockets/VarsWebsocket";
import ScheduleItemCollection from "./classes/ScheduleItemCollection";

dotenv.config();


class App {
    activeProgramName: string = "";

    Programs: ProgramCollection = new ProgramCollection();
    getPrograms() : void {
        Logger.log("Getting Programs...");
        new ProgramsWebsocket().get()
            .then(programs => this.Programs.set(programs))
            .catch(() => {
                Logger.log("Retrying programs fetch...");
                this.getPrograms()
            });

    };

    slackCheck: SlackCheck = new SlackCheck();
    zoomCheck: ZoomCheck = new ZoomCheck();
    outlookCheck: OutlookCheck = new OutlookCheck();

    Checkers: Array<CachedChecker> = [
        this.slackCheck,
        this.zoomCheck,
        this.outlookCheck
    ];

    static readonly CheckersReturnTypes: [boolean, boolean, ScheduleItemCollection];

    getData() : Promise<typeof App.CheckersReturnTypes> {
        return <Promise<typeof App.CheckersReturnTypes>> Promise.all(this.Checkers.map(checker => checker.get()));
    }

    pollAndUpdateLoop(timeout: number = 1000) : void {
        setTimeout(
            () => Promise.resolve()
                .then(() => Logger.status("Polling..."))
                .then((): Promise<typeof App.CheckersReturnTypes> => this.getData())
                .then(([isSlackAvailable, isInMeeting, meetings]: typeof App.CheckersReturnTypes) :  Promise<[typeof Program.validName, ScheduleItemCollection]> => {
                    let programNamePromise = this.getNextProgramName(isSlackAvailable, isInMeeting, meetings);
                    return Promise.all([programNamePromise, meetings]);
                })
                .then(([programName, meetings]) : Promise<[boolean, typeof Program.validName, ScheduleItemCollection]> => {
                    let shouldSetProgramPromise = this.checkShouldSetProgram(programName);
                    return Promise.all([shouldSetProgramPromise, programName, meetings]);
                })
                .then(([shouldSetProgramPromise, programName, meetings]): Promise<void> => {
                    if(shouldSetProgramPromise) {
                        return this.setActiveProgram(programName, meetings);
                    }
                    return Promise.resolve();
                })
                .then(() => this.pollAndUpdateLoop())
                .catch((error) => {
                    Logger.error(error);
                    this.pollAndUpdateLoop(10000);
                }),
            timeout
        );
    };

    getNextProgramName(isSlackAvailable: boolean, isInMeeting: boolean, meetings: ScheduleItemCollection): typeof Program.validName {
        if (isInMeeting) {
            //In a meeting. ACAB
            if(this.activeProgramName !== Program.Options.DO_NOT_DISTURB){
                //remove current meetings only when first joining
                meetings && meetings.clearCurrentMeetings();
            }
            return Program.Options.DO_NOT_DISTURB;
        } else if (!isSlackAvailable) {
            //Outside office hours.  Happy light for free time
            return Program.Options.NO_MORE_WORK;
        } else if (meetings.hasMeeting()) {
            //Should be in a meeting!! Hurry up!
            return Program.Options.ACAB;
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

    setActiveProgram(programName: string, meetings: ScheduleItemCollection) : Promise<void> {
        return new ActiveProgramWebsocket().post(this.Programs.getProgramIdByName(programName))
            .then(() => this.activeProgramName = programName)
            .then(() => Logger.success("Successfully changed program to:", programName))
            .then(() : Promise<void> => {
                if (programName === Program.Options.GET_READY) {
                    return this.setGetReadyStartTime(meetings);
                }
                return Promise.resolve();
            })
    }

    setGetReadyStartTime(meetings: ScheduleItemCollection) : Promise<void> {
        let duration : moment.Duration = moment.duration((<moment.Moment>meetings.getNextMeeting().start).diff(moment()));
        let postData = {startTime: duration.as('seconds')};
        Logger.log("Attempting to set start time to:", postData.startTime);
        return new VarsWebsocket().post(postData)
            .then((vars: { startTime: unknown }) => {
                Logger.success("Successfully set start time to:", vars.startTime);
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
