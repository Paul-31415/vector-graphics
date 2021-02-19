type Class = { new(...args: any[]): any; };
class Base { };

function LinearTransformation<C extends Class>(toExtend: C) {

    return class extends toExtend {
        constructor(...args: any[]) {
            super(...args)
        }
        transform() {
            return "doo dee doo";
        }
    }
}

function Vector<C extends Class>(toExtend: C) {

    return class extends toExtend {
        constructor(...args: any[]) {
            super(...args)
        }
        multiply() {
            return 42;
        }
    }
}





const Matrix = class extends Vector(LinearTransformation(Base)) {

    constructor() {
        super();
    }
    bla() {
        return this.multiply() + this.transform();
    }


}



export {
    Base, Class
}
