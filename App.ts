import * as Promise from 'bluebird';
import ZoomCheck from "./statusChecks/ZoomCheck";
import SlackCheck from "./statusChecks/SlackCheck";
import Active from "./websockets/Active";
import Programs from "./websockets/Programs";

import ProgramCollection from "./classes/ProgramCollection";
import CachedChecker from "./statusChecks/CachedChecker";

class App {
    Programs: ProgramCollection = new ProgramCollection();
    getPrograms() : void {
        console.log("Getting Programs...");
        new Programs().get()
            .then(programs => this.Programs.set(programs));

    };

    Checkers: Array<CachedChecker> = [
        new SlackCheck(),
        new ZoomCheck()
    ];

    getData() : Array<Promise> {
        return this.Checkers.map(checker => checker.get());
    }

    pollAndUpdateLoop() : void {
        console.log("Polling...");
        setTimeout(
            () => Promise.join(...this.getData(),
                (isSlackAvailable, isInMeeting) => {
                    let programId: string;

                    if(isSlackAvailable && isInMeeting) {
                        programId = this.Programs.getProgramIdByName("ACAB");
                    } else if (!isSlackAvailable && isInMeeting) {
                        programId = this.Programs.getProgramIdByName("opposites");
                    } else if (isSlackAvailable && !isInMeeting) {
                        programId = this.Programs.getProgramIdByName("spin cycle");
                    } else {
                        programId = this.Programs.getProgramIdByName("rainbow fonts");
                    }

                    return new Active().post(programId)
                        .tap(programId => console.log("Program successfully set to: " + this.Programs.getProgramNameById(programId)));

                }
            )
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
