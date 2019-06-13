import { Vector, Point } from "./vectors";
import { Curve } from "./bezier";

interface Fractal<T> {
    get(t: number): T;
    generateTs(iters: number): IterableIterator<number>;
    generatePoints(iters: number): IterableIterator<T>;
}











export {
    Fractal
}
