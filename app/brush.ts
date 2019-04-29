import * as PIXI from "pixi.js";
import { Point, Style, Color, Scalar } from "./vectors";
import { Bezier, Curve } from "./bezier";
import { PtTransform } from "./transform";


interface Brush {
    line2d(g: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number): PIXI.Graphics;
    ellipse2d(g: PIXI.Graphics, x: number, y: number, w: number, h: number): PIXI.Graphics;
    poly2d(g: PIXI.Graphics, pts: Array<number>): PIXI.Graphics;

    point(g: PIXI.Graphics, t: PtTransform, p1: Point): PIXI.Graphics;
    line(g: PIXI.Graphics, t: PtTransform, p1: Point, p2: Point): PIXI.Graphics;
    polyLine(g: PIXI.Graphics, t: PtTransform, pts: Array<Point>): PIXI.Graphics;
    curve(g: PIXI.Graphics, t: PtTransform, c: Curve<Point>, res: number): PIXI.Graphics;
    polyCurve(g: PIXI.Graphics, t: PtTransform, c: Array<Curve<Point>>, res: number): PIXI.Graphics;
    surface(g: PIXI.Graphics, t: PtTransform, s: Curve<Curve<Point>>, res: number): PIXI.Graphics;
    volume(g: PIXI.Graphics, t: PtTransform, s: Curve<Curve<Curve<Point>>>, res: number): PIXI.Graphics;
}


/*
class Selected_br implements Brush {





}*/

class Pen implements Brush {
    constructor(public s: Style) { }
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
    point(g: PIXI.Graphics, t: PtTransform, p1: Point): PIXI.Graphics {
        return this.line(g, t, p1, p1);
    }
    line(g: PIXI.Graphics, t: PtTransform, P1: Point, P2: Point): PIXI.Graphics {
        var p1: Point;
        var p2: Point;

        p1 = t.apply(P1).normalize();
        p2 = t.apply(P2).normalize();

        g.moveTo(p1.x, p1.y);
        p1.s.applyLine(g, this.s);
        g.lineTo(p2.x, p2.y);
        return g;
    }
    polyLine(g: PIXI.Graphics, t: PtTransform, pts: Point[]): PIXI.Graphics {
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

    curve(g: PIXI.Graphics, trns: PtTransform, c: Curve<Point>, res: number): PIXI.Graphics {
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

    polyCurve(g: PIXI.Graphics, t: PtTransform, c: Curve<Point>[], res: number): PIXI.Graphics {
        var pts: Point[] = [];
        for (var ci in c) {
            this.appendCurveToPoly(pts, c[ci], res);
        }
        return this.polyLine(g, t, pts);
    }
    surface(g: PIXI.Graphics, t: PtTransform, s: Curve<Curve<Point>>, res: number): PIXI.Graphics {
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
    volume(g: PIXI.Graphics, t: PtTransform, s: Curve<Curve<Curve<Point>>>, res: number): PIXI.Graphics {
        throw new Error("Method not implemented.");
    }
}
class SmartPen extends Pen {
    constructor(s: Style) { super(s); }

    getEstimateDelta(c: Curve<Point>, t: number, res: number): number {
        const d = c.get(t).norm2();
        //console.log(Math.sqrt(d));
        if (d <= 0) {
            return 1 / res / res;
        } else {
            return 1 / res / Math.sqrt(d);
        }
    }


    curve(g: PIXI.Graphics, trns: PtTransform, c: Curve<Point>, res: number): PIXI.Graphics {
        var oldPt = trns.apply(c.get(0)).normalize();
        g.moveTo(oldPt.x, oldPt.y);
        for (var t = 0; t < 1; t += this.getEstimateDelta(c, t, res)) {
            var pt = trns.apply(c.get(t)).normalize();
            oldPt.s.applyLine(g, this.s);
            g.lineTo(pt.x, pt.y);
            oldPt = pt;
        }
        return g;

    }

    appendCurveToPoly(pts: Point[], c: Curve<Point>, res: number): void {
        var i = pts.length;
        const cd = c.derivative();
        for (var ct = 0; ct <= 1; ct += this.getEstimateDelta(c, ct, res)) {
            pts[i] = c.get(ct);
            i++;
        }
    }

}




export {
    Brush,
    Pen, SmartPen

}
