import * as PIXI from "pixi.js";
import { Drawable, Graphic } from "./drawable";
import { Transform, CompoundTransform, Translation } from "./transform";
import { Point } from "./vectors";
import { Saveable, save } from "./save";
import { Angle } from "./angle";

const TINY = 1e-100;//(allow room for euclidean norm calcs)
@Saveable.register
class PerspCollapse implements Transform<Point, Point>{
    constructor(public fov = 1) { }
    apply(a: Point): Point {
        const z = this.fov * a.z;
        if (z == 0) {
            return new Point(a.x / TINY, a.y / TINY, a.z, a.w, a.s);
        } else {
            return new Point(a.x / z, a.y / z, a.z, a.w, a.s);
        }
    }
    transform_linear = false; //I think.
    transform_invertible = true;
    inverse(): Transform<Point, Point> {
        throw new Error("not implemented");
    }
    unapply(a: Point): Point {
        const z = this.fov * a.z;
        if (z == 0) {
            return new Point(a.x * TINY, a.y * TINY, a.z, a.w, a.s);
        } else {
            return new Point(a.x * z, a.y * z, a.z, a.w, a.s);
        }
    }
    _saveName?: string;



}


/*

@Saveable.register
class parallax3DCam implements Camera {
	_saveName?:string;
	
	constructor(public cam:Camera,public sep=0.1,public screenSep=0.3) { }
	image(d:Drawable): Graphic{
		const g = new PIXI.Graphics();
		const x = this.rotation.apply(new Point(sep/2));
		this.cam.position.addEq(x);
		this.cam.imageOn(g,d);
		this.cam.position.addEq(x.scale(-2));
		this.cam.imageOn(g,d);
	}

	get position():Point{
		return this.cam.position;
	}
	set position(p: Point):void{
		this.cam.position = p;
	}
	get rotation():Angle{
		return this.cam.rotation;
	}
	set rotation(a: Angle):void{
		this.cam.rotation = a;
	}
	


	
}

*/


interface Camera extends Saveable {
    image(d: Drawable): Graphic;
    imageOn(g: PIXI.Graphics, d: Drawable): PIXI.Graphics;
    position: Point;
    rotation: Angle;
}


@Saveable.register
class SimpleCamera implements Camera {
    position: Point;
    rotation: Angle;
    _saveName?: string;
    constructor(public viewTransform: Transform<Point, Point> | null) { }

    image(d: Drawable): Graphic {
        return d.draw(this.viewTransform);
    }
    imageOn(g: PIXI.Graphics, d: Drawable): PIXI.Graphics {
        return d.drawOn(g, this.viewTransform);
    }
}





@Saveable.register
class PerspCam implements Camera, Transform<Point, Point> {
    apply(a: Point): Point {
        return this.fov.apply(this.rotation.unapply(a.add(this.position.scale(-1))));
    }
    transform_linear: boolean;
    transform_invertible: boolean;
    inverse(): Transform<Point, Point> {
        throw new Error("Method not implemented.");
    }
    unapply(b: Point): Point {
        return this.rotation.apply(this.fov.unapply(b)).addEq(this.position);
    }
    _saveName?: string;
    fov: PerspCollapse;
    image(d: Drawable): Graphic {
        const shift = new Translation<Point>(this.position.scale(-1));
        const trns = new CompoundTransform<Point, Point, Point>(new CompoundTransform<Point, Point, Point>(shift, this.rotation.inverse()), this.fov);
        return d.draw(trns);
    }
    imageOn(g: PIXI.Graphics, d: Drawable): PIXI.Graphics {
        const shift = new Translation<Point>(this.position.scale(-1));
        const trns = new CompoundTransform<Point, Point, Point>(new CompoundTransform<Point, Point, Point>(shift, this.rotation.inverse()), this.fov);
        return d.drawOn(g, trns);
    }

    constructor(public position: Point, public rotation: Angle, fov = 1) { this.fov = new PerspCollapse(fov); }




}

/*class TwoEyeCamera implements Camera {

	constructor(public viewTransform: Transform<Point, Point> | null) { }

    image(d: Drawable): PIXI.Container {
        return d.draw(this.viewTransform);
    }
}*/




export {
    Camera, SimpleCamera, PerspCam
}


