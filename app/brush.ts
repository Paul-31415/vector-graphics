import * as PIXI from "pixi.js";
import { Point, Style, Color, Scalar } from "./vectors";
import { Bezier, Curve } from "./bezier";
import { Acceptor } from "./toolInterfaces";
import { Drawable, Graphic, perspLine } from "./drawable";
//import { binarySearchNumber } from "./algorithms";
import { PtTransform, Transform } from "./transform";
import { Saveable } from "./save";



interface Brush {
    line2d(g: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number): PIXI.Graphics;
    ellipse2d(g: PIXI.Graphics, x: number, y: number, w: number, h: number): PIXI.Graphics;
    poly2d(g: PIXI.Graphics, pts: Array<number>): PIXI.Graphics;

    point(g: PIXI.Graphics, t: Transform<Point, Point>, p1: Point): PIXI.Graphics;
    line(g: PIXI.Graphics, t: Transform<Point, Point>, p1: Point, p2: Point): PIXI.Graphics;
    polyLine(g: PIXI.Graphics, t: Transform<Point, Point>, pts: Array<Point>): PIXI.Graphics;
    curve(g: PIXI.Graphics, t: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics;
    polyCurve(g: PIXI.Graphics, t: Transform<Point, Point>, c: Array<Curve<Point>>, res: number): PIXI.Graphics;
    surface(g: PIXI.Graphics, t: Transform<Point, Point>, s: Curve<Curve<Point>>, res: number): PIXI.Graphics;
    volume(g: PIXI.Graphics, t: Transform<Point, Point>, s: Curve<Curve<Curve<Point>>>, res: number): PIXI.Graphics;
}

@Saveable.register
class Brusher implements Acceptor<Curve<Point>>, Saveable {
    _saveName?: string;
    m: Map<Curve<Point>, BrushedCurve>;
    constructor(public dest: Acceptor<BrushedCurve>, public b: Brush, public res = 1) { this.m = new Map<Curve<Point>, BrushedCurve>(); }
    accept(o: Curve<Point>): boolean {
        const r = new BrushedCurve(o, this.b, this.res);
        this.m.set(o, r);
        return this.dest.accept(r);
    }
    update(o: Curve<Point>): boolean {
        return this.dest.update(this.m.get(o));
    }
    complete(o: Curve<Point>): boolean {
        const r = this.dest.complete(this.m.get(o));
        this.m.delete(o);
        return r;
    }
}
@Saveable.register
class BrushedCurve implements Drawable, Saveable {
    _saveName?: string;
    constructor(public c: Curve<Point>, public b: Brush, public res = 1) { }
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics {
        return this.b.curve(g, t, this.c, this.res);
    }
    draw(t: Transform<Point, Point> | null): Graphic {
        return new Graphic(this, this.drawOn(new PIXI.Graphics(), t));
    }
}



@Saveable.register
class Selected_br implements Brush, Saveable {
    _saveName?: string;
    line2d(g: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    } ellipse2d(g: PIXI.Graphics, x: number, y: number, w: number, h: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    poly2d(g: PIXI.Graphics, pts: number[]): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    point(g: PIXI.Graphics, t: Transform<Point, Point>, p1: Point): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    line(g: PIXI.Graphics, t: Transform<Point, Point>, p1: Point, p2: Point): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    polyLine(g: PIXI.Graphics, t: Transform<Point, Point>, pts: Point[]): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    curve(g: PIXI.Graphics, t: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    polyCurve(g: PIXI.Graphics, t: Transform<Point, Point>, c: Curve<Point>[], res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    surface(g: PIXI.Graphics, t: Transform<Point, Point>, s: Curve<Curve<Point>>, res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
    volume(g: PIXI.Graphics, t: Transform<Point, Point>, s: Curve<Curve<Curve<Point>>>, res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }


}



@Saveable.register
class Pen implements Brush, Saveable {
    _saveName?: string;
    constructor(public s = new Style({ Color: new Color(1, 1, 1) })) { }
    line2d(g: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number): PIXI.Graphics {
        g.moveTo(x1, y1);
        this.s.applyLine(g, this.s);
        g.lineTo(x2, y2);
        return g;
    }
    ellipse2d(g: PIXI.Graphics, x: number, y: number, w: number, h: number): PIXI.Graphics {
        this.s.applyLine(g, this.s);
        g.drawEllipse(x, y, w, h);
        return g;
    }
    poly2d(g: PIXI.Graphics, pts: Array<number>): PIXI.Graphics {
        this.s.applyLine(g, this.s);
        this.s.applyFill(g, this.s);
        g.drawPolygon(pts);
        g.endFill();
        return g;
    }
    point(g: PIXI.Graphics, t: Transform<Point, Point>, p1: Point): PIXI.Graphics {
        return this.line(g, t, p1, p1);
    }
    line(g: PIXI.Graphics, t: Transform<Point, Point>, P1: Point, P2: Point): PIXI.Graphics {
        var p1: Point;
        var p2: Point;

        p1 = t.apply(P1).normalize();
        p2 = t.apply(P2).normalize();

        g.moveTo(p1.x, p1.y);
        p1.s.applyLine(g, this.s);
        g.lineTo(p2.x, p2.y);
        return g;
    }
    polyLine(g: PIXI.Graphics, t: Transform<Point, Point>, pts: Point[]): PIXI.Graphics {
        var poly: number[] = [];
        for (var i = 0; i < pts.length; i++) {
            const pt = t.apply(pts[i]).normalize();
            poly[i * 2] = pt.x;
            poly[i * 2 + 1] = pt.y;

        }
        return this.poly2d(g, poly);
    }

    appendCurveToPoly(pts: Point[], c: Curve<Point>, res: number): void {
        var i = pts.length;
        for (var ct = 0; ct <= 1; ct += 1 / res) {
            pts[i] = c.get(ct);
            i++;
        }
    }

    curve(g: PIXI.Graphics, trns: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {
        var oldPt = trns.apply(c.get(0)).normalize();
        g.moveTo(oldPt.x, oldPt.y);
        for (var t = 0; t < 1; t += 1 / res) {
            var pt = trns.apply(c.get(t)).normalize();
            oldPt.s.applyLine(g, this.s);
            g.lineTo(pt.x, pt.y);
            oldPt = pt;
        }
        return g;

    }

    polyCurve(g: PIXI.Graphics, t: Transform<Point, Point>, c: Curve<Point>[], res: number): PIXI.Graphics {
        var pts: Point[] = [];
        for (var ci in c) {
            this.appendCurveToPoly(pts, c[ci], res);
        }
        return this.polyLine(g, t, pts);
    }
    surface(g: PIXI.Graphics, t: Transform<Point, Point>, s: Curve<Curve<Point>>, res: number): PIXI.Graphics {
        var pts: Point[] = [];
        this.appendCurveToPoly(pts, s.get(0), res);
        var i = pts.length;
        for (var ct = 0; ct <= 1; ct += 1 / res) {
            pts[i] = s.get(ct).get(1);
            i++;
        }
        this.appendCurveToPoly(pts, s.get(0), res);
        i = pts.length;
        for (var ct = 0; ct <= 1; ct += 1 / res) {
            pts[i] = s.get(1 - ct).get(0);
            i++;
        }
        return this.polyLine(g, t, pts);

    }
    volume(g: PIXI.Graphics, t: Transform<Point, Point>, s: Curve<Curve<Curve<Point>>>, res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
}
@Saveable.register
class PerspPen extends Pen {
    constructor(s = new Style({ Color: new Color(1, 1, 1) })) { super(s); }

    curve(g: PIXI.Graphics, trns: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {
        var oldPt = trns.apply(c.get(0)).normalize();
        for (var t = 0; t < 1; t += 1 / res) {
            var pt = trns.apply(c.get(t)).normalize();
            //oldPt.s.applyLine(g, this.s);
            perspLine(g, oldPt, pt, this.s);
            oldPt = pt;
        }
        return g;
    }
}

@Saveable.register
class DebugPen extends Pen {
    constructor(s = new Style({ Color: new Color(1, 1, 1) })) { super(s); }

    curve(g: PIXI.Graphics, trns: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {
        var oldPt = trns.apply(c.get(0)).normalize();
        for (var t = 0; t < 1; t += 1 / res) {
            var pt = trns.apply(c.get(t)).normalize();
            //oldPt.s.applyLine(g, this.s);
            if (pt.s.vars.EventData != null) {
                pt.s.vars.width = new Scalar(pt.s.vars.EventData.pressure);
            }
            perspLine(g, oldPt, pt, this.s);
            oldPt = pt;
        }
        return g;
    }
}






@Saveable.register
class Dots extends Pen {
    constructor(s = new Style({ Color: new Color(1, 1, 1) })) { super(s); }
    curve(g: PIXI.Graphics, trns: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {
        for (var t = 0; t < 1; t += 1 / res) {
            var pt = trns.apply(c.get(t)).normalize();
            var w = 1;
            if (pt.s.defaults(this.s).vars.width != null) {
                w = pt.s.defaults(this.s).vars.width.v;
            }
            g.drawCircle(pt.x, pt.y, w);
        }
        return g;
    }
}

@Saveable.register
class SmartPen_bisect extends Pen {
    constructor(s = new Style({ Color: new Color(1, 1, 1) })) { super(s); }


    curve(g: PIXI.Graphics, trns: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }

    appendCurveToPoly(pts: Point[], c: Curve<Point>, res: number): void {

    }
    flattenCurve(c: Curve<Point>, res: number): Point[] {
        var ptts: number[] = [0, 1];
        var pts: Array<Point> = [c.get(0), c.get(1)];
        var lens: number[][] = [[0, pts[0].scale(-1).add(pts[1]).norm2()]];
        for (var i = 0; i < 1; i += res) {
            const ti = lens.pop()[0];
            //get index from ptts
            //const ind = binarySearchNumber(ti, ptts);
            //todo



            //split this one
            const nt = (ptts[ti] + ptts[ti + 1]) / 2;
            ptts.splice(ti + 1, 0, nt);
            pts.splice(ti + 1, 0, c.get(nt));
            //insert new lengths


        }
        return pts;
    }
}



@Saveable.register
class SmartPen_deriv extends Pen {
    constructor(s = new Style({ Color: new Color(1, 1, 1) })) { super(s); }

    getEstimateDelta(c: Curve<Point>, der: Curve<Point>, t: number, res: number): number {
        const d = der.get(t).norm2();
        //console.log(Math.sqrt(d));
        const here = c.get(t).scale(-1);
        if (d <= 0) {
            return 1 / res / res;
        } else {
            const dt = .5 / res / Math.sqrt(d);
            var guess = dt / 2;
            //return dt / 2;
            var guessPt = c.get(guess + t);
            while (here.add(guessPt).norm2() > res * res) {
                guess /= 2;
                var guessPt = c.get(guess + t);
            }
            return guess;
            const d2 = c.get(t + dt).norm2();
            if (d2 <= 0) {
                return 1 / res / res;
            } else {
                return 1 / res / Math.sqrt(d2);
            }
        }
    }



    curve(g: PIXI.Graphics, trns: Transform<Point, Point>, c: Curve<Point>, res: number): PIXI.Graphics {

        var oldPt = trns.apply(c.get(0)).normalize();
        const der = c.derivative();
        g.moveTo(oldPt.x, oldPt.y);
        for (var t = 0; t < 1; t += this.getEstimateDelta(c, der, t, res)) {
            var pt = trns.apply(c.get(t)).normalize();
            oldPt.s.applyLine(g, this.s);
            g.lineTo(pt.x, pt.y);
            //const dbg = der.get(t)
            //g.lineTo(pt.x + dbg.x, pt.y + dbg.y);
            //g.lineTo(pt.x + 1, pt.y + 1);
            oldPt = pt;
        }
        return g;

    }

    appendCurveToPoly(pts: Point[], c: Curve<Point>, res: number): void {
        var i = pts.length;
        const cd = c.derivative();
        for (var ct = 0; ct <= 1; ct += this.getEstimateDelta(c, cd, ct, res)) {
            pts[i] = c.get(ct);
            i++;
        }
    }

}

type Pair<A, B> = {
    a: A;
    b: B;
}


abstract class CurveFlattener {
    abstract flatten(c: Curve<Point>, res: number): IterableIterator<Pair<number, Point>>;
}

@Saveable.register
class SimpleFlattener extends CurveFlattener implements Saveable {
    _saveName?: string;
    *flatten(c: Curve<Point>, res: number): IterableIterator<Pair<number, Point>> {
        for (var t = 0; t < 1; t += 1 / res) {
            yield { a: t, b: c.get(t) };
        }
    }
}
@Saveable.register
class DerivFlattener extends CurveFlattener implements Saveable {
    _saveName?: string;
    *flatten(c: Curve<Point>, res: number): IterableIterator<Pair<number, Point>> {
        const d = c.derivative();
        for (var t = 0; t < 1;) {
            yield { a: t, b: c.get(t) };
            const der2 = d.get(t).norm2();
            if (der2 <= 0) {
                t += 1 / res / res
            } else {
                t += 1 / res / Math.sqrt(der2);
            }
        }
    }
}

@Saveable.register
class SmartPen extends SmartPen_deriv { }

export {
    Brusher,
    Brush, Selected_br,
    Pen, Dots, SmartPen_deriv, SmartPen_bisect, SmartPen, DebugPen,
    BrushedCurve, PerspPen,

    CurveFlattener, SimpleFlattener, DerivFlattener
}
