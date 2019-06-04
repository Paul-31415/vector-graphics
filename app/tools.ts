import * as PIXI from "pixi.js";
import { Canvas } from "./canvas";
import { Bezier } from "./bezier";
import { Point, Style, Color, Scalar, Vector, Angle2D } from "./vectors";
import { Selected_br, SmartPen } from "./brush";
import { Acceptor } from "./toolInterfaces";

//tools are sprites
abstract class Tool extends PIXI.Sprite {

}
/*interface Tool {
    sprite: PIXI.Sprite;
}*/


class InteractionEventVector implements Vector<InteractionEventVector>{
    copy(): Vector<InteractionEventVector> {
        return new InteractionEventVector(this.width, this.height, this.pressure, this.rotationAngle.copy(), this.tangentialPressure, this.tiltX, this.tiltY, this.twist.copy());
    }
    add(other: Vector<InteractionEventVector>): Vector<InteractionEventVector> {
        return new InteractionEventVector(this.width + other.width,
            this.height + other.height,
            this.pressure + other.pressure,
            this.rotationAngle.add(other.rotationAngle),
            this.tangentialPressure + other.tangentialPressure,
            this.tiltX + other.tiltX,
            this.tiltY + other.tiltY,
            this.twist.add(other.twist));
    }
    scale(s: number): Vector<InteractionEventVector> {
        return new InteractionEventVector(this.width * s,
            this.height * s,
            this.pressure * s,
            this.rotationAngle.scale(s),
            this.tangentialPressure * s,
            this.tiltX * s,
            this.tiltY * s,
            this.twist.scale(s));
    }
    zero(): Vector<InteractionEventVector> {
        return new InteractionEventVector(0, 0);
    }
    addEq(other: Vector<InteractionEventVector>): Vector<InteractionEventVector> {
        this.width += other.width;
        this.height += other.height;
        this.pressure += other.pressure;
        this.rotationAngle.addEq(other.rotationAngle);
        this.tangentialPressure += other.tangentialPressure;
        this.tiltX += other.tiltX;
        this.tiltY += other.tiltY;
        this.twist.addEq(other.twist);
        return this;
    }
    addEqDiscardOther(other: Vector<InteractionEventVector>): Vector<InteractionEventVector> {
        this.width += other.width;
        this.height += other.height;
        this.pressure += other.pressure;
        this.rotationAngle.addEqDiscardOther(other.rotationAngle);
        this.tangentialPressure += other.tangentialPressure;
        this.tiltX += other.tiltX;
        this.tiltY += other.tiltY;
        this.twist.addEqDiscardOther(other.twist);
        return this;
    }
    scaleEq(s: number): Vector<InteractionEventVector> {
        this.width *= s;
        this.height *= s;
        this.pressure *= s;
        this.rotationAngle.scaleEq(s);
        this.tangentialPressure *= s;
        this.tiltX *= s;
        this.tiltY *= s;
        this.twist.scaleEq(s);
        return this;
    }
    zeroEq(): Vector<InteractionEventVector> {
        this.width = 0;
        this.height = 0;
        this.pressure = 0;
        this.rotationAngle.zeroEq();
        this.tangentialPressure = 0;
        this.tiltX = 0;
        this.tiltY = 0;
        this.twist.zeroEq();
        return this;
    }
    constructor(
        public width = 1,
        public height = 1,
        public pressure = 0,
        public rotationAngle = new Angle2D(0),
        public tangentialPressure = 0,
        public tiltX = 0,
        public tiltY = 0,
        public twist = new Angle2D(0)) { }
}




class BezTool extends Tool {
    work: Map<PIXI.interaction.InteractionEvent, Bezier<Point>>;
    //sprite: PIXI.Sprite;
    constructor(public target: Acceptor<Bezier<Point>>, g: any) {
        //this.sprite = new PIXI.Sprite();
        super(g);
        this.work = new Map<PIXI.interaction.InteractionEvent, Bezier<Point>>();
        this.interactive = true;
        this.on("mousedown", this.handlePress)
            .on("pointerdown", this.handlePress)
            .on("touchstart", this.handlePress)

            .on("mousemove", this.handleMove)
            .on("pointermove", this.handleMove)
            .on("touchmove", this.handleMove)

            .on("mouseup", this.handleRelease)
            .on("pointerup", this.handleRelease)
            .on("touchend", this.handleRelease)
            .on("mouseupoutside", this.handleRelease)
            .on("pointerupoutside", this.handleRelease)
            .on("touchendoutside", this.handleRelease);
    }
    makePoint(e: PIXI.interaction.InteractionEvent): Point {
        return new Point(e.data.global.x, e.data.global.y, 0, 1, new Style({
            EventData: new InteractionEventVector(
                e.data.width,
                e.data.height,
                e.data.pressure,
                new Angle2D(e.data.rotationAngle),
                e.data.tangentialPressure,
                e.data.tiltX,
                e.data.tiltY,
                new Angle2D(e.data.twist))
        }));

    }

    handlePress(e: PIXI.interaction.InteractionEvent): void {
        console.log(e);
        this.begin(e);
    }
    handleMove(e: PIXI.interaction.InteractionEvent): void {
        if (this.work.has(e)) {
            //console.log(e);
            this.cont(e);
        }
    }
    handleRelease(e: PIXI.interaction.InteractionEvent): void {
        if (this.work.has(e)) {
            //console.log(e);
            //console.log(this.target);
            this.finish(e);
        }
    }

    begin(e: PIXI.interaction.InteractionEvent): void {
        e.stopPropagation();
        const b = new Bezier<Point>([this.makePoint(e)])
        this.work.set(e, b);
        this.target.accept(b);
    }
    cont(e: PIXI.interaction.InteractionEvent): void {
        this.target.update((this.work.get(e) as Bezier<Point>).append(this.makePoint(e)));
    }
    finish(e: PIXI.interaction.InteractionEvent): void {
        this.target.complete((this.work.get(e) as Bezier<Point>));
        this.work.delete(e);
    }
}











export {
    BezTool
}
