



type Vector<T> = {
    copy: () => Vector<T>;
    add: (other: Vector<T>) => Vector<T>;
    scale: (s: number) => Vector<T>;
    zero: () => Vector<T>;
    addEq: (other: Vector<T>) => Vector<T>;
    addEqDiscardOther: (other: Vector<T>) => Vector<T>;
    scaleEq: (s: number) => Vector<T>;
    zeroEq: () => Vector<T>;
    //basis: () => Array<string>;
} & T;





function bound(x: number, l: 0, h: 255) {
    return Math.min(Math.max(x, l), h);
}

class Color implements Vector<Color> {
    static Gamma: number = 2;
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
    addEq(o: Vector<Color>): Vector<Color> {
        this.r += o.r; this.g += o.g; this.b += o.b; this.a + o.a;
        return this;
    }
    addEqDiscardOther(o: Vector<Color>): Vector<Color> {
        this.r += o.r; this.g += o.g; this.b += o.b; this.a + o.a;
        return this;
    }
    scaleEq(s: number): Vector<Color> {
        this.r *= s; this.g *= s; this.b *= s; this.a *= s;
        return this;
    }
    zeroEq(): Vector<Color> {
        this.r = 0; this.g = 0; this.b = 0; this.a = 0;
        return this;
    }
    //basis(): Array<string> {
    //    return ["r", "g", "b", "a"];
    //}
    getRGB(): number {
        return (bound(Math.floor(Math.pow(this.r, Color.Gamma) * 255), 0, 255) << 16) |
            (bound(Math.floor(Math.pow(this.g, Color.Gamma) * 255), 0, 255) << 8) |
            (bound(Math.floor(Math.pow(this.b, Color.Gamma) * 255), 0, 255));
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
    addEq(o: Vector<Scalar>): Vector<Scalar> {
        this.v += o.v;
        return this;
    }
    addEqDiscardOther(o: Vector<Scalar>): Vector<Scalar> {
        this.v += o.v;
        return this;
    }
    scaleEq(s: number): Vector<Scalar> {
        this.v *= s;
        return this;
    }
    zeroEq(): Vector<Scalar> {
        this.v = 0;
        return this;
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
    addEq(o: Vector<Style>): Vector<Style> {
        const ks = Object.keys(o.vars);
        for (var i = 0; i < ks.length; i++) {
            if (this.vars[ks[i]] != null) {
                this.vars[ks[i]].addEq(o.vars[ks[i]]);
            } else {
                this.vars[ks[i]] = o.vars[ks[i]].copy();
            }
        }
        return this;
    }
    addEqDiscardOther(o: Vector<Style>): Vector<Style> {
        const ks = Object.keys(o.vars);
        for (var i = 0; i < ks.length; i++) {
            if (this.vars[ks[i]] != null) {
                this.vars[ks[i]].addEq(o.vars[ks[i]]);
            } else {
                this.vars[ks[i]] = o.vars[ks[i]];
            }
        }
        return this;
    }
    scaleEq(s: number): Vector<Style> {
        for (var i in this.vars) {
            this.vars[i].scaleEq(s);
        }
        return this;
    }
    zeroEq(): Vector<Style> {
        this.vars = {};
        return this;
    }
    //basis(): string[] {
    //    var r: string[] = [];
    //    for (var i in this.vars) {
    //        r.concat([i]);
    //    }
    //    return r;
    //}
}

function CenteredModulus(a: number, m: number) {
    return (((a % m) + m + m / 2) % m) - m / 2;
}


class Angle2D implements Vector<Angle2D>{
    constructor(public a: number) { }

    copy(): Vector<Angle2D> {
        return new Angle2D(this.a);
    }
    add(other: Vector<Angle2D>): Vector<Angle2D> {
        return new Angle2D(this.a + other.a);
    }
    //return minimum angular result
    scale(s: number): Vector<Angle2D> {

        return new Angle2D(CenteredModulus(this.a * s, 360));
    }
    zero(): Vector<Angle2D> {
        return new Angle2D(0);
    }
    addEq(other: Vector<Angle2D>): Vector<Angle2D> {
        this.a += other.a;
        return this;
    }
    addEqDiscardOther(other: Vector<Angle2D>): Vector<Angle2D> {
        this.a += other.a;
        return this;
    }
    //return minimum angular result
    scaleEq(s: number): Vector<Angle2D> {
        this.a = CenteredModulus(this.a * s, 360);
        return this;
    }
    zeroEq(): Vector<Angle2D> {
        this.a = 0;
        return this;
    }
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

    addEq(other: Vector<Point>): Vector<Point> {
        this.x = this.x * other.w + other.x * this.w;
        this.y = this.y * other.w + other.y * this.w;
        this.z = this.z * other.w + other.z * this.w;
        this.w *= other.w;
        this.s.addEq(other.s);
        return this;
    }
    addEqDiscardOther(other: Vector<Point>): Vector<Point> {
        this.x = this.x * other.w + other.x * this.w;
        this.y = this.y * other.w + other.y * this.w;
        this.z = this.z * other.w + other.z * this.w;
        this.w *= other.w;
        this.s.addEqDiscardOther(other.s);
        return this;
    }
    scaleEq(c: number): Vector<Point> {
        this.x *= c;
        this.y *= c;
        this.z *= c;
        this.s.scaleEq(c);
        return this;
    }
    zeroEq(): Vector<Point> {
        this.x = 0; this.y = 0; this.z = 0; this.w = 1; this.s.zeroEq();
        return this;
    }
}

export {
    Vector, Point, Style, Color, Scalar, Angle2D
}
