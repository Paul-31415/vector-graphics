import * as UUID from "uuid/v4";


const threadDenominator = 100;
var threadi = 0;
const threadFunc = function(f: any, ...args: any[]): void {
    if ((threadi = (threadi + 1) % threadDenominator) == 0) {
        setImmediate(f, ...args);
    } else {
        f(...args);
    }
}



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

class NegatedSet<T> extends Set<T>{
    constructor(a: Array<T> = []) {
        super(a);
    }
    add(value: T): this {
        super.delete(value);
        return this;
    }
    has(value: T): boolean {
        return !super.has(value);
    }
    fill(): void {
        return super.clear();
    }
    delete(value: T): boolean {
        const r = super.has(value);
        super.add(value);
        return !r;
    }
    get size(): number {
        return -super.size;
    }
}





interface Saveable {
    _saveIgnore?: Set<string>;
    _saveSpecial?: (n: BiMap<string, any | Saveable>) => WrappedObject;
    _loadSpecial?: () => this;
    _saveName?: string;
}


namespace Saveable {
    //https://stackoverflow.com/questions/47082026/typescript-get-all-implementations-of-interface
    type Constructor<T> = {
        new(...args: any[]): T;
        readonly prototype: T;
    }
    const implementations: Constructor<Saveable>[] = [];
    export function GetImplementations(): Constructor<Saveable>[] {
        return implementations;
    }
    export function register<T extends Constructor<Saveable>>(ctor: T) {
        implementations.push(ctor);
        return ctor;
    }

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
    if (o._saveIgnore != null) {
        return (o as Saveable)._saveIgnore.has(k);
    }
    return false;
}

function Constructor<T>(o: Object): T {
    return (o as T);
}

//https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class

class WrappedObject {
    O/*bject*/?: { [index: string]: WrappedObject | any };
    T/*ype*/?: string;
    constructor(public N/*ame*/: string, o: null | { [index: string]: WrappedObject | any } = null, t: string = null) { if (o != null) { this.O/*bject*/ = o; } if (t != null) { this.T/*ype*/ = t; } }
}

function getlowEntropyUUIDFunc(): () => string {
    let lowEntropyUUID_value = 0;
    function lowEntropyUUID(): string {
        return "" + (lowEntropyUUID_value++);
    }
    return lowEntropyUUID;
}

var lowEntropy = true;
var concise = true;
//on a test canvas with some brushed curves, (lower % is better) Retained size: 25,328 (I think I can bring this down by optionalizing some WrappedObject parameters)
// sizes: uncomp'd|compressed | gzip --best
// UUID : 35,099  | 8,003     | 7,758
// lowE : 25,925  | 2,189     | 1,938
// • raw size went to 74%
// • standard zip compression ratio went from 23% to 8.4%
// • compressed size went to 27%
//
// gzip --best
// • ratio went from 22% to 7.5%
// • compressed size went to 25%
//
//
// with smaller WrappedObject: 25,681 -> 1,926 gzip --best
// with that and conciseUUID : 15,608 -> 1,728 gzip --best
//
// with tiny names and conciseUUID: 12,590 -> 1,692 (saves 32 bytes compressed, ~3kb uncompressed)
// with ids reset before (so compressed size is actually accurate): 1,685 (other estimate was 7 bytes off)
//
//
// low entropy is very good for file size and compression
//
// maybe I should make my own compression algorithm specific to this dataset
//
//
// 

function getUUIDfunction(): (o: any | Saveable) => string {
    var u: () => string = UUID;
    if (lowEntropy) {
        u = getlowEntropyUUIDFunc();
    }
    function getUUIDVerbose(o: any | Saveable): string {
        if (o.constructor != null) {
            return o.constructor.name + " instance named:" + o._saveName + " id:" + u();
        } else {
            return "unknown instance id:" + u();
        }
    }

    function getUUIDConcise(o: any | Saveable): string {
        return u();
    }

    if (concise) {
        return getUUIDConcise;
    } else {
        return getUUIDVerbose;
    }
}


