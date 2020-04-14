import * as Promise from 'bluebird';
import * as moment from 'moment';
import ZoomCheck from "./statusChecks/ZoomCheck";
import SlackCheck from "./statusChecks/SlackCheck";
import Active from "./websockets/Active";
import Programs from "./websockets/Programs";

import ProgramCollection from "./classes/ProgramCollection";
import CachedChecker from "./statusChecks/CachedChecker";
import OutlookCheck from "./statusChecks/OutlookCheck";
import ScheduleItemCollection from "./classes/ScheduleItemCollection";

class App {
    activeProgramId: string;

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

    getData() : Array<Promise> {
        return this.Checkers.map(checker => checker.get());
    }

    pollAndUpdateLoop() : void {
        console.log("Polling...");
        setTimeout(
            () => Promise.join(...this.getData(),
                (isSlackAvailable: boolean, isInMeeting: boolean, meetings: ScheduleItemCollection) : string => {
                    if (!isSlackAvailable) {
                        //Outside office hours.  Happy light for free time
                        return "No More Work";
                    } else if (isInMeeting) {
                        //In a meeting.  ACAB
                        return "ACAB";
                    } else if (meetings.hasMeeting()) {
                        //Should be in a meeting!! Hurry up!
                        return "LATE";
                    } else if (meetings.meetingStartingSoon()) {
                        //Warning for upcoming meeting...
                        return "Get Ready";
                    } else {
                        //Work hours, but no meetings!
                        return "Coding Time";
                    }
                })
                .then((programName: string) : Promise => {
                    let programId: string = this.Programs.getProgramIdByName(programName);

                    if (this.activeProgramId === programId) {
                        return Promise.resolve();
                    }

                    return new Active().post(programId)
                        .tap(programId => console.log("Program successfully set to: " + this.Programs.getProgramNameById(programId)))
                        .tap(programId => this.activeProgramId = programId);
                })
                .finally(() => this.pollAndUpdateLoop()),
            1000
        );
    };

    start() : Promise {
        return Promise.resolve()
            .then(() => this.getPrograms())
            .then(() => this.pollAndUpdateLoop());

    }

}

let app = new App();
app.start();
