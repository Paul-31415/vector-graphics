import * as PIXI from "pixi.js";
import { Drawable, Graphic } from "./drawable";
import { Canvas } from "./canvas";
import { PtTransform, Transform, CompoundTransform, Translation } from "./transform";
import { Point } from "./vectors";
import { Angle, AngleVec } from "./angle";


// don't edit anything directly, only edit through the state.

import { State } from "./state";
// the user controls the ui, the ui controls the state, the ui renders the state using the available graphical libraries

//remember, ui stuff is fundamentally event-driven

//also, this can be pixi-specific








abstract class UI_Tool {
}

//brush tool

class UI_Brush_Tool extends UI_Tool {
    constructor(public state: State) { super(); }


}
















class VirtualMouse implements Drawable {
    draw(t: Transform<Point, Point>): Graphic {
        return new Graphic(this, this.drawOn(new PIXI.Graphics(), t));
    }
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point>): PIXI.Graphics {
        if (this.image != null) {
            this.image.drawOn(g, new CompoundTransform<Point, Point, Point>(
                new Translation<Point>(this.pos), t));

        }
        return g;
    }
    _saveName?: string;

    pos: Point;

    image: Drawable;

    constructor() {
        this.pos = new Point();
    }








}













/*class UI {
    //public 
    constructor(public app: PIXI.Application) { }
    mousePos(): PIXI.Point {
        return this.app.renderer.plugins.interaction.mouse.global
    }
    mouseDown(): boolean {
        throw ("not implemented");
    }



}
*/


/*
function button(d: Drawable, t: Transform<Point, Point> | null): Graphic {
    var b = d.draw(t);
    b.interactive = true;
    b.buttonMode = true;
    return b;
}
*/

export {
    VirtualMouse
}
