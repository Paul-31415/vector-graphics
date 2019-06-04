import * as PIXI from "pixi.js";
import { Drawable } from "./drawable";
import { Canvas } from "./canvas";
import { PtTransform } from "./transform";



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




function button(d: Drawable, t: PtTransform): PIXI.Graphics {
    var b = d.draw(t);
    b.interactive = true;
    b.buttonMode = true;
    return b;
}


export {
    button, UI
}
