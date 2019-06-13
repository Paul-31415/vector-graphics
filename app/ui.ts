import * as PIXI from "pixi.js";
import { Drawable, Graphic } from "./drawable";
import { Canvas } from "./canvas";
import { PtTransform, Transform } from "./transform";
import { Point } from "./vectors";



class UI {
    //public 
    constructor(public app: PIXI.Application) { }
    mousePos(): PIXI.Point {
        return this.app.renderer.plugins.interaction.mouse.global
    }
    mouseDown(): boolean {
        throw ("not implemented");
    }



}




function button(d: Drawable, t: Transform<Point, Point> | null): Graphic {
    var b = d.draw(t);
    b.interactive = true;
    b.buttonMode = true;
    return b;
}


export {
    button, UI
}
