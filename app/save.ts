import * as UUID from "uuid/v4";


//https://mariusschulz.com/blog/typescript-2-2-mixin-classes
/*
type Constructor<T = {}> = new (...args: any[]) => T;

function Saveable<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        toJSON(): string {

            return "foo";
        }

    };
}*/
interface Saveable {
    saveIgnore?: Set<string>;
    saveSpecial?: (n: BiMap<string, any | Saveable>) => string;
}


class BiMap<A, B>{
    f: Map<A, B>;
    b: Map<B, A>;
    constructor() {
        this.f = new Map<A, B>();
        this.b = new Map<B, A>();
    }

    set(k: A, v: B): BiMap<A, B> {
        //undefined behaviour if you map 2 keys to the same value
        this.f.set(k, v);
        this.b.set(v, k);
        return this;
    }
    get(k: A): B {
        return this.f.get(k);
    }
    getKey(v: B): A {
        return this.b.get(v);
    }
    has(k: A): boolean {
        return this.f.has(k);
    }
    hasVal(v: B): boolean {
        return this.b.has(v);
    }
    delete(k: A): boolean {
        if (this.has(k)) {
            const v = this.f.get(k);
            this.f.delete(k);
            this.b.delete(v);
            return true;
        } else {
            return false;
        }
    }
    deleteVal(v: B): boolean {
        if (this.hasVal(v)) {
            const k = this.b.get(v);
            this.f.delete(k);
            this.b.delete(v);
            return true;
        } else {
            return false;
        }
    }
    size(): number {
        return (this.f.size);
    }
}


function isIgnored(o: any | Saveable, k: string): boolean {
    if (o.saveIgnore != null) {
        return (o as Saveable).saveIgnore.has(k);
    }
    return false;
}

class NamespaceReference {
    constructor(public name: string) { }
}

function Constructor<T>(o: Object): T {
    return (o as T);
}

//https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class




function save(o: any | Saveable, names = new BiMap<string, any | Saveable>()): string {
    if (o.saveSpecial != null) {
        return (o as Saveable).saveSpecial(names);
    }
    const keys = Object.keys(o);
    const proto = o.__proto__;





}
