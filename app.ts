import * as Promise from 'bluebird';
import ZoomCheck from "./ZoomCheck";
import SlackCheck from "./SlackCheck";
import Active from "./websockets/Active";
import Programs from "./websockets/Programs";

class Program {
    id: string;
    name: string;
}

const ProgramNames: Array<Program> = new Array<Program>();

const getProgramIdByName = (name: string) : string => {
    return ProgramNames.find((program : Program) => program.name === name).id;
}

const getProgramNameById = (id: string) : string => {
    return ProgramNames.find((program : Program) => program.id === id).name;
}

const getPrograms = () : Promise => {
    console.log("Getting Programs...");
    return new Programs().get()
        .tap(programs => {
            console.log("Programs retrieved");
            console.log(programs);
            ProgramNames.push(...programs);
        });
}

const pollAndUpdateLoop = () : void  => {
    console.log("Polling...");
    let id : number = <any>setTimeout(
        () => Promise.join(
            SlackCheck(),
            ZoomCheck(),
            (isSlackAvailable, isInMeeting) => {
                let programId: string;

                if(isSlackAvailable && isInMeeting) {
                    programId = getProgramIdByName("ACAB");
                } else if (!isSlackAvailable && isInMeeting) {
                    programId = getProgramIdByName("opposites");
                } else if (isSlackAvailable && !isInMeeting) {
                    programId = getProgramIdByName("spin cycle");
                } else {
                    programId = getProgramIdByName("rainbow fonts");
                }

                return new Active().post(programId)
                    .tap(programId => console.log("Program successfull set to: " + getProgramNameById(programId)));

            }
        )
            .finally(pollAndUpdateLoop),
        1000
    );

}

Promise.resolve()
    .then(getPrograms)
    .then(pollAndUpdateLoop)