class TreeProgressBar {
    numerators: number[];
    denominators: number[];
    constructor() { this.numerators = [0]; this.denominators = [1]; }
    getProgress(): number {
        var d = 1;
        var p = 0;
        for (var i = 0; i < this.numerators.length; i++) {
            if (this.denominators[i] != 0) {
                d *= this.denominators[i];
                p += this.numerators[i] / d;
            }
        }
        return p;
    }
    addSub(d: number): void {
        this.numerators.push(0);
        this.denominators.push(d);
    }
    remSub(): void {
        this.numerators.pop();
        this.denominators.pop();
    }
    get numerator(): number {
        return this.numerators[this.numerators.length - 1];
    }
    set numerator(n: number) {
        this.numerators[this.numerators.length - 1] = n;
    }
    get denominator(): number {
        return this.denominators[this.denominators.length - 1];
    }
    set denominator(n: number) {
        this.denominators[this.denominators.length - 1] = n;
    }
}



function convertToJSONable(o: any | Saveable,
    progBar = new TreeProgressBar(),
    names = new BiMap<string, any | Saveable>(),
    types = new Map<string, any>(),
    uuidFunc = getUUIDfunction(),

): WrappedObject {
    if (names.hasVal(o)) {
        return new WrappedObject(names.getKey(o));
    } else {
        if (o == null) {
            return o;
        }

        if ((o as Saveable)._saveSpecial != null) {
            return (o as Saveable)._saveSpecial(names);
        }
        const uuid = uuidFunc(o);
        names.set(uuid, o);


        var obj = {};
        var ito = o;
        //exceptions:
        if (Array.isArray(o)) {
            obj = [];
        } else if (o instanceof Map) {
            ito = Array.from(o.entries());
            obj = [];
        } else if (o instanceof Set) {
            ito = Array.from(o);
            obj = [];
        }



        var name = "unknown type id:" + UUID();
        if (o.constructor != null) {
            name = "" + o.constructor.name;
        }


        const wo = new WrappedObject(uuid, obj, name);
        types.set(name, o.__proto__);


        //progress bar
        progBar.addSub(0);
        for (var i in ito) {
            progBar.denominator++;
        }

        for (var i in ito) {
            if ((typeof ito[i]) == "object") {
                if (!isIgnored(o, i)) {
                    wo.O/*bject*/[i] = convertToJSONable(ito[i], progBar, names, types, uuidFunc);
                }
            } else {
                wo.O/*bject*/[i] = ito[i];
            }
            progBar.numerator++;
        }
        progBar.remSub();
        return wo;
    }
}

function asyncConvertToJSONable(o: any | Saveable,
    progBar = new TreeProgressBar(),
    names = new BiMap<string, any | Saveable>(),
    types = new Map<string, any>(),
    uuidFunc = getUUIDfunction(),
    cont: (o: any) => void,
): void {
    if (names.hasVal(o)) {
        threadFunc(cont, new WrappedObject(names.getKey(o)));
        return;
    } else {
        if (o == null) {
            threadFunc(cont, o);
            return;
        }

        if ((o as Saveable)._saveSpecial != null) {
            threadFunc(cont, (o as Saveable)._saveSpecial(names));
            return;
        }
        const uuid = uuidFunc(o);
        names.set(uuid, o);


        var obj = {};
        var ito = o;
        //exceptions:
        if (Array.isArray(o)) {
            obj = [];
        } else if (o instanceof Map) {
            ito = Array.from(o.entries());
            obj = [];
        } else if (o instanceof Set) {
            ito = Array.from(o);
            obj = [];
        }



        var name = "unknown type id:" + UUID();
        if (o.constructor != null) {
            name = "" + o.constructor.name;
        }


        const wo = new WrappedObject(uuid, obj, name);
        types.set(name, o.__proto__);


        //progress bar
        progBar.addSub(0);
        const keys: string[] = [];
        for (var i in ito) {
            keys.push(i);
        }
        progBar.denominator = keys.length;
        /*if (progBar.denominator == 0) {
            debugger;
        }*/
        var indx = 0;
        const iterstep = function(cont: (o: any) => void): void {
            if (indx < keys.length) {
                const i = keys[indx];
                indx++;
                if ((typeof ito[i]) == "object") {
                    if (!isIgnored(o, i)) {
                        const setandcont = function(res: any): void {
                            wo.O/*bject*/[i] = res;
                            iterstep(cont);
                        }
                        threadFunc(asyncConvertToJSONable, ito[i], progBar, names, types, uuidFunc, setandcont);
                        return;
                    }
                } else {
                    wo.O/*bject*/[i] = ito[i];
                    progBar.numerator++;

                    threadFunc(iterstep, cont);
                    return;
                }
            } else {
                progBar.remSub();
                threadFunc(cont, wo);
                return;
            }
        }
        threadFunc(iterstep, cont);
    }
}







