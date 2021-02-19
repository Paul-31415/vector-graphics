import { Saveable } from "./save";
import { Base, Class } from "./mixin";
import THREE = require("three");
//import Math from ;

abstract class Vector<T extends Vector<T>>{

    //    constructor() { } //zero

    abstract add(other: T): T;
    abstract scale(s: number): T;

    abstract copy(): T; //shallow copy of vector
    abstract set(other: T): T;//sets this vector to another vector

    //optional optimization stuff
    addEq(other: T): T {
        return this.set(this.add(other));
    }
    addD(other: T): T {
        return other.addEq(this as any as T);
    }
    addDEq(other: T): T {
        return this.addEq(other);
    }

    neg(): T {
        return this.scale(-1);
    }
    negEq(): T {
        return this.scaleEq(-1);
    }

    sub(other: T): T {
        return this.add(other.neg());
    }
    subEq(other: T): T {
        return this.addEq(other.neg());
    }
    subD(other: T): T {
        return other.negEq().addEq(this as any as T);
    }
    subDEq(other: T): T {
        return this.subEq(other);
    }

    scaleEq(s: number): T {
        return this.set(this.scale(s));
    }

    lerp(other: T, alpha: number): T {
        return this.scale(1 - alpha).addDEq(other.scale(alpha));
    }
    lerpEq(other: T, alpha: number): T {
        return this.scaleEq(1 - alpha).addDEq(other.scale(alpha));
    }
    lerpD(other: T, alpha: number): T {
        return this.scale(1 - alpha).addDEq(other.scaleEq(alpha));
    }
    lerpDEq(other: T, alpha: number): T {
        return this.scaleEq(1 - alpha).addDEq(other.scaleEq(alpha));
    }
}


interface NormedVector<T extends NormedVector<T>> extends Vector<T> {
    norm: () => number;
    norm2: () => number;
}

function bound(x: number, l: 0, h: 255) {
    return Math.min(Math.max(x, l), h);
}
@Saveable.register
class WeightedVector<T extends Vector<any>> extends Vector<WeightedVector<T>> implements Saveable {
    _saveName?: string;
    public v: T;
    public w: number;
    _isWeightedVector = true;
    constructor();
    constructor(v: T);
    constructor(v: T, w: number);
    constructor(vec: T = null, weight: number = 1) { super(); this.v = vec; this.w = weight; }
    set(o: WeightedVector<T>): WeightedVector<T> {
        this.v = o.v;
        this.w = o.w; return this;
    }
    get(): T {
        return this.v.scale(this.w);
    }
    copy(): WeightedVector<T> {
        return new WeightedVector<T>(this.v.copy(), this.w);
    }
    add(o: WeightedVector<T>): WeightedVector<T> {
        if (this.v == null) {
            return new WeightedVector<T>(o.v.copy(), this.w + o.w);
        } else {
            if (o.v == null) {
                return new WeightedVector<T>(this.v.copy(), this.w + o.w);
            } else {
                return new WeightedVector<T>(this.v.add(o.v), this.w + o.w);
            }
        }
    }
    scale(s: number): WeightedVector<T> {
        if (this.v == null) {
            return new WeightedVector<T>(this.v, this.w * s);
        }
        return new WeightedVector<T>(this.v.scale(s), this.w * s);
    }
    addEq(o: WeightedVector<T>): WeightedVector<T> {
        this.w += o.w;
        if (this.v == null) {
            this.v = o.v.copy();
        } else {
            if (o.v != null) {
                this.v.addEq(o.v);
            }
        }
        return this;
    }
    addD(other: WeightedVector<T>): WeightedVector<T> {
        return other.addEq(this);
    }
    addDEq(o: WeightedVector<T>): WeightedVector<T> {
        this.w += o.w;
        if (this.v == null) {
            this.v = o.v.copy();
        } else {
            if (o.v != null) {
                this.v.addDEq(o.v);
            }
        }
        return this;
    }

    neg(): WeightedVector<T> {
        if (this.v == null) {
            return new WeightedVector<T>(this.v, -this.w);
        }
        return new WeightedVector<T>(this.v.neg(), -this.w);
    }
    negEq(): WeightedVector<T> {
        this.w = -this.w;
        if (this.v == null) {
            return this;
        }
        this.v.negEq();
        return this;
    }

    sub(o: WeightedVector<T>): WeightedVector<T> {
        if (this.v == null) {
            return new WeightedVector<T>(o.v.neg(), this.w - o.w);
        } else {
            if (o.v == null) {
                return new WeightedVector<T>(this.v.copy(), this.w - o.w);
            } else {
                return new WeightedVector<T>(this.v.sub(o.v), this.w - o.w);
            }
        }
    }
    subEq(o: WeightedVector<T>): WeightedVector<T> {
        this.w += o.w;
        if (this.v == null) {
            this.v = o.v.neg();
        } else {
            if (o.v != null) {
                this.v.subEq(o.v);
            }
        }
        return this;
    }
    subD(other: WeightedVector<T>): WeightedVector<T> {
        return other.negEq().addEq(this);
    }
    subDEq(o: WeightedVector<T>): WeightedVector<T> {
        this.w += o.w;
        if (this.v == null) {
            this.v = o.v.neg();
        } else {
            if (o.v != null) {
                this.v.subDEq(o.v);
            }
        }
        return this;
    }

