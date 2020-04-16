enum ProgramOptions {
    ACAB = "ACAB",
    LATE = "Late",
    NO_MORE_WORK = "fast pulse",
    GET_READY = "get ready",
    BEAN = "fast pulse",
    CODING_TIME = "coding time"
}
type optionType  = typeof Program.Options[keyof typeof Program.Options];

interface Program {
    id: string;
    name: string;
}
class Program {
    static readonly Options = ProgramOptions;
    static readonly validName: optionType;
}

export default Program;