enum ProgramOptions {
    ACAB = "ACAB",
    LATE = "Late",
    NO_MORE_WORK = "No more work",
    GET_READY = "get ready",
    BEAN = "bean",
    CODING_TIME = "coding time"
}

interface Program {
    id: string;
    name: string;
}

class Program {
    static readonly Options = ProgramOptions;
}

export default Program;