    scaleEq(s: number): WeightedVector<T> {
        this.w *= s;
        if (this.v != null) {
            this.v.scaleEq(s);
        }
        return this;
    }

}

@Saveable.register
class Color extends Vector<Color> implements Saveable {
    _saveName?: string;
    constructor();
    constructor(a: number, b: number, c: number, d: number);
    constructor(public r = 0, public g = 0, public b = 0, public a = 1) {
        super();
    }
    copy(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }
    set(o: Color): Color {
        this.r = o.r; this.g = o.g; this.b = o.b; this.a = o.a;
        return this;
    }
    add(o: Color): Color {
        return new Color(this.r + o.r, this.g + o.g, this.b + o.b, this.a + o.a);
    }
    addEq(o: Color): Color {
        this.r += o.r; this.g += o.g; this.b += o.b; this.a += o.a;
        return this;
    }
    scale(s: number): Color {
        return new Color(this.r * s, this.g * s, this.b * s, this.a * s);
    }


    getRGB(): number {
        return (bound(Math.floor(this.r * 255), 0, 255) << 16) |
            (bound(Math.floor(this.g * 255), 0, 255) << 8) |
            (bound(Math.floor(this.b * 255), 0, 255));
    }
    getA(): number {
        return this.a;
    }
}


@Saveable.register
class Scalar extends Vector<Scalar> implements Saveable, NormedVector<Scalar> {
    _saveName?: string;


    constructor(public v = 0) { super(); }
    copy(): Scalar {
        return new Scalar(this.v);
    }
    set(o: Scalar): Scalar {
        this.v = o.v; return this;
    }

    add(o: Scalar): Scalar {
        return new Scalar(this.v + o.v);
    }
    addEq(o: Scalar): Scalar {
        this.v += o.v; return this;
    }

    sub(o: Scalar): Scalar {
        return new Scalar(this.v - o.v);
    }
    subEq(o: Scalar): Scalar {
        this.v -= o.v; return this;
    }

    neg(): Scalar {
        return new Scalar(-this.v);
    }
    negEq(): Scalar {
        this.v = -this.v; return this;
    }

    scale(s: number): Scalar {
        return new Scalar(this.v * s);
    }
    scaleEq(s: number): Scalar {
        this.v *= s; return this;
    }
    norm(): number {
        return Math.abs(this.v);
    }
    norm2(): number {
        return this.v * this.v;
    }
}


@Saveable.register

class NDVector extends Vector<NDVector> implements Saveable, NormedVector<NDVector> {
    _saveName?: string;
    public v: Array<number>;
    constructor();
    constructor(...v: Array<number>);
    constructor(...v: Array<number>) { super(); this.v = v; }
    copy(): NDVector {
        return new NDVector(...this.v);
    }
    set(o: NDVector): NDVector {
        this.v = o.v; return this;
    }
    add(o: NDVector): NDVector {
        const res = new Array<number>();
        for (var i in this.v) {
            res[i] = this.v[i];
        }
        for (var i in o.v) {
            if (i in res) {
                res[i] += o.v[i];
            } else {
                res[i] = o.v[i];
            }
        }
        return new NDVector(...res);
    }
    addEq(o: NDVector): NDVector {
        for (var i in o.v) {
            if (i in this.v) {
                this.v[i] += o.v[i];
            } else {
                this.v[i] = o.v[i];
            }
        }
        return this;
    }

    scale(s: number): NDVector {
        return new NDVector(...this.v.map(function(v: number, i: number, a: Array<number>) { return v * s; }));
    }
    scaleEq(s: number): NDVector {
        for (var i in this.v) {
            this.v[i] *= s;
        }
        return this;
    }

    neg(): NDVector {
        return new NDVector(...this.v.map(function(v: number, i: number, a: Array<number>) { return -v; }));
    }
    negEq(): NDVector {
        for (var i in this.v) {
            this.v[i] = -this.v[i];
        }
        return this;
    }


    norm(): number {
        return Math.sqrt(this.norm2());
    }
    norm2(): number {
        return this.v.map(function(v: number, i: number, a: Array<number>) { return v * v; }).reduce(function(p = 0, c: number, i: number, a: Array<number>) { return p + c; });
    }
}


@Saveable.register
class NDMetaVector<T extends Vector<any>> extends Vector<NDMetaVector<T>> implements Saveable {
    _saveName?: string;
    public v: Array<T>;
    constructor();
    constructor(...v: Array<T>);
    constructor(...v: Array<T>) { super(); this.v = v; }
    copy(): NDMetaVector<T> {
        return new NDMetaVector<T>(...this.v);
    }
    set(o: NDMetaVector<T>): NDMetaVector<T> {
        this.v = o.v;
        return this;
    }