class UnresolvedReference {
    _____isUnresolvedReference = true;
    constructor(public name: string, public nameSpace: Map<string, any | Saveable>, public referers: { o: any, n: string }[] = []) { }
    addReferer(o: any, n: string): void {
        this.referers.push({ o: o, n: n });
    }
    tryResolve(): boolean {
        if (this.nameSpace.has(this.name)) {
            const r = this.nameSpace.get(this.name);
            for (var i in this.referers) {
                this.referers[i].o[this.referers[i].n] = r;
            }
            return true;
        }
        return false;
    }
}

function convertFromJSONable(o: WrappedObject,
    progBar = new TreeProgressBar(),
    names = new Map<string, any | Saveable>(),
    types = new Map<string, any>(),
    unresolvedRefs = new Set<UnresolvedReference>(),
    throwOnUnknownTypes = false,
    localObj = {},
    localName = "",

): any | Saveable {

    if (o == null) {
        return o;
    }
    if (o.O/*bject*/ == null) {
        //it's a reference
        if (names.has(o.N/*ame*/)) {
            const r = names.get(o.N/*ame*/);
            if ((r as UnresolvedReference)._____isUnresolvedReference == true) {
                r.addReferer(localObj, localName);
            }
            return r;
        } else {
            //delay this dereference
            const ur = new UnresolvedReference(o.N/*ame*/, names);
            ur.addReferer(localObj, localName);
            unresolvedRefs.add(ur);
            names.set(o.N/*ame*/, ur);
            return ur;
        }
    } else {
        if (!types.has(o.T/*ype*/)) {
            if (throwOnUnknownTypes) {
                throw new Error("Encountered unknown type:" + o.T/*ype*/);
            }
        }
        var ro: any = { __proto__: types.get(o.T/*ype*/) };

        //exceptions
        if (o.T/*ype*/ == "Array" || o.T/*ype*/ == "Map" || o.T/*ype*/ == "Set") {
            ro = [];
        }

        //progress bar
        progBar.addSub(0);
        for (var i in o.O/*bject*/) {
            progBar.denominator++;
        }

        for (var i in o.O/*bject*/) {
            if ((typeof o.O/*bject*/[i]) == "object") {
                ro[i] = convertFromJSONable(o.O/*bject*/[i], progBar, names, types, unresolvedRefs, throwOnUnknownTypes, ro, i);
            } else {
                ro[i] = o.O/*bject*/[i];
            }
            progBar.numerator++;
        }
        progBar.remSub();

        //exceptions
        if (o.T/*ype*/ == "Map") {
            ro = new Map(ro);
        } else if (o.T/*ype*/ == "Set") {
            ro = new Set(ro);
        }


        //finalize object
        if ((ro as Saveable)._loadSpecial != null) {
            ro = (ro as Saveable)._loadSpecial();
        }

        if (names.has(o.N/*ame*/)) {
            const r: any = names.get(o.N/*ame*/);
            names.delete(o.N/*ame*/);
            if ((r as UnresolvedReference)._____isUnresolvedReference == true) {
                names.set(o.N/*ame*/, ro);
                if (!(r as UnresolvedReference).tryResolve()) {
                    throw new Error("UnresolvedReference had wrong name or namespace.");
                }
                unresolvedRefs.delete((r as UnresolvedReference));
                return ro;
            }
        }
        names.set(o.N/*ame*/, ro);
        return ro;
    }
}

