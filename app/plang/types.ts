class Type {
    constructor(public name: string, public children: Array<Type> = []) { }
    equals(o: Type): boolean {
        if (this === o) { return true; }
        if (this.name != o.name) { return false; }
        if (this.children === o.children) { return true; }
        if (this.children.length != o.children.length) { return false; }
        for (let ci in this.children) {
            if (!this.children[ci].equals(o.children[ci])) {
                return false;
            }
        }
        return true;
    }

}


const t_number = new Type("number");
const t_boolean = new Type("boolean");
const t_string = new Type("string");


export {
    Type,
    t_number, t_boolean, t_string
}