    add(o: NDMetaVector<T>): NDMetaVector<T> {
        const res = new Array<T>();
        for (var i in this.v) {
            res[i] = this.v[i];
        }
        for (var i in o.v) {
            if (i in res) {
                res[i].addEq(o.v[i]);
            } else {
                res[i] = o.v[i];
            }
        }
        return new NDMetaVector<T>(...res);
    }
    addEq(o: NDMetaVector<T>): NDMetaVector<T> {
        for (var i in o.v) {
            if (i in this.v) {
                this.v[i].addEq(o.v[i]);
            } else {
                this.v[i] = o.v[i];
            }
        }
        return this;
    }
    addDEq(o: NDMetaVector<T>): NDMetaVector<T> {
        for (var i in o.v) {
            if (i in this.v) {
                this.v[i].addDEq(o.v[i]);
            } else {
                this.v[i] = o.v[i];
            }
        }
        return this;
    }

    scale(s: number): NDMetaVector<T> {
        return new NDMetaVector<T>(...this.v.map(function(v: T, i: number, a: Array<T>) { return v.scale(s); }));
    }
    scaleEq(s: number): NDMetaVector<T> {
        for (var i in this.v) {
            this.v[i].scaleEq(s);
        }
        return this;
    }

    neg(): NDMetaVector<T> {
        return new NDMetaVector<T>(...this.v.map(function(v: T, i: number, a: Array<T>) { return v.neg(); }));
    }
    negEq(): NDMetaVector<T> {
        for (var i in this.v) {
            this.v[i].negEq();
        }
        return this;
    }

}















type VarsType = {
    [index: string]: Vector<any>,
    color?: Vector<Color>,
    fillColor?: Vector<Color>,
    width?: Vector<Scalar>,
    alignment?: Vector<Scalar>,
};


@Saveable.register
class Style extends Vector<Style> implements Saveable {
    _saveName?: string;
    vars: VarsType
    constructor();
    constructor(v: VarsType);
    constructor(v: VarsType = {}) {
        super();
        this.vars = v;
    }

    defaults(d: Style): Style {
        var vr: VarsType = {};
        for (var i in d.vars) {
            vr[i] = d.vars[i];
        }
        for (var i in this.vars) {
            vr[i] = this.vars[i];
        }
        return new Style(vr);
    }

	/*
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
	*/

