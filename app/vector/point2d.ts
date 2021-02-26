import * as PIXI from "pixi.js";
import { Vector } from "./vector";
export function point2d(x = 0, y = 0): Point2d { return new Point2d(new PIXI.Point(x, y)); }
export class Point2d extends Vector<Point2d>{
    constructor(public p: PIXI.Point) { super(); }
    get x(): number { return this.p.x; }
    set x(v: number) { this.p.x = v; }
    get y(): number { return this.p.y; }
    set y(v: number) { this.p.y = v; }
    vec_add(other: Point2d): Point2d {
        return new Point2d(new PIXI.Point(this.x + other.x, this.y + other.y));
    }
    vec_scale(s: number): Point2d {
        return new Point2d(new PIXI.Point(this.x * s, this.y * s));
    }
    vec_copy(): Point2d {
        return new Point2d(new PIXI.Point(this.x, this.y));
    }
    vec_set(other: Point2d): Point2d {
        this.p.copy(other.p); return this;
    }

}
