import * as PIXI from "pixi.js";
import { Graphics } from "pixi.js";
import { B_Spline } from "./curve/b_spline";
import { Point2d, point2d } from "./vector/point2d";
import { Curve } from "./curve/curve";
let renderer = PIXI.autoDetectRenderer();

const app: PIXI.Application = new PIXI.Application(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoResize: true
    }
);

document.body.appendChild(app.view);

window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);
};


function hilbert_coords(t: number, n: number): Point2d {
    let x = 0;
    let y = 0;
    let rot = 0;
    let inv = 0;
    for (let i = 0; i < n; i++) {
        t *= 4;
        const ind = Math.floor(t) ^ inv;
        x *= 2;
        y *= 2;
        x += [[0, 0, 1, 1], [1, 0, 0, 1], [1, 1, 0, 0], [0, 1, 1, 0]][rot][ind];
        y += [[0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1], [1, 1, 0, 0]][rot][ind];
        rot = (rot + [3, 0, 0, 1][ind]) % 4;
        t %= 1;
        if (ind === 0 || ind === 3) {
            inv ^= 0x3;
        }
    }
    const d = 1 << n;
    return point2d(x / d, y / d);
}
function hilbert_curve(n: number): Point2d[] {
    const res = new Array<Point2d>();
    const d = 1 << (n * 2);
    for (let i = 0; i < d; i++) {
        res[i] = hilbert_coords(i / d, n);
    }
    return res;
}
function parray_add_scale(a: Point2d[], s: number, p: Point2d): Point2d[] {
    for (let i = 0; i < a.length; i++) {
        a[i].vec_scaleEq(s);
        a[i].vec_addEq(p);
    }
    return a;
}
function uniform_knot_vec(len: number, o: number): number[] {
    const res = Array<number>(len + o);
    for (let i = 0; i < len + o; i++) {
        res[i] = (i - o + 1) / (1 + len - o);
    }
    return res;
}
function uniform_ended_knot_vec(len: number, o: number): number[] {
    const res = Array<number>(len + o);
    for (let i = 0; i <= len - o; i++) {
        res[i + o - 1] = i / (1 + len - o);
    }
    for (let i = 0; i < o; i++) {
        res[i] = 0;
        res[len + i] = 1;
    }
    return res;
}

const iter = 3;
const testSpline = new B_Spline<Point2d>(
    parray_add_scale(hilbert_curve(iter), 400, point2d(10, 10)),
    uniform_ended_knot_vec(1 << (2 * iter), 4)
);


function plotCurve(c: Curve<Point2d>, res: number): PIXI.Graphics {
    const cur = new PIXI.Graphics();
    cur.lineStyle(2, 0xff4400);
    const p = c.curve_eval(0).p;
    cur.moveTo(p.x, p.y);
    for (let i = 1; i <= res; i++) {
        const p = c.curve_eval(i / res).p;
        cur.lineTo(p.x, p.y);
    }
    return cur;
}

let t = .5;
const circ = new PIXI.Graphics();
circ.beginFill(0xffff00).drawCircle(0, 0, 16).endFill();
const cur = plotCurve(testSpline, 1 << 13)
app.stage.addChild(cur);
app.stage.addChild(circ);
function physLoop(delta: number): void {
    t += 1 / (1 << 13);
    const p = testSpline.curve_eval(t % 1).p;
    //circ.x = p.x; circ.y = p.y;
    //draw deco
    {
        //draw poi
        circ.clear();
        circ.moveTo(p.x, p.y);
        circ.beginFill(0xffff00).drawCircle(p.x, p.y, 8).endFill();
        //draw support pyramid
        if (false) {
            const pyr = testSpline.support_net(t % 1);
            for (let i = 0; i < pyr.length; i++) {
                const colr = 0x808080 + (0x7f7f7f & (Math.sin(i + 1) * 0xffffff));
                circ.moveTo(pyr[i][0].x, pyr[i][0].y);
                circ.beginFill(colr).drawCircle(pyr[i][0].x, pyr[i][0].y, 2).endFill();
                circ.moveTo(pyr[i][0].x, pyr[i][0].y);
                circ.lineStyle(.5, colr - 0x404040);
                for (let j = 1; j < pyr[i].length; j++) {
                    circ.lineTo(pyr[i][j].x, pyr[i][j].y);
                    circ.beginFill(colr).drawCircle(pyr[i][j].x, pyr[i][j].y, 2).endFill();
                    circ.moveTo(pyr[i][j].x, pyr[i][j].y);
                }
            }
        }

        //draw knot inserted curve
        const cv = testSpline.vec_copy();
        cv.insert_knot(t % 1, 1);
        circ.lineStyle(.5, 0x8000ff);
        const p0 = cv.curve_eval(0).p;
        circ.moveTo(p0.x, p0.y);
        for (let r = 1 / 512; r <= 1; r += 1 / 512) {
            const p = cv.curve_eval(r);
            circ.lineTo(p.x, p.y);
        }
        {
            const p = cv.control_points[0];
            circ.lineStyle(.5, 0xc040ff);
            circ.beginFill(0xc040ff).drawCircle(p.x, p.y, 1).endFill();
            circ.moveTo(p.x, p.y);
            for (let i = 1; i < cv.control_points.length; i++) {
                const p = cv.control_points[i];
                circ.lineTo(p.x, p.y);
                circ.beginFill(0xc040ff).drawCircle(p.x, p.y, 1).endFill();
                circ.moveTo(p.x, p.y);
            }
        }
    }
    cur;
}
app.ticker.add(physLoop);

