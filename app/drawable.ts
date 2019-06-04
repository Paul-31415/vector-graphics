import * as PIXI from "pixi.js";
import { Point } from "./vectors";
import { PtTransform } from "./transform";

interface Drawable {
    draw(t: PtTransform): PIXI.Graphics;
    drawOn(t: PtTransform, g: PIXI.Graphics): PIXI.Graphics;
}



export {
    Drawable
}
