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
    for (let i = 0; i <= len - o; i++) {
        res[i + o - 1] = i / (1 + len - o);
    }
    for (let i = 0; i < o; i++) {
        res[i] = 0;
        res[len + i] = 1;
    }
    return res;
}

const iter = 4;
const testSpline = new B_Spline<Point2d>(
    parray_add_scale(hilbert_curve(iter), 400, point2d(10, 10)),
    uniform_knot_vec(1 << (2 * iter), 16)
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
    t += 1 / (1 << 11);
    const p = testSpline.curve_eval(t % 1).p;
    //circ.x = p.x; circ.y = p.y;
    //draw deco
    {
        //draw poi
        circ.clear();
        circ.moveTo(p.x, p.y);
        circ.beginFill(0xffff00).drawCircle(p.x, p.y, 8).endFill();
        //draw support pyramid
        const pyr = testSpline.support_net(t % 1);
        for (let i = 0; i < pyr.length; i++) {
            const colr = 0x808080 + (0x7f7f7f & (Math.sin(i + 1) * 0xffffff));
            circ.moveTo(pyr[i][0].x, pyr[i][0].y);
            circ.beginFill(colr).drawCircle(pyr[i][0].x, pyr[i][0].y, 4).endFill();
            circ.moveTo(pyr[i][0].x, pyr[i][0].y);
            circ.lineStyle(1, colr - 0x404040);
            for (let j = 1; j < pyr[i].length; j++) {
                circ.lineTo(pyr[i][j].x, pyr[i][j].y);
                circ.beginFill(colr).drawCircle(pyr[i][j].x, pyr[i][j].y, 4).endFill();
                circ.moveTo(pyr[i][j].x, pyr[i][j].y);
            }
        }

    }
    cur;
}
app.ticker.add(physLoop);

