import dotenv from 'dotenv';
import Promise from 'bluebird';
import ZoomCheck from "./statusChecks/ZoomCheck";
import SlackCheck from "./statusChecks/SlackCheck";
import Active from "./websockets/Active";
import Programs from "./websockets/Programs";

import ProgramCollection from "./classes/ProgramCollection";
import CachedChecker from "./statusChecks/CachedChecker";
import OutlookCheck from "./statusChecks/OutlookCheck";

dotenv.config();

class App {
    activeProgramId: string = "";

    Programs: ProgramCollection = new ProgramCollection();
    getPrograms() : void {
        console.log("Getting Programs...");
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
        console.log("Polling...");
        setTimeout(
            () => Promise.all(this.getData())
                .then(
                ([isSlackAvailable, isInMeeting, meetings]) : string => {
                    if (!isSlackAvailable) {
                        //Outside office hours.  Happy light for free time
                        return "No More Work";
                    } else if (isInMeeting) {
                        //In a meeting. ACAB
                        meetings.clearCurrentMeetings();
                        return "ACAB";
                    } else if (meetings.hasMeeting()) {
                        //Should be in a meeting!! Hurry up!
                        return "LATE";
                    } else if (meetings.meetingStartingSoon()) {
                        //Warning for upcoming meeting...
                        return "Get Ready";
                    } else if (meetings.isBean30()) {
                        //Bean 30!
                        return "BEAN";
                    } else {
                        //Work hours, but no meetings!
                        return "Coding Time";
                    }
                })
                .then((programName: string) : Promise<string> => {
                    console.debug(programName)
                    let programId: string | undefined = this.Programs.getProgramIdByName(programName);

                    if (this.activeProgramId === programId || programId === undefined) {
                        return Promise.resolve("No Change");
                    }

                    console.log("Setting program to: " + programName);

                    return new Active().post(programId)
                        .tap(programId => console.log("Program successfully set to: " + this.Programs.getProgramNameById(programId)))
                        .tap(programId => this.activeProgramId = programId);
                })
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
