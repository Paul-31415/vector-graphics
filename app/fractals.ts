import { Vector, Point } from "./vectors";
import { Curve } from "./bezier";
import { Saveable } from "./save";

interface Fractal<T> extends Saveable {
    get(t: number): T;
    generateTs(iters: number): IterableIterator<number>;
    generatePoints(iters: number): IterableIterator<T>;
}











export {
    Fractal
}
