import * as Promise from 'bluebird';
import ZoomCheck from "./ZoomCheck";
import SlackCheck from "./SlackCheck";
import Active from "./websockets/Active";

setInterval(
    () => Promise.join(
        SlackCheck(),
        ZoomCheck(),
        (isSlackAvailable, isInMeeting) => {
            let programId: string;

            if(isSlackAvailable && isInMeeting) {
                programId = "iYDPEfGzNLkCiHdnG";
            } else if (!isSlackAvailable && isInMeeting) {
                programId = "D2xuondCcLLi2jvMr";
            } else if (isSlackAvailable && !isInMeeting) {
                programId = "9YNBonyhXfyFjpYzJ";
            } else {
                programId = "RFQ83888m35aJfJMZ";
            }

            new Active().post(programId)
                .tap(console.log);
        }
    ),
    1000
);