    copy(): Style {
        var v: VarsType = {};
        const ks = Object.keys(this.vars);
        for (var i = 0; i < ks.length; i++) {
            v[ks[i]] = this.vars[ks[i]].copy();
        }
        return new Style(v);
    }
    add(o: Style): Style {
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
    scale(s: number): Style {
        var v: VarsType = {};
        const ks = Object.keys(this.vars);
        for (var i = 0; i < ks.length; i++) {
            v[ks[i]] = this.vars[ks[i]].scale(s);
        }
        return new Style(v);
    }
    set(o: Style): Style {
        this.vars = o.vars;
        return this;
    }

    addEq(o: Style): Style {
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
    addDEq(o: Style): Style {
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
    scaleEq(s: number): Style {
        for (var i in this.vars) {
            this.vars[i].scaleEq(s);
        }
        return this;
    }
}

function CenteredModulus(a: number, m: number) {
    return (((a % m) + m + m / 2) % m) - m / 2;
}

@Saveable.register
class Angle2D extends Vector<Angle2D> implements Saveable {
    _saveName?: string;
    constructor();
    constructor(a: number);
    constructor(public a: number = 0) { super(); }

    copy(): Angle2D {
        return new Angle2D(this.a);
    }
    set(o: Angle2D): Angle2D {
        this.a = o.a; return this;
    }
    add(other: Angle2D): Angle2D {
        return new Angle2D(this.a + other.a);
    }
    //return minimum angular result
    scale(s: number): Angle2D {
        return new Angle2D(CenteredModulus(this.a * s, 360));
    }
    addEq(other: Angle2D): Angle2D {
        this.a += other.a;
        return this;
    }
    addDEq(other: Angle2D): Angle2D {
        this.a += other.a;
        return this;
    }
    //return minimum angular result
    scaleEq(s: number): Angle2D {
        this.a = CenteredModulus(this.a * s, 360);
        return this;
    }
}

@Saveable.register
class Point extends Vector<Point> implements Saveable, NormedVector<Point> {
    _saveName?: string;
    isPoint: true;
    constructor();
    constructor(x?: number, y?: number, z?: number, w?: number);
    constructor(public _x = 0, public _y = 0, public _z = 0, public w = 1) {
        super();
    }
    copy(): Point {
        return new Point(this._x, this._y, this._z, this.w);
    }
    norm2(): number {
        return (this._x * this._x + this._y * this._y + this._z * this._z) / this.w / this.w;
    }
    norm(): number {
        return Math.sqrt(this.norm2());
    }
    add(other: Point): Point {
        return new Point(
            this._x * other.w + other._x * this.w,
            this._y * other.w + other._y * this.w,
            this._z * other.w + other._z * this.w,
            this.w * other.w);
    }
    scale(c: number): Point {
        return new Point(
            this._x * c,
            this._y * c,
            this._z * c,
            this.w);
    }
    set(o: Point): Point {
        this._x = o._x; this._y = o._y; this._z = o._z; this.w = o.w;
        return this;
    }
    normalize(): Point {
        return new Point(
            this._x / this.w,
            this._y / this.w,
            this._z / this.w,
            1);
    }
    normalizeEq(): Point {
        this._x /= this.w;
        this._y /= this.w;
        this._z /= this.w;
        this.w = 1; return this;
    }
    get x(): number {
        return this._x / this.w;
    }
    get y(): number {
        return this._y / this.w;
    }
    get z(): number {
        return this._z / this.w;
    }
    set x(v: number) {
        this._x = v * this.w;
    }
    set y(v: number) {
        this._y = v * this.w;
    }
    set z(v: number) {
        this._z = v * this.w;
    }
    index(v: number): number {
        return [this._x, this._y, this._z, this.w][v];
    }
    get xyzw(): number[] {
        return [this._x, this._y, this._z, this.w];
    }
    set xyzw(v: number[]) {
        this._x = v[0];
        this._y = v[1];
        this._z = v[2];
        this.w = v[3];
    }
    get arr(): number[] {
        return [this._x, this._y, this._z, this.w];
    }
    set arr(v: number[]) {
        this._x = v[0];
        this._y = v[1];
        this._z = v[2];
        this.w = v[3];
    }
    get xyz(): number[] {
        return [this.x, this.y, this.z];
    }
    set xyz(v: number[]) {
        this.x = v[0];
        this.y = v[1];
        this.z = v[2];
    }

    addEq(other: Point): Point {
        this._x = this._x * other.w + other._x * this.w;
        this._y = this._y * other.w + other._y * this.w;
        this._z = this._z * other.w + other._z * this.w;
        this.w *= other.w;
        return this;
    }
    scaleEq(c: number): Point {
        this._x *= c;
        this._y *= c;
        this._z *= c;
        return this;
    }

    //point specific ops
    sub(o: Point): Point {
        return new Point(this.x - o.x, this.y - o.y, this.z - o.z);
    }
    subEq(o: Point): Point {
        this.x -= o.x; this.y -= o.y; this.z -= o.z;
        return this;
    }
    mul(o: Point): Point {
        return new Point(this.x * o.x, this.y * o.y, this.z * o.z);
    }
    mulEq(o: Point): Point {
        this.x *= o.x; this.y *= o.y; this.z *= o.z;
        return this;
    }
    div(o: Point): Point {
        return new Point(this.x / o.x, this.y / o.y, this.z / o.z);
    }
    divEq(o: Point): Point {
        this.x /= o.x; this.y /= o.y; this.z /= o.z;
        return this;
    }
    neg(): Point {
        return new Point(-this.x, -this.y, -this.z);
    }
    negEq(): Point {
        this.x = -this.x; this.y = -this.y; this.z = -this.z;
        return this;
    }

    dot(o: Point): number {
        return this.x * o.x + this.y * o.y + this.z * o.z;
    }
    mag2(f = 1): number {
        return (this.x * f) ** 2 + (this.y * f) ** 2 + (this.z * f) ** 2;
    }
    mag(): number {
        return Math.hypot(this.x, this.y, this.z);
    }
    cross(o: Point): Point {
        return new Point(this.y * o.z - this.z * o.y, this.z * o.x - this.x * o.z, this.x * o.y - this.y * o.x);
    }
    crossEq(o: Point): Point {
        const ox = this.x;
        this.x = this.y * o.z - this.z * o.y;
        const oy = this.y;
        this.y = this.z * o.x - ox * o.z;
        this.z = ox * o.y - oy * o.x;
        return this;
    }
    normEq(l = 1): Point {
        const m = this.mag()
        if (m == 0) {
            this.x = l;
            return this;
        }
        return this.scaleEq(l / m);
    }
    clampMag(l = 0, h = 1): Point {
        //clamps magnitude to range [l,h]
        const m = this.mag()
        if (m < l) {
            if (m == 0) {
                return new Point(l, 0, 0);
            }
            return this.scale(l / m);
        }
        if (m > h) {
            return this.scale(h / m);
        }
        return this.copy();
    }
    clampMagEq(l = 0, h = 1): Point {
        const m = this.mag()
        if (m < l) {
            if (m == 0) {
                this.x = l;
                return this;
            }
            return this.scaleEq(l / m);
        }
        if (m > h) {
            return this.scaleEq(h / m);
        }
        return this;
    }
    clamp(l: Point, h: Point): Point {
        //clamps components independently
        return this.copy().clampEq(l, h);
    }
    clampEq(l: Point, h: Point): Point {
        this.x = Math.min(h.x, Math.max(l.x, this.x));
        this.y = Math.min(h.y, Math.max(l.y, this.y));
        this.z = Math.min(h.z, Math.max(l.z, this.z));
        return this;
    }

    min(...ps: Point[]): Point {
        return this.copy().minEq(...ps);
    }
    minEq(...ps: Point[]): Point {
        const r = this;
        for (let p of ps) {
            r.x = Math.min(r.x, p.x);
            r.y = Math.min(r.y, p.y);
            r.z = Math.min(r.z, p.z);
        }
        return r;
    }
    max(...ps: Point[]): Point {
        return this.copy().maxEq(...ps);
    }
    maxEq(...ps: Point[]): Point {
        const r = this;
        for (let p of ps) {
            r.x = Math.max(r.x, p.x);
            r.y = Math.max(r.y, p.y);
            r.z = Math.max(r.z, p.z);
        }
        return r;
    }

    func(f: (n: number) => number): Point {
        return this.copy().funcEq(f);
    }
    funcEq(f: (n: number) => number): Point {
        this.x = f(this.x);
        this.y = f(this.y);
        this.z = f(this.z);
        return this;
    }

    sign(): Point {
        return this.copy().signEq();
    }
    signEq(): Point {
        return this.funcEq(Math.sign);
    }




    removeComponent(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.sub(v.scale(m));
    }
    removeComponentEq(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.subEq(v.scale(m));
    }
    removeBoundedComponent(v: Point, l = 0, h = 1): Point {
        return this.copy().removeBoundedComponentEq(v, l, h);
    }
    removeBoundedComponentEq(v: Point, l = 0, h = 1): Point {
        const m = Math.min(Math.max(this.dot(v) / v.mag2(), l), h);
        return this.subEq(v.scale(m));
    }
    extractComponent(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return v.scale(m);
    }
    extractComponentEq(v: Point): Point {
        const m = this.dot(v) / v.mag2();
        return this.set(v.scale(m));
    }
    bounce(n: Point, r: number): Point {
        const m = this.dot(n) / n.mag2();
        return this.sub(n.scale(m * (1 + r)));
    }
    bounceEq(n: Point, r: number): Point {
        const m = this.dot(n) / n.mag2();
        return this.subEq(n.scale(m * (1 + r)));
    }
    bounceNormal(n: Point, r: number): Point {
        const m = this.dot(n);
        return this.sub(n.scale(m * (1 + r)));
    }
    bounceNormalEq(n: Point, r: number): Point {
        const m = this.dot(n);
        return this.subEq(n.scale(m * (1 + r)));
    }


    lerp(p: Point, a: number): Point {
        return this.scale(1 - a).addEq(p.scale(a));
    }
    lerpEq(p: Point, a: number): Point {
        return this.scaleEq(1 - a).addEq(p.scale(a));
    }


    get v(): THREE.Vector3 {
        return new THREE.Vector3(this.x, this.y, this.z);
    }
    set v(v: THREE.Vector3) {
        this.x = v.x; this.y = v.y; this.z = v.z;
    }

    setXYZof(o: any) {
        o.x = this.x;
        o.y = this.y;
        o.z = this.z;
    }

    get perp(): Point {
        return ((Math.abs(this.z) < Math.abs(this.x) ? new Point(this.y, -this.x, 0) : new Point(0, -this.z, this.y)).crossEq(this)).normEq(this.mag());
    }

    get perp2(): Point {
        return ((Math.abs(this.z) < Math.abs(this.x) ? new Point(this.y, -this.x, 0) : new Point(0, -this.z, this.y)).crossEq(this).crossEq(this)).normEq(this.mag());
    }

    toUVW(o: Point): Point {
        //decomposes o into u,v,w components based on this.perp,this.perp2,this
        let p = this.perp;
        let p2 = this.perp2;
        return new Point(o.dot(p) / p.mag2(), o.dot(p2) / p2.mag2(), o.dot(this) / this.mag2());
    }
    fromUVW(o: Point): Point {
        let p = this.perp;
        let p2 = this.perp2;
        return this.scale(o.z).addEq(p.scaleEq(o.x)).addEq(p2.scaleEq(o.y));
    }


    /*eval(p: Point, r = Infinity, t: AffineTransform = null): number {
        let pt = t == null ? this : t.apply(this);
        let npm = pt.sub(p).mag2();
        if (npm < r * r) {
            return Math.sqrt(npm);
        }
        return Infinity;
    }
    gradient(p: Point, t: AffineTransform = null): Point {
        let pt = t == null ? this : t.apply(this);
        return p.sub(pt).normEq(1);
    }
    get boundingBox(): Box {
        return new Box(this, this);
    }
    get boundingSphere(): Sphere {
        return new Sphere(this, 0);
    }

    get xy(): Point2D {
        return new Point2D(this.x, this.y);
    }
    set xy(p: Point2D) {
        this.x = p.x; this.y = p.y;
    }

    //as Line2D
    l_toUV(p: Point2D): Point2D {
        //line is this.xy•p = this.z
        let r = this.xy.toUV(p);
        r.y -= this.z / this.xy.mag2();
        //
        return r;
    }
    l_fromUV(p: Point2D): Point2D {
        return this.xy.fromUV(new Point2D(p.x, p.y + this.z / this.xy.mag2()));
    }
    l_intersect(p: Point): number {
        let denom = this.xy.perp.dot(p.xy);
        if (denom == 0) {
            return -Infinity;
        }
        return (p.z - this.xy.dot(p.xy) * this.z) / denom;
    }
    l_unitSegmentNearest(p: Point2D, n: number = 0): Point2D {
        let uv = this.l_toUV(p);
        uv.x = Math.min(1, Math.max(0, uv.x - n)) + n;
        uv.y = 0;
        return this.l_fromUV(uv);
    }
    l_unitSegmentNearestInPlane(p: Point2D, n = 0): Point2D {
        let uv = this.l_toUV(p);
        uv.x = Math.min(1, Math.max(0, uv.x - n)) + n;
        uv.y = Math.min(0, uv.y);
        return this.l_fromUV(uv);
    }
    l_norm(n: number = 1) {
        let r = n / this.xy.mag();
        this.z *= r;
        this.xy = this.xy.scaleEq(r);
        (this as unknown as Line2D).start /= r;
        (this as unknown as Line2D).end /= r;
        return this;
    }
	*/


}






abstract class Transformation<T extends Transformation<T, V>, V>{
    abstract apply(v: V): V;
    abstract before(o: T): T;
    after(o: T): T {
        return o.before(this as any as T);
    }
    abstract inverse(): T;
}
abstract class LinearTransformation<T extends LinearTransformation<T, V>, V> extends Transformation<T, V>{

}





@Saveable.register
class HTMatrix extends Vector<HTMatrix> implements Saveable, LinearTransformation<HTMatrix, Point> {
    _saveName?: string;
    //| a | d | g | tx|
    //| b | e | h | ty|
    //| c | f | i | tz|
    //| 0 | 0 | 0 | 1 |
    constructor();
    constructor(a?: number, b?: number, c?: number, d?: number, e?: number, f?: number, g?: number, h?: number, i?: number, tx?: number, ty?: number, tz?: number);
    constructor(public a = 1, public b = 0, public c = 0, public d = 0, public e = 1, public f = 0, public g = 0, public h = 0, public i = 1, public tx = 0, public ty = 0, public tz = 0) { super(); }
    set(o: HTMatrix): HTMatrix {
        this.a = o.a; this.b = o.b; this.c = o.c; this.d = o.d; this.e = o.e; this.f = o.f; this.g = o.g; this.h = o.h; this.i = o.i; this.tx = o.tx; this.ty = o.ty; this.tz = o.tz;
        return this;
    }
    copy(): HTMatrix {
        return new HTMatrix(this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h, this.i, this.tx, this.ty, this.tz);
    }
    add(o: HTMatrix): HTMatrix {
        return new HTMatrix(this.a + o.a, this.b + o.b, this.c + o.c, this.d + o.d, this.e + o.e, this.f + o.f, this.g + o.g, this.h + o.h, this.i + o.i, this.tx + o.tx, this.ty + o.ty, this.tz + o.tz);
    }
    addEq(o: HTMatrix): HTMatrix {
        this.a += o.a; this.b += o.b; this.c += o.c; this.d += o.d; this.e += o.e; this.f += o.f; this.g += o.g; this.h += o.h; this.i += o.i; this.tx += o.tx; this.ty += o.ty; this.tz += o.tz;
        return this;
    }
    scale(s: number): HTMatrix {
        return new HTMatrix(this.a * s, this.b * s, this.c * s, this.d * s, this.e * s, this.f * s, this.g * s, this.h * s, this.i * s, this.tx * s, this.ty * s, this.tz * s);
    }
    scaleEq(s: number): HTMatrix {
        this.a *= s; this.b *= s; this.c *= s; this.d *= s; this.e *= s; this.f *= s; this.g *= s; this.h *= s; this.i *= s; this.tx *= s; this.ty *= s; this.tz *= s;
        return this;
    }
    neg(): HTMatrix {
        return new HTMatrix(-this.a, -this.b, -this.c, -this.d, -this.e, -this.f, -this.g, -this.h, -this.i, -this.tx, -this.ty, -this.tz);
    }
    negEq(): HTMatrix {
        this.a = -this.a; this.b = -this.b; this.c = -this.c; this.d = -this.d; this.e = -this.e; this.f = -this.f; this.g = -this.g; this.h = -this.h; this.i = -this.i; this.tx = -this.tx; this.ty = -this.ty; this.tz = -this.tz;
        return this;
    }
    sub(o: HTMatrix): HTMatrix {
        return new HTMatrix(this.a - o.a, this.b - o.b, this.c - o.c, this.d - o.d, this.e - o.e, this.f - o.f, this.g - o.g, this.h - o.h, this.i - o.i, this.tx - o.tx, this.ty - o.ty, this.tz - o.tz);
    }
    subEq(o: HTMatrix): HTMatrix {
        this.a -= o.a; this.b -= o.b; this.c -= o.c; this.d -= o.d; this.e -= o.e; this.f -= o.f; this.g -= o.g; this.h -= o.h; this.i -= o.i; this.tx -= o.tx; this.ty -= o.ty; this.tz -= o.tz;
        return this;
    }

    //| a | d | g | tx|
    //| b | e | h | ty|
    //| c | f | i | tz|
    //| 0 | 0 | 0 | 1 |
    index(row: number, col: number | null = null) {
        if (col == null) {
            return [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h, this.i, this.tx, this.ty, this.tz][row];
        }
        return [this.a, this.b, this.c, 0, this.d, this.e, this.f, 0, this.g, this.h, this.i, 0, this.tx, this.ty, this.tz, 1][row + 4 * col];
    }
    row(n: number): Point {
        return new Point([this.a, this.b, this.c, 0][n], [this.d, this.e, this.f, 0][n], [this.g, this.h, this.i, 0][n], [this.tx, this.ty, this.tz, 1][n]);
    }
    col(n: number): Point {
        return new Point([this.a, this.d, this.g, this.tx][n], [this.b, this.e, this.h, this.ty][n], [this.c, this.f, this.i, this.tz][n], [0, 0, 0, 1][n]);
    }
    inverse(): HTMatrix {

        const s0: number = this.a * this.e - this.b * this.d;
        const s1: number = this.a * this.h - this.b * this.g;
        const s2: number = this.a * this.ty - this.b * this.tx;
        const s3: number = this.d * this.h - this.e * this.g;
        const s4: number = this.d * this.ty - this.e * this.tx;
        const s5: number = this.g * this.ty - this.h * this.tx;

        const det = (s0 * this.i - s1 * this.f + s3 * this.c);
        const invdet: number = 1 / det;

        return new HTMatrix(
            (this.e * this.i - this.h * this.f) * invdet,
            (-this.b * this.i + this.h * this.c) * invdet,
            (this.b * this.f - this.e * this.c) * invdet,
            (-this.d * this.i + this.g * this.f) * invdet,
            (this.a * this.i - this.g * this.c) * invdet,
            (-this.a * this.f + this.d * this.c) * invdet,
            s3 * invdet,
            -s1 * invdet,
            s0 * invdet,
            (-this.f * s5 + this.i * s4 - this.tz * s3) * invdet,
            (this.c * s5 - this.i * s2 + this.tz * s1) * invdet,
            (-this.c * s4 + this.f * s2 - this.tz * s0) * invdet);

    }

    apply(p: Point) {
        return new Point(
            p._x * this.a + p._y * this.d + p._z * this.g + p.w * this.tx,
            p._x * this.b + p._y * this.e + p._z * this.h + p.w * this.ty,
            p._x * this.c + p._y * this.f + p._z * this.i + p.w * this.tz,
            p.w);
    }
    lapply(p: Point) {
        return new Point(
            p._x * this.a + p._y * this.b + p._z * this.c,
            p._x * this.d + p._y * this.e + p._z * this.f,
            p._x * this.g + p._y * this.h + p._z * this.i,
            p._x * this.tx + p._y * this.ty + p._z * this.tz + p.w);
    }
    after(o: HTMatrix): HTMatrix {
        // this*O * point
        return new HTMatrix(
            this.a * o.a + this.d * o.b + this.g * o.c,
            this.b * o.a + this.e * o.b + this.h * o.c,
            this.c * o.a + this.f * o.b + this.i * o.c,

            this.a * o.d + this.d * o.e + this.g * o.f,
            this.b * o.d + this.e * o.e + this.h * o.f,
            this.c * o.d + this.f * o.e + this.i * o.f,

            this.a * o.g + this.d * o.h + this.g * o.i,
            this.b * o.g + this.e * o.h + this.h * o.i,
            this.c * o.g + this.f * o.h + this.i * o.i,

            this.a * o.tx + this.d * o.ty + this.g * o.tz + this.tx,
            this.b * o.tx + this.e * o.ty + this.h * o.tz + this.ty,
            this.c * o.tx + this.f * o.ty + this.i * o.tz + this.tz
        );
    }
    before(o: HTMatrix): HTMatrix { return o.after(this); }

}

@Saveable.register
class Quaternion extends Vector<Quaternion> implements LinearTransformation<Quaternion, Point>, Saveable {
    _saveName?: string;

    public r: number;
    public i: number;
    public j: number;
    public k: number;
    constructor();
    constructor(r: number, i: number, j: number, k: number);
    constructor(aax: number, aay: number, aaz: number);
    constructor(aa: Point);
    constructor(a?: Point | number, b?: number, c?: number, d: number | null = null) {
        super();
        this.r = 1;
        this.i = 0;
        this.j = 0;
        this.k = 0;
        if (a != null) {
            if ((a as Point).isPoint == true) {
                c = (a as Point).z;
                b = (a as Point).y;
                a = (a as Point).x;
            }
            if (d == null) {
                //axis angle
                const theta = Math.sqrt((a as number) * (a as number) + b * b + c * c);
                this.r = Math.cos(theta / 2);
                if (theta != 0) {
                    const s = Math.sin(theta / 2) / theta;
                    this.i = (a as number) * s;
                    this.j = b * s;
                    this.k = c * s;
                }
            } else {
                this.r = a as number;
                this.i = b; this.j = c; this.k = d;
            }
        }
    }

    set(o: Quaternion): Quaternion {
        this.r = o.r; this.i = o.i; this.j = o.j; this.k = o.k;
        return this;
    }
    copy(): Quaternion {
        return new Quaternion(this.r, this.i, this.j, this.k);
    }
    add(o: Quaternion): Quaternion {
        return new Quaternion(this.r + o.r, this.i + o.i, this.j + o.j, this.k + o.k);
    }
    addEq(o: Quaternion): Quaternion {
        this.r += o.r; this.i += o.i; this.j += o.j; this.k += o.k;
        return this;
    }
    sub(o: Quaternion): Quaternion {
        return new Quaternion(this.r - o.r, this.i - o.i, this.j - o.j, this.k - o.k);
    }
    subEq(o: Quaternion): Quaternion {
        this.r -= o.r; this.i -= o.i; this.j -= o.j; this.k -= o.k;
        return this;
    }
    scale(s: number): Quaternion {
        return new Quaternion(this.r * s, this.i * s, this.j * s, this.k * s);
    }
    scaleEq(s: number): Quaternion {
        this.r *= s; this.i *= s; this.j *= s; this.k *= s;
        return this;
    }


    neg(): Quaternion {
        return new Quaternion(-this.r, -this.i, -this.j, -this.k);
    }
    negEq(): Quaternion {
        this.r = -this.r; this.i = -this.i; this.j = -this.j; this.k = -this.k;
        return this;
    }


    index(v: number): number {
        return [this.r, this.i, this.j, this.k][v];
    }
    get arr(): number[] {
        return [this.r, this.i, this.j, this.k];
    }
    set arr(v: number[]) {
        this.r = v[0];
        this.i = v[1];
        this.j = v[2];
        this.k = v[3];
    }
    get xyzw(): number[] {
        return [this.i, this.j, this.k, this.r];
    }
    set xyzw(v: number[]) {
        this.i = v[0];
        this.j = v[1];
        this.k = v[2];
        this.r = v[3];
    }


    inverse(): Quaternion {
        const m2 = this.norm2();
        return this.conjugate().scaleEq(1 / m2);
    }
    inverseEq(): Quaternion {
        const m2 = this.norm2();
        return this.conjugateEq().scaleEq(1 / m2);
    }
    conjugate(): Quaternion {
        return new Quaternion(this.r, -this.i, -this.j, -this.k);
    }
    conjugateEq(): Quaternion {
        this.i = -this.i; this.j = -this.j; this.k = -this.k;
        return this;
    }
    norm2(): number {
        return this.r * this.r + this.i * this.i + this.j * this.j + this.k * this.k;
    }
    norm(): number {
        return Math.sqrt(this.norm2());
    }
    normalize(): Quaternion {
        const m = this.norm();
        return new Quaternion(this.r / m, this.i / m, this.j / m, this.k / m);
    }
    multiply(o: Quaternion): Quaternion {
        return new Quaternion(this.r * o.r - this.i * o.i - this.j * o.j - this.k * o.k,
            this.r * o.i + this.i * o.r + this.j * o.k - this.k * o.j,
            this.r * o.j - this.i * o.k + this.j * o.r + this.k * o.i,
            this.r * o.k + this.i * o.j - this.j * o.i + this.k * o.r);
    }
    multiplyEq(o: Quaternion): Quaternion {
        return this.set(this.multiply(o));
    }



    apply(p: Point): Point {
        const res = this.multiply(new Quaternion(0, p._x, p._y, p._z)).multiplyEq(this.conjugate());
        return new Point(res.i, res.j, res.k, p.w);
    }
    after(o: Quaternion): Quaternion {
        //if q = ab, rot is q p q° = ab p (ab)° = a (b p b°) a° = b.before(a) = a.after(b)
        return this.multiply(o);
    }
    before(o: Quaternion): Quaternion {
        return o.multiply(this);
    }

    matrix(): HTMatrix {
        return new HTMatrix(...this.apply(new Point(1, 0, 0, 0)).arr.slice(0, 3), ...this.apply(new Point(0, 1, 0, 0)).arr.slice(0, 3), ...this.apply(new Point(0, 0, 1, 0)).arr.slice(0, 3), 0, 0, 0)
    }



    swingTwistDecomp(x: number, y: number, z: number): Quaternion[] {
        //axis is assumed normed

        //vector3 ra( rotation.x, rotation.y, rotation.z ); // rotation axis

        //vector3 p = projection( ra, direction ); // return projection v1 on to v2  (parallel component)
        const pm = x * this.i + y * this.j + z * this.k;
        //twist.set( p.x, p.y, p.z, rotation.w );
        if ((pm < 0 ? -pm : pm) < .001) {
            return [this.copy(), new Quaternion()];
        }
        const twist = new Quaternion(this.r, x * pm, y * pm, z * pm).normalize();
        //swing = rotation * twist.conjugated();
        return [this.multiply(twist.conjugate()), twist];
    }

}






export {
    Vector, NormedVector,
    WeightedVector,
    Color, Scalar, NDVector, NDMetaVector,
    Point, Style, Angle2D,
    Transformation, LinearTransformation,
    HTMatrix, Quaternion
}
