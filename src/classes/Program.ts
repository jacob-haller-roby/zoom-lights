enum ProgramOptions {
    ACAB = "ACAB",
    LATE = "Late",
    NO_MORE_WORK = "fast pulse",
    GET_READY = "get ready",
    BEAN = "fast pulse",
    CODING_TIME = "coding time"
}

interface Program {
    id: string;
    name: string;
}
class Program {
    static readonly Options = ProgramOptions;
    static readonly validName: typeof Program.Options[keyof typeof Program.Options];
}

export default Program;