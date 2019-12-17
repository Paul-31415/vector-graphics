import * as PIXI from "pixi.js";
import { Drawable, Graphic } from "./drawable";
import { Canvas } from "./canvas";
import { PtTransform, Transform, CompoundTransform, Translation } from "./transform";
import { Point } from "./vectors";
import { Angle, AngleVec } from "./angle";





class UI {

    listeners: any;

    private boundListeners: any;
    constructor() {
        this.listeners = {}
        this.boundListeners = {}
    }

    document: Document

    private bindListener(key: string): (e: any) => void {
        const f = function(e: any): void {
            for (var el of this[key]) {
                if (!el(e)) {
                    return;
                }
            }
        }.bind(this);
        this.boundListeners[key] = f;
        return f;
    }

    attach(document: Document) {

        this.document = document;
        for (var e in this.listeners) {
            document.addEventListener(e, this.bindListener(e));
        }
    }
    detach(): Document {
        for (var e in this.boundListeners) {
            this.document.removeEventListener(e, this.boundListeners[e]);
        }
        this.boundListeners = {}
        const tmp = this.document;
        this.document = null;
        return tmp;
    }

    addListener(t: string, listener: (e: any) => boolean): number {
        if (this.document != null) {
            if (this.listeners[t] == null) {
                this.listeners[t] = [listener];
                this.document.addEventListener(t, this.bindListener(t));
            } else {
                this.listeners[t].append(listener);
            }
        } else {
            if (this.listeners[t] == null) {
                this.listeners[t] = [listener];
            } else {
                this.listeners[t].append(listener);
            }
        }
        return this.listeners[t].length - 1;
    }

    removeListenerAt(t: string, key: number): (e: any) => boolean {
        if (this.listeners[t] != null) {
            var l = this.listeners[t][key];
            delete this.listeners[t][key];
            return l;
        }
        return null;
    }


}


//simple window system currys
class WindowPane {

}

class TextBox {

}






//need to make enough ui to build the rest of the ui
//make macro lang good enough to define new vector types.





abstract class inputWanter {

}

class booleanWanter extends inputWanter {

}
class scalarWanter extends inputWanter {

}

class vectorWanter extends inputWanter {

}















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
    VirtualMouse, UI
}
