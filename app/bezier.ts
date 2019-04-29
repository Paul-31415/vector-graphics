
import { Vector } from "./vectors";

interface Curve<T> {
    get(t: number): T;
    derivative(): Curve<T>;
}


// for use in Bezier
class WeightedVector<T extends Vector<any>> implements Vector<WeightedVector<T>> {
    public v: T;
    constructor(V: T, public w = 1, d = false) { if (!d) { this.v = V.scale(w); } else { this.v = V; } }
    copy(): Vector<WeightedVector<T>> {
        return new WeightedVector<T>(this.v.copy(), this.w, true);
    }
    add(o: Vector<WeightedVector<T>>): Vector<WeightedVector<T>> {
        return new WeightedVector<T>(this.v.add(o.v), this.w + o.w, true)

    }
    scale(s: number): Vector<WeightedVector<T>> {
        if (s >= 0) {
            return new WeightedVector<T>(this.v.scale(s), this.w * s, true);
        } else {
            return new WeightedVector<T>(this.v.scale(s), this.w * -s, true);
        }
    }
    zero(): Vector<WeightedVector<T>> {
        return new WeightedVector<T>(this.v.zero(), 0, true);
    }

    get(): T {
        return this.v.scale(1 / this.w);
    }
    isAWeightedVector(): boolean {
        return true;
    }
}

function isWeighted<T>(a: (T | WeightedVector<T>)): a is WeightedVector<T> {
    if ((a as WeightedVector<T>).isAWeightedVector) {
        return (a as WeightedVector<T>).isAWeightedVector();
    }
    return false;
}

class Bezier<T extends Vector<any>> implements Vector<Bezier<T>>, Curve<T> {
    controlPoints: WeightedVector<T>[] = [];
    constructor(cps: Array<T | WeightedVector<T>>) {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[i] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[i] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
    }
    derivative(): Curve<T> {
        var cps: WeightedVector<T>[] = [];
        if (this.order() == 0) {
            return new Bezier<T>([this.controlPoints[0].zero()]);
        }
        for (var i = 0; i < this.order(); i++) {
            cps[i] = this.controlPoints[i + 1].add(this.controlPoints[i].scale(-1)).scale(this.controlPoints.length);
        }
        return new Bezier<T>(cps);
    }

    order(): number {
        //console.log(this);
        return this.controlPoints.length - 1;
    }

    copy(): Vector<Bezier<T>> {
        var c2 = new Array<WeightedVector<T>>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2.concat((this.controlPoints[i]).copy());
        }
        return new Bezier<T>(c2);
    }
    add(o: Vector<Bezier<T>>): Vector<Bezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrder().add(o);
        } else {
            if (o.order() < this.order()) {
                return o.incOrder().add(this);
            }
            else {

                var c2 = new Array<T | WeightedVector<T>>();
                for (var i = 0; i < this.controlPoints.length; i++) {
                    c2[i] = this.controlPoints[i].add(o.controlPoints[i]);

                }
                return new Bezier<T>(c2);
            }
        }
    }
    zero(): Vector<Bezier<T>> {
        return new Bezier<T>([this.controlPoints[0].zero()]);

    }
    scale(n: number): Vector<Bezier<T>> {
        var c2 = new Array<WeightedVector<T>>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2[i] = this.controlPoints[i].scale(n);
        }
        return new Bezier<T>(c2);
    }

    get(t: number): T {
        if (this.order() == 0) {
            return this.controlPoints[0].copy().get();
        }
        var res = this.controlPoints[0].zero();
        var bin = 1;
        for (var i = 0; i < this.controlPoints.length; i++) {
            res = res.add(this.controlPoints[i].scale(
                bin *
                Math.pow((1 - t), this.order() - i) *
                Math.pow(t, i)
            ));
            bin *= (this.order() - i) / (i + 1);
        }
        return res.get();
    }
    incOrder(): Bezier<T> {
        const n = this.order();
        if (n == 0) {
            return new Bezier<T>([this.controlPoints[0].copy(), this.controlPoints[0].copy()]);
        }
        const k = n + 1;
        var v = new Array<WeightedVector<T>>();
        v[0] = this.controlPoints[0].copy();
        v[k] = this.controlPoints[n].copy();
        for (var i = 1; i <= n; i++) {
            v[i] = this.controlPoints[i].scale(n - i + 1).add(this.controlPoints[i - 1].scale(i)).scale(1 / k);
        }
        return new Bezier<T>(v);
    }
}
/*

class RationalBezier<T extends Vector<any>> extends Bezier<T> {
    constructor(cps: T[], public controlWeights: number[]) {
        super(cps);
    }
    order(): number {
        return this.controlPoints.length - 1;
    }

    copy(): Vector<RationalBezier<T>> {
        var c2 = new Array<T>();
        var w2 = new Array<number>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2.concat(this.controlPoints[i].copy())
        }
        for (var j in this.controlWeights) {
            w2[j] = this.controlWeights[j];
        }
        return new RationalBezier<T>(c2, w2);
    }
    add(o: Vector<RationalBezier<T>>): Vector<RationalBezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrder().add(o);
        } else {
            if (o.order() < this.order()) {
                return o.incOrder().add(this);
            }
            else {

                var c2 = new Array<T>();
                var w2 = new Array<number>();
                for (var i = 0; i < this.controlPoints.length; i++) {
                    c2.concat(this.controlPoints[i].add(o.controlPoints[i]));
                    w2[i] = this.controlWeights[i] + o.controlWeights[i];
                }
                return new RationalBezier<T>(c2, w2);
            }
        }
    }
    zero(): Vector<RationalBezier<T>> {
        return new RationalBezier<T>([this.controlPoints[0].zero()], [1]);

    }
    scale(n: number): Vector<RationalBezier<T>> {
        var c2 = new Array<T>();
        var w2 = new Array<number>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2.concat(this.controlPoints[i].scale(n));
            w2[i] = this.controlWeights[i] * n;
        }
        return new RationalBezier<T>(c2, w2);
    }

    get(t: number): T {
        if (this.order() == 0) {
            return this.controlPoints[0].copy();
        }
        var res = this.controlPoints[0].zero();
        var resw = 0;
        var bin = 1;
        for (var i = 0; i < this.controlPoints.length; i++) {
            const f = bin *
                Math.pow((1 - t), this.order() - i) *
                Math.pow(t, i);
            resw += this.controlWeights[i] * f;
            res = res.add(this.controlPoints[i].scale(
                f
            ));
            bin *= (this.order() - i) / (i + 1);
        }
        return res.scale(1 / resw);
    }
    incOrder(): RationalBezier<T> {
        const n = this.order();
        const k = n + 1;
        var v = new Array<T>();
        var vn = new Array<number>();
        v[0] = this.controlPoints[0].copy();
        v[k] = this.controlPoints[n].copy();
        for (var i = 1; i <= n; i++) {
            v[i] = this.controlPoints[i].scale(n - i + 1).add(this.controlPoints[i - 1].scale(i)).scale(1 / k);
            vn[i] = (this.controlWeights[i] * (n - i + 1) + (this.controlWeights[i - 1] * (i))) * (1 / k);
        }
        return new RationalBezier<T>(v, vn);
    }

}


*/



export {
    Curve, Bezier, WeightedVector
}
