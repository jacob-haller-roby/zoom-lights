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

dotenv.config();

const noop = () => {};

class App {
    activeProgramName: string = "";

    Programs: ProgramCollection = new ProgramCollection();
    getPrograms() : void {
        Logger.log("Getting Programs...");
        new Programs().get()
            .then(programs => this.Programs.set(programs))
            .catch(noop);

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
                .then(() => Promise.all(this.getData()))
                .then(
                ([isSlackAvailable, isInMeeting, meetings]) :  Promise<void> => {
                    return Promise.resolve()
                        .then(() : typeof Program.Options[keyof typeof Program.Options] => {
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
                        })
                        .then((programName: typeof Program.Options[keyof typeof Program.Options]) : Promise<typeof Program.Options[keyof typeof Program.Options]> => {

                            if (this.activeProgramName === programName) {
                                let message = "No Change, keeping: " + programName
                                Logger.status(message);
                                return Promise.reject(message);
                            }
                            if (!this.Programs.hasProgram(programName)) {
                                let message = "Program Not Found: " + programName;
                                Logger.errorStatus(message);
                                return Promise.reject(message);
                            }

                            Logger.log("Setting program to: " + programName);

                            return Promise.resolve(programName);
                        })
                        .then((programName: typeof Program.Options[keyof typeof Program.Options]) : Promise<void> => {
                            return new Active().post(this.Programs.getProgramIdByName(programName))
                                .then(() => this.activeProgramName = programName)
                                .then(() => Logger.success("Successfully changed program to:", programName))
                                .then(() => new Promise((resolve, reject) => {
                                    setTimeout(resolve, 2000);
                                }))
                                .then(() : Promise<void> => {
                                    if (programName === Program.Options.GET_READY) {
                                        let duration : moment.Duration = moment.duration(meetings.getNextMeeting().start.diff(moment()));
                                        let postData = {startTime: duration.as('seconds')};
                                        Logger.log("Attempting to set start time to:", postData.startTime, "from", duration);
                                        return new Vars().post(postData)
                                            .then((vars: { startTime: unknown }) => {
                                                Logger.success("Successfully set start time to:", vars.startTime)
                                            });
                                    }
                                    return Promise.resolve();
                                })
                                .catch((error) => Logger.error(error));
                        })

                })
                .catch(() => {})
                .finally(() => this.pollAndUpdateLoop()),
            1000
        );
    };

    start() : Promise<void> {
        return Promise.resolve()
            .then(() => this.getPrograms())
            .then(() => this.pollAndUpdateLoop());

    }

}

let app = new App();
app.start();
