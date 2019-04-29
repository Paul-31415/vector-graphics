



type Vector<T> = {
    copy: () => Vector<T>;
    add: (other: Vector<T>) => Vector<T>;
    scale: (s: number) => Vector<T>;
    zero: () => Vector<T>;
    //basis: () => Array<string>;
} & T;





function bound(x: number, l: 0, h: 255) {
    return Math.min(Math.max(x, l), h);
}

class Color implements Vector<Color> {

    constructor(public r = 0, public g = 0, public b = 0, public a = 1) {

    }
    copy(): Vector<Color> {
        return new Color(this.r, this.g, this.b, this.a);
    }
    add(o: Vector<Color>): Vector<Color> {
        return new Color(this.r + o.r, this.g + o.g, this.b + o.b, this.a + o.a);
    }
    scale(s: number): Vector<Color> {
        return new Color(this.r * s, this.g * s, this.b * s, this.a * s);
    }
    zero(): Vector<Color> {
        return new Color(0, 0, 0, 0);
    }
    //basis(): Array<string> {
    //    return ["r", "g", "b", "a"];
    //}
    getRGB(): number {
        return (bound(Math.floor(this.r * 255), 0, 255) << 16) |
            (bound(Math.floor(this.g * 255), 0, 255) << 8) |
            (bound(Math.floor(this.b * 255), 0, 255));
    }
    getA(): number {
        return this.a;
        //return bound(Math.floor(this.a * 255), 0, 255);
    }


}

class Scalar /*extends Number*/ implements Vector<Scalar> {
    constructor(public v = 0) { }
    copy(): Vector<Scalar> {
        return new Scalar(this.v);
    }
    add(o: Vector<Scalar>): Vector<Scalar> {
        return new Scalar(this.v + o.v);
    }
    scale(s: number): Vector<Scalar> {
        return new Scalar(this.v * s);
    }
    zero(): Vector<Scalar> {
        return new Scalar(0);
    }

}

type VarsType = {
    [index: string]: Vector<any>,
    color?: Vector<Color>,
    fillColor?: Vector<Color>,
    width?: Vector<Scalar>,
    alignment?: Vector<Scalar>
};



class Style implements Vector<Style> {
    vars: VarsType

    constructor(v: VarsType) {
        this.vars = v;
    }

    applyLine(g: PIXI.Graphics, defaults: Style): PIXI.Graphics {
        g.lineStyle((this.vars.width || defaults.vars.width || new Scalar(1)).v,
            (this.vars.color || defaults.vars.color || new Color()).getRGB(),
            (this.vars.color || defaults.vars.color || new Color()).getA(),
            (this.vars.alignment || defaults.vars.alignment || new Scalar(0.5)).v);
        return g;
    }
    applyFill(g: PIXI.Graphics, defaults: Style): PIXI.Graphics {
        g.beginFill((this.vars.fillColor || defaults.vars.fillColor || new Color()).getRGB(),
            (this.vars.fillColor || defaults.vars.fillColor || new Color()).getA());
        return g;
    }


    copy(): Vector<Style> {
        var v: VarsType = {};
        const ks = Object.keys(this.vars);
        for (var i = 0; i < ks.length; i++) {
            v[ks[i]] = this.vars[ks[i]].copy();
        }
        return new Style(v);
    }
    add(o: Vector<Style>): Vector<Style> {
        var v: VarsType = {};
        const ks = Object.keys(this.vars);
        for (var i = 0; i < ks.length; i++) {
            v[ks[i]] = this.vars[ks[i]].copy();
        }
        const ks2 = Object.keys(o.vars);
        for (var i = 0; i < ks2.length; i++) {
            v[ks2[i]] = o.vars[ks2[i]].copy();
        }
        const ksi = [
            ...ks.filter(x => x in o.vars)
        ];
        for (var i = 0; i < ksi.length; i++) {
            v[ksi[i]] = this.vars[ksi[i]].add(v[ksi[i]]);
        }
        return new Style(v);
    }
    scale(s: number): Vector<Style> {
        var v: VarsType = {};
        const ks = Object.keys(this.vars);
        for (var i = 0; i < ks.length; i++) {
            v[ks[i]] = this.vars[ks[i]].scale(s);
        }
        return new Style(v);
    }
    zero(): Vector<Style> {
        return new Style({});
    }
    //basis(): string[] {
    //    var r: string[] = [];
    //    for (var i in this.vars) {
    //        r.concat([i]);
    //    }
    //    return r;
    //}
}

class Point implements Vector<Point> {

    constructor(public x = 0, public y = 0, public z = 0, public w = 1, public s = new Style({})) {

    }
    copy(): Vector<Point> {
        return new Point(this.x, this.y, this.z, this.w, this.s.copy());
    }
    norm2(): number {
        return (this.x * this.x + this.y * this.y + this.z * this.z) / this.w / this.w;
    }
    add(other: Vector<Point>): Vector<Point> {
        return new Point(
            this.x * other.w + other.x * this.w,
            this.y * other.w + other.y * this.w,
            this.z * other.w + other.z * this.w,
            this.w * other.w,
            this.s.add(other.s));
    }
    scale(c: number): Vector<Point> {
        return new Point(
            this.x * c,
            this.y * c,
            this.z * c,
            this.w,
            this.s.scale(c));

    }
    normalize(): Vector<Point> {
        return new Point(
            this.x / this.w,
            this.y / this.w,
            this.z / this.w,
            1, this.s);
    }
    zero(): Vector<Point> {
        return new Point(0, 0, 0, 1);
    }
    //basis(): string[] {
    //    return ["x", "y", "z", "w", "s"];
    //}

}

export {
    Vector, Point, Style, Color, Scalar
}