function asyncConvertFromJSONable(o: WrappedObject,
    pros: AsyncTreeProcess<any | Saveable>,
    names = new Map<string, any | Saveable>(),
    types = new Map<string, any>(),
    unresolvedRefs = new Set<UnresolvedReference>(),
    throwOnUnknownTypes = false, cont: (o: any) => void,
    localObj = {},
    localName = "",

): void {
    const progBar = pros.progress;
    if (o == null) {
        threadFunc(cont, o);
        return;
    }
    if (o.O/*bject*/ == null) {
        //it's a reference
        if (names.has(o.N/*ame*/)) {
            const r = names.get(o.N/*ame*/);
            if ((r as UnresolvedReference)._____isUnresolvedReference == true) {
                r.addReferer(localObj, localName);
            }
            threadFunc(cont, r);
            return;
        } else {
            //delay this dereference
            const ur = new UnresolvedReference(o.N/*ame*/, names);
            ur.addReferer(localObj, localName);
            unresolvedRefs.add(ur);
            names.set(o.N/*ame*/, ur);
            threadFunc(cont, ur);
            return;
        }
    } else {
        if (!types.has(o.T/*ype*/)) {
            if (throwOnUnknownTypes) {
                pros.throw(new Error("Encountered unknown type:" + o.T/*ype*/));
                return;
            }
        }
        var ro: any = { __proto__: types.get(o.T/*ype*/) };

        //exceptions
        if (o.T/*ype*/ == "Array" || o.T/*ype*/ == "Map" || o.T/*ype*/ == "Set") {
            ro = [];
        }

        //progress bar
        progBar.addSub(0);
        const keys: string[] = [];
        for (var i in o.O/*bject*/) {
            progBar.denominator++;
            keys.push(i);
        }

        var indx = 0;
        const loopStep = function(cont: (o: any) => void): void {
            if (indx < keys.length) {
                const i = keys[indx];
                indx++;
                if ((typeof o.O/*bject*/[i]) == "object") {
                    const conti = function(o: any): void {
                        ro[i] = o;
                        progBar.numerator++;
                        loopStep(cont);
                        return;
                    }

                    threadFunc(asyncConvertFromJSONable, o.O/*bject*/[i], pros, names, types, unresolvedRefs, throwOnUnknownTypes, conti, ro, i);
                } else {
                    ro[i] = o.O/*bject*/[i];
                    progBar.numerator++;
                    threadFunc(loopStep, cont);
                    return;
                }

            } else {

                progBar.remSub();

                //exceptions
                if (o.T/*ype*/ == "Map") {
                    ro = new Map(ro);
                } else if (o.T/*ype*/ == "Set") {
                    ro = new Set(ro);
                }


                //finalize object
                if ((ro as Saveable)._loadSpecial != null) {
                    ro = (ro as Saveable)._loadSpecial();
                }

                if (names.has(o.N/*ame*/)) {
                    const r: any = names.get(o.N/*ame*/);
                    names.delete(o.N/*ame*/);
                    if ((r as UnresolvedReference)._____isUnresolvedReference == true) {
                        names.set(o.N/*ame*/, ro);
                        if (!(r as UnresolvedReference).tryResolve()) {
                            throw new Error("UnresolvedReference had wrong name or namespace.");
                        }
                        unresolvedRefs.delete((r as UnresolvedReference));
                        threadFunc(cont, ro);
                        return;
                    }
                }
                names.set(o.N/*ame*/, ro);
                threadFunc(cont, ro);
                return;
            }
        }
        threadFunc(loopStep, cont);
        return;
    }
}
class functionWrapper {
    //for wrapping functions for hacky saveing of unsaveable types
    code: string;
    constructor(f: any /* is function, but I'm not doing typescript-friendly stuff here */) { this.code = f.toString(); }
    toFunction(): any {
        const func = eval("(" + this.code + ")");
        return func;
    }
}



