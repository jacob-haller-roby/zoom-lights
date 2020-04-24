enum ProgramOptions {
    ACAB = "ACAB",
    NO_MORE_WORK = "fast pulse",
    GET_READY = "get ready",
    BEAN = "fast pulse",
    CODING_TIME = "coding time",
    DO_NOT_DISTURB = "Do Not Disturb"
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