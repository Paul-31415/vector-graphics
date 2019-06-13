import * as PIXI from "pixi.js";
import { Point } from "./vectors";
import { Transform } from "./transform";


interface Drawable {
    draw(t: Transform<Point, Point> | null): Graphic;
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics;
}

class Graphic extends PIXI.Sprite {
    constructor(public drawer: Drawable, g: any) {
        super(g);
    }
}

export {
    Drawable, Graphic
}