class AsyncTreeProcess<T>{
    done = false;
    failed = false;
    error: Error;
    result: T;
    constructor(public progress: TreeProgressBar) { }
    set(r: T) {
        this.result = r;
        this.done = true;
    }
    throw(e: Error) {
        this.error = e;
        this.failed = true;
    }
}

function getSaveableTypes(): Map<string, any> {
    const prims: Array<any> = [Array, Map, Set];
    const types = new Map<string, any>();

    for (var i in prims) {
        types.set(prims[i].name, prims[i].prototype);
    }

    const saveables = Saveable.GetImplementations();
    for (var x = 0; x < saveables.length; x++) {
        types.set(saveables[x].name, saveables[x].prototype);
    }

    return types;
}


function save(o: any | Saveable, pbar = new TreeProgressBar(), names = new BiMap<string, any | Saveable>()): string {
    const types = new Map<string, any>();
    const jsonable = convertToJSONable(o, pbar, names, types);
    //const jsonableTypes = {};
    //const outObj = { o: jsonable, t: jsonableTypes };

    return JSON.stringify(jsonable);
}
function nop(): void { }

function asyncSave(o: any | Saveable, names = new BiMap<string, any | Saveable>(), cb: (p: AsyncTreeProcess<string>) => void = (p: AsyncTreeProcess<string>) => nop()): AsyncTreeProcess<string> {
    const pros = new AsyncTreeProcess<string>(new TreeProgressBar());
    const ret = function(o: any): void {
        pros.set(JSON.stringify(o));
        cb(pros);
    }
    const types = new Map<string, any>();

    threadFunc(asyncConvertToJSONable, o, pros.progress, names, types, getUUIDfunction(), ret);
    return pros;
}



function load(s: string, pbar = new TreeProgressBar(), names = new Map<string, any | Saveable>(), types = getSaveableTypes(), unresolvedRefs = new Set<UnresolvedReference>()): any | Saveable {
    const inObj = JSON.parse(s);



    return convertFromJSONable(inObj, pbar, names, types, unresolvedRefs);
}

function asyncLoad(s: string, names = new Map<string, any | Saveable>(), types = getSaveableTypes(), unresolvedRefs = new Set<UnresolvedReference>(), cb: (p: AsyncTreeProcess<any | Saveable>) => void = (p: AsyncTreeProcess<any | Saveable>) => nop()): AsyncTreeProcess<any | Saveable> {
    const inObj = JSON.parse(s);
    const pros = new AsyncTreeProcess<any | Saveable>(new TreeProgressBar());
    const ret = function(o: any): void {
        pros.set(o);
        cb(pros);
    }
    threadFunc(asyncConvertFromJSONable, inObj, pros, names, types, unresolvedRefs, false, ret);

    return pros;
}


import { dialog } from "electron";
import * as fs from 'fs';
import { fail } from "assert";

function copyStringToClipboard(str: string): void {
    //https://techoverflow.net/2018/03/30/copying-strings-to-the-clipboard-using-pure-javascript/
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';

    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);
}


function download(filename: string, text: string) {
    fs.writeFile(filename, text, function(err: Error) {
        if (err) {
            return console.error(err);
        }
        console.log("File created!");
    });
    //copyStringToClipboard(text);
    //alert("file copied to clipboard\nsize:" + text.length + "\n" + text.substr(0, 12) + "...");

	/*
    function callback(name: string): void {
        if (name == undefined) {
            return;
        }
        fs.writeFileSync(name, text, 'utf-8');
        console.log("saved");
    }
    dialog.showSaveDialog({ title: "save file", }, callback);
	*/

}


export {
    save, load,
    asyncSave,
    asyncLoad,


    Saveable
    , download,
    NegatedSet
    , TreeProgressBar
    , AsyncTreeProcess
    , BiMap
}
