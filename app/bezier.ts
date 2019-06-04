
import { Vector, Point } from "./vectors";
import { Brush } from "./brush";
import { Drawable } from "./drawable";
import { PtTransform } from "./transform";







interface Curve<T> {
    get(t: number): T;
    derivative(): Curve<T>;
}

class PiecewiseCurve<T extends Vector<any>> implements Curve<T>{
    /*copy(): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].copy();
        }
        return new PiecewiseCurve(...cs);
    }
    add(other: Vector<PiecewiseCurve<T>>): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].add(other.parts[i]);
        }
        return new PiecewiseCurve(...cs);
    }
    scale(s: number): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].copy();
        }
        return new PiecewiseCurve(...cs);
    }
    zero(): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].copy();
        }
        return new PiecewiseCurve(...cs);
    }
	*/


    public parts: Array<Curve<T>>;
    constructor(...parts: Array<Curve<T>>) { this.parts = parts; }
    get(t: number): T {
        if (t < 0) {
            return this.parts[0].get(t * this.parts.length);
        }
        if (t >= 1) {
            return this.parts[this.parts.length - 1].get(1 + (t - 1) * this.parts.length);
        }
        const tid = (Math.floor(t * this.parts.length));
        return this.parts[tid].get((t * this.parts.length) - tid);
    }
    derivative(): Curve<T> {
        var ds = new Array<Curve<T>>();
        for (var i in this.parts) {
            ds[i] = this.parts[i].derivative();
        }
        return new PiecewiseCurve(...ds);
    }
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
    addEq(o: Vector<WeightedVector<T>>): Vector<WeightedVector<T>> {
        this.v.addEq(o.v);
        this.w += o.w;
        return this;
    }
    addEqDiscardOther(o: Vector<WeightedVector<T>>): Vector<WeightedVector<T>> {
        this.v.addEqDiscardOther(o.v);
        this.w += o.w;
        return this;
    }
    scaleEq(s: number): Vector<WeightedVector<T>> {
        if (s >= 0) {
            this.v.scaleEq(s);
            this.w *= s;
            return this;
        } else {
            this.v.scaleEq(s);
            this.w *= -s;
            return this;
        }
    }
    zeroEq(): Vector<WeightedVector<T>> {
        this.w = 0;
        this.v.zeroEq();
        return this;
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

function continuize<T>(level = 1, ...bezs: Array<Bezier<T>>) {
    for (var i in bezs) {
        //todo
    }
}

/*class BSpline<T extends Vector<any>> implements Vector<Bezier<T>>, Curve<T> {
    controlPoints: WeightedVector<T>[] = [];
    knots: number[] = [];
    constructor(cps: Array<T | WeightedVector<T>>) {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[i] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[i] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
    }

}*/




class Bezier<T extends Vector<any>> implements Vector<Bezier<T>>, Curve<T> {
    isBezier = true;
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
    deCastlejau(t: number): WeightedVector<T>[][] {
        var ans: WeightedVector<T>[][] = [this.controlPoints];
        while (ans[ans.length - 1].length > 1) {
            ans.push([]);
            for (var i = 0; i < ans[ans.length - 2].length - 1; i++) {
                ans[ans.length - 1].push(ans[ans.length - 2][i + 1].scale(t).addEqDiscardOther(ans[ans.length - 2][i].scale(1 - t)));
            }
        }
        return ans;
    }
    shorten(t: number): Bezier<T> {
        for (var j = 0; j < this.controlPoints.length; j++) {
            for (var i = this.controlPoints.length - 1; i > j; i--) {
                this.controlPoints[i].scaleEq(t).addEqDiscardOther(this.controlPoints[i - 1].scale(1 - t));
            }
        }
        return this;
    }
    reverse(): Bezier<T> {
        this.controlPoints.reverse();
        return this;
    }

    derivative(): Curve<T> {
        var cps: WeightedVector<T>[] = [];
        if (this.order() == 0) {
            return new Bezier<T>([this.controlPoints[0].zero()]);
        }
        for (var i = 0; i < this.order(); i++) {
            cps[i] = this.controlPoints[i + 1].add(this.controlPoints[i].scale(-1)).scaleEq(this.controlPoints.length);
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
            return this.incOrder().addEq(o);
        } else {
            if (o.order() < this.order()) {
                return o.incOrder().addEq(this);
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
    addEq(o: Vector<Bezier<T>>): Vector<Bezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrderEq().addEq(o);
        } else {
            if (o.order() < this.order()) {
                return this.addEqDiscardOther(o.incOrder());
            }
            else {

                for (var i = 0; i < this.controlPoints.length; i++) {
                    this.controlPoints[i].addEq(o.controlPoints[i]);

                }
                return this;
            }
        }
    }
    addEqDiscardOther(o: Vector<Bezier<T>>): Vector<Bezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrderEq().addEqDiscardOther(o);
        } else {
            if (o.order() < this.order()) {
                return this.addEqDiscardOther(o.incOrderEq());
            }
            else {
                for (var i = 0; i < this.controlPoints.length; i++) {
                    this.controlPoints[i].addEqDiscardOther(o.controlPoints[i]);
                }
                return this;
            }
        }
    }
    concat(...p: Array<T | WeightedVector<T>>): Bezier<T> {
        return new Bezier<T>((this.controlPoints as Array<T | WeightedVector<T>>).concat(p));
    }
    append(...cps: Array<T | WeightedVector<T>>): Bezier<T> {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[this.controlPoints.length] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[this.controlPoints.length] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
        return this;
    }
    zero(): Vector<Bezier<T>> {
        return new Bezier<T>([this.controlPoints[0].zero()]);

    }
    zeroEq(): Vector<Bezier<T>> {
        this.controlPoints = [this.controlPoints[0].zeroEq()];
        return this;
    }
    scale(n: number): Vector<Bezier<T>> {
        var c2 = new Array<WeightedVector<T>>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2[i] = this.controlPoints[i].scale(n);
        }
        return new Bezier<T>(c2);
    }

    scaleEq(n: number): Vector<Bezier<T>> {
        for (var i = 0; i < this.controlPoints.length; i++) {
            this.controlPoints[i].scaleEq(n);
        }
        return this;
    }

    get(t: number): T {
        if (this.order() == 0) {
            return this.controlPoints[0].copy().get();
        }
        var res = this.controlPoints[0].zero();
        var bin = 1;
        for (var i = 0; i < this.controlPoints.length; i++) {
            res.addEqDiscardOther(this.controlPoints[i].scale(
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
            v[i] = this.controlPoints[i].scale((n - i + 1) / k).addEqDiscardOther(this.controlPoints[i - 1].scale(i / k));
        }
        return new Bezier<T>(v);
    }
    incOrderEq(): Bezier<T> {
        const n = this.order();
        if (n == 0) {
            this.controlPoints[1] = this.controlPoints[0].copy();
            return this;
        }
        const k = n + 1;
        this.controlPoints[k] = this.controlPoints[n].copy();
        //this.controlPoints[n].scaleEq((n+1)/k); (n+1)/k = 1
        for (var i = n; i >= 1; i--) {
            this.controlPoints[i].scaleEq((n - i + 1) / (i + 1)).addEq(this.controlPoints[i - 1].scaleEq(i / k));
        }
        return this;
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
    Curve, Bezier, WeightedVector,
    PiecewiseCurve
}
