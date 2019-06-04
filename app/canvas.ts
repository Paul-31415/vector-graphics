import * as PIXI from "pixi.js";
import { Drawable } from "./drawable";
import { PtTransform } from "./transform";
import { Acceptor } from "./toolInterfaces";

class Canvas extends PIXI.Sprite implements Drawable, Acceptor<Drawable> {
    accept(o: Drawable): boolean {
        this.add(o);
        return true;
    }
    update(o: Drawable): boolean {
        return true;
    }
    complete(o: Drawable): boolean {
        return true;
    }
    constructor(public contents: Array<Drawable>) {
        super();
    }
    draw(t: PtTransform): PIXI.Graphics {
        return this.drawOn(t, new PIXI.Graphics());
    }
    add(d: Drawable): Canvas {
        this.contents[this.contents.length] = d;
        return this
    }
    drawOn(t: PtTransform, g: PIXI.Graphics): PIXI.Graphics {
        this.contents.forEach((elem) => {
            elem.drawOn(t, g);
        });
        return g
    }
}
export {
    Canvas
}
