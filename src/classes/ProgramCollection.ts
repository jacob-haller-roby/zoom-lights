import Program from "./Program";

export default class ProgramCollection {
    collection: Array<Program> = new Array<Program>();
    getProgramIdByName = (name: string) : string => {
        let program = this.collection.find((program : Program) => program.name === name);
        if(program === undefined) {
            throw new Error("No program with name = " + name);
        }
        return program.id;
    };
    getProgramNameById = (id: string) : string => {
        let program = this.collection.find((program : Program) => program.id === id);
        if(program === undefined) {
            throw new Error("No program with id = " + id);
        }
        return program.name;
    };
    set(programs : string | Array<Program> = new Array<Program>()) : void {
        if(typeof programs === "string") {
            return;
        }
        this.collection = programs;
    }
    hasProgram(name: string) {
        return this.collection.some(program => program.name === name);
    }
}