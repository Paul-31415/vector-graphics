import * as PIXI from "pixi.js";
import { Point } from "./vectors";
import { Transform } from "./transform";
import { Saveable } from "./save";



interface Drawable extends Saveable {
    draw(t: Transform<Point, Point> | null): Graphic;
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics;
}

@Saveable.register
class Graphic extends PIXI.Sprite implements Saveable {
    _saveName?: string;
    constructor(public drawer: Drawable, g: any) {
        super(g);
    }
}





export {
    Drawable, Graphic
}
