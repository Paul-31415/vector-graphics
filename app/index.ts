import * as PIXI from "pixi.js";
import { Pen, SmartPen } from "./brush";
import { PtTransform } from "./transform";
import { Bezier, WeightedVector } from "./bezier";
import { Point, Style, Color, Scalar } from "./vectors";


const app: PIXI.Application = new PIXI.Application(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoResize: true
    }
);
var g = new PIXI.Graphics();
window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);

    g.clear();
    var rbPts: Point[] = [];
    for (var i = 0; i < 10; i++) {
        rbPts[i] = new Point(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0, 1,
            new Style({
                "color": new Color(Math.random(), Math.random(), Math.random())
                , "width": new Scalar(Math.random() * 5 + 1)
            })
        );
    }

    var rb = new Bezier<Point>(rbPts);

    br.curve(g, idPtTrnsfrm,
        rb,
        1);
    br2.curve(g, move,
        rb,
        100);
};



document.body.appendChild(app.view);

var br = new SmartPen(new Style({ "color": new Color(.5, .5), "width": new Scalar(2), "fillColor": new Color(1, 1, 0, 0.1) }));
var br2 = new Pen(new Style({ "color": new Color(.5, .5), "width": new Scalar(2), "fillColor": new Color(1, 1, 0, 0.1) }));
app.stage.addChild(g);
var i = 0;
var b = new Bezier<Point>([
    new Point(300, 100, 0, 1), new Point(300, 100, 0, 1),
    new Point(500 * 2, 100 * 2, 0, 2),
    new Point(400, 273, 0, 1), new Point(400, 273, 0, 1)
]);

var r = new Style({ "color": new Color(1) });

var bs = new Bezier<Point>([
    new Point(300, 100, 0, 1, r), new Point(330, 100, 0, 1, r), new Point(300, 130, 0, 1), new Point(300, 100, 0, 1),
    new Point(500 * 2, 100 * 2, 0, 2, r),
    new Point(400, 213, 0, 1), new Point(430, 273, 0, 1), new Point(400, 243, 0, 1), new Point(400, 273, 0, 1)
]);


var b2 = new Bezier<Bezier<Point>>([new Bezier<Point>([
    new Point(300, 300, 0, 1),
    new WeightedVector<Point>(new Point(500, 300, 0, 1), .5),
    new Point(400, 473, 0, 1)]),
new Bezier<Point>([
    new Point(300, 300, 0, 1),
    new WeightedVector<Point>(new Point(500, 300, 0, 1), -.5),
    new Point(400, 473, 0, 1)])]);

var idPtTrnsfrm = new PtTransform([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);

var move = new PtTransform([[1, 0, 0, 100], [0, 1, 0, 100], [0, 0, 1, 0], [0, 0, 0, 1]]);

var time = 0;


function gameLoop(delta: number): void {
    //    g.clear();
    //br.curve(g, new PtTransform([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]),
    //  b
    // , 10 * b.controlPoints.length);
    time += delta / 240;
    /*br.curve(g, idPtTrnsfrm,
        b,
        100);
    br.curve(g, move,
        b.derivative(),
        100);*/


    /*    br.surface(g, idPtTrnsfrm,
            b2
            , 10 * b2.controlPoints.length);
        br.curve(g, idPtTrnsfrm,
            b2.get(1)
            , 50);*/
    /*if (b.controlPoints.length < 40) {
        b.controlPoints = b.controlPoints.concat(
            [new Point(Math.random() * window.innerWidth, Math.random() * window.innerHeight)]);
    } else {
        b.controlPoints[i] = new Point(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
        i = (i + 1) % b.controlPoints.length;
    }
    b.controlPoints = [
        new Point(0, 0, 0, 1),
        new Point((window.innerWidth - 40), 0, 0, 1),
        new Point(window.innerWidth - 40, window.innerHeight - 40, 0, 1)];*/

    app.renderer.resize(window.innerWidth, window.innerHeight);
}

app.ticker.add(gameLoop);
