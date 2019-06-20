import * as PIXI from "pixi.js";
import { Drawable, Graphic } from "./drawable";
import { Transform } from "./transform";
import { Point } from "./vectors";
import { Saveable } from "./save";

interface Camera extends Saveable {
    image(d: Drawable): PIXI.Container;
}


@Saveable.register
class SimpleCamera implements Camera {
    _saveName?: string;
    constructor(public viewTransform: Transform<Point, Point> | null) { }

    image(d: Drawable): PIXI.Container {
        return d.draw(this.viewTransform);
    }
}

/*class TwoEyeCamera implements Camera {

	constructor(public viewTransform: Transform<Point, Point> | null) { }

    image(d: Drawable): PIXI.Container {
        return d.draw(this.viewTransform);
    }
}*/




export {
    Camera
}

