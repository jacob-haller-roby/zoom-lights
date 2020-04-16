import dotenv from 'dotenv';
import Promise from 'bluebird';

import Logger from './classes/Logger';

import ZoomCheck from "./statusChecks/ZoomCheck";
import SlackCheck from "./statusChecks/SlackCheck";
import Active from "./websockets/Active";
import Programs from "./websockets/Programs";

import ProgramCollection from "./classes/ProgramCollection";
import CachedChecker from "./statusChecks/CachedChecker";
import OutlookCheck from "./statusChecks/OutlookCheck";
import Program from "./classes/Program";

dotenv.config();

class App {
    activeProgramName: string = "";

    Programs: ProgramCollection = new ProgramCollection();
    getPrograms() : void {
        Logger.log("Getting Programs...");
        new Programs().get()
            .then(programs => this.Programs.set(programs));

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
                ([isSlackAvailable, isInMeeting, meetings]) :  typeof Program.Options[keyof typeof Program.Options] => {

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
                .then((programName: typeof Program.Options[keyof typeof Program.Options]) : Promise<string> => {

                    if (this.activeProgramName === programName) {
                        return Promise.resolve("No Change, keeping: " + programName)
                            .tap(Logger.status);
                    }
                    if (!this.Programs.hasProgram(programName)) {
                        return Promise.reject("Program Not Found: " + programName);
                    }
                    let programId: string = this.Programs.getProgramIdByName(programName);

                    Logger.log("Setting program to: " + programName);

                    return new Active().post(programId)
                        .then(() => this.activeProgramName = programName)
                        .then(programName => "Successfully changed program to: " + programName)
                        .tap(Logger.success);
                })
                .catch(Logger.errorStatus)
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
