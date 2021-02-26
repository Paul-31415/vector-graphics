


export interface Curve<T> {
    curve_eval(t: number): T;
    //derivative(): Curve<T>;
}
