import Program from "./Program";

export default class ProgramCollection {
    collection: Array<Program> = new Array<Program>();
    getProgramIdByName = (name: string) : string | undefined=> {
        let program = this.collection.find((program : Program) => program.name === name);
        return program ? program.id : undefined;
    };
    getProgramNameById = (id: string) : string | undefined => {
        let program = this.collection.find((program : Program) => program.id === id);
        return program ? program.name : undefined;
    };
    set(programs : string | Array<Program> = new Array<Program>()) : void {
        if(typeof programs === "string") {
            return;
        }
        this.collection = programs;
    }
}