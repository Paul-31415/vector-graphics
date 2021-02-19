import { Type } from './types';
import { Value } from './values';

interface Program {
    run(input: any, t: Type): Value<any>;
}

export {
    Program
}
