import * as PIXI from "pixi.js";
import { Drawable, Graphic } from "./drawable";
import { PtTransform, Transform } from "./transform";
import { Acceptor } from "./toolInterfaces";
import { Point } from "./vectors";
import { Saveable, NegatedSet } from "./save";

//PIXI.Sprite isn't saveable


@Saveable.register
class Canvas implements Drawable, Acceptor<Drawable> {
    _saveName?: string;
    /*_saveIgnore: Set<string> = new NegatedSet<string>(["contents"]);
    _loadSpecial() {
        const s = new PIXI.Sprite();
        for (var i in s) {
            super[i] = s[i];
        }
		
    }*/
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
        // super();
    }
    draw(t: Transform<Point, Point> | null): Graphic {
        return new Graphic(this, this.drawOn(new PIXI.Graphics(), t, ));
    }
    add(d: Drawable): Canvas {
        this.contents[this.contents.length] = d;
        return this
    }
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics {
        this.contents.forEach((elem) => {
            elem.drawOn(g, t);
        });
        return g
    }
}
export {
    Canvas
}
