import { Type } from './types';
import { Program } from './program';


class Value<T> implements Program {
    constructor(public val: T, public typ: Type) { }
    run(v: any, t: Type) {
        return this;
    }
}

function number_wr(n: number): Value<number> {
    return new Value<number>(n, new Type("number"));
}



export {
    Value, number_wr,
}
