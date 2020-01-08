import { Saveable } from "./save";
import { Vector } from "./vector";

interface Curve<T> {
    get(t: number): T;
    derivative(): Curve<T>;
}


function py_mod(n: number, m = 1): number {
    return ((n % m) + m) % m;
}

@Saveable.register
class NURBS<T extends Vector<any>> extends Vector<NURBS<T>> implements Curve<T>, Saveable {
    _saveName?: string;
    public points: Array<{ weight: number, value: T }>;
    public knots: Array<number>;
    public degree: number;
    public cyclic: boolean;
    constructor(pts: Array<T> | null = null, degree = 0, weights: Array<number> | null = null, knots: Array<number> | null = null, cyclic = false) {
        super();
        if (pts != null) {
            this.degree = degree;
            this.cyclic = cyclic;
            if (knots == null) {
                this.knots = [];
                for (let i = 0; i < 1 + degree + pts.length; i += 1) {
                    this.knots[i] = i + 1;
                }
            } else {
                this.knots = knots;
            }
            this.points = []
            if (weights == null) {
                for (var i in pts) {
                    this.points[i] = { weight: 1, value: pts[i] };
                }
            } else {
                for (var i in pts) {
                    this.points[i] = { weight: weights[i], value: pts[i] };
                }
            }
        }
    }
    //::::Vector::::
    set(o: NURBS<T>): NURBS<T> {
        this.points = o.points;
        this.knots = o.knots;
        this.degree = o.degree;
        this.cyclic = o.cyclic;
        return this;
    }
    copy(): NURBS<T> {
        return new NURBS<T>().set(this);
    }
    scale(s: number): NURBS<T> {
        const r = new NURBS<T>();
        for (var i in this.points) {
            r.points[i] = { weight: this.points[i].weight * s, value: this.points[i].value.scale(s) };
        }
        r.knots = this.knots;
        r.degree = this.degree;
        r.cyclic = this.cyclic;
        return r;
    }
    add(o: NURBS<T>): NURBS<T> {
        throw o;
    }



    //::::Curve::::
    get(x: number) {
        if (this.cyclic) {
            x = py_mod(x, this.knots[this.knots.length - 1]);
        }
        //calc weights
        const i = this.getKnotOfInterest(x) - 1;

        const w = [1];//b(i=t,0,x)
        for (var k = 1; k < this.degree; k += 1) {

            const n = x - this.knots[i];
            const d = this.knots[i + k] - this.knots[i];
            if (d == 0) {
                w.push(w[w.length - 1]);
            } else {
                w.push(w[w.length - 1] * n / d);
            }
            for (var ioff = -1; ioff >= -w.length; ioff -= 1) {
                const cfs = this.b_func_cofactor(i + ioff, k, x);
                w[w.length + ioff] = w[w.length + ioff] * cfs[0] + w[w.length + ioff - 1] * cfs[1];
            }
            const n2 = this.knots[i + k + 2 - w.length] - x;
            const d2 = this.knots[i + k + 2 - w.length] - this.knots[i + 2 - w.length];
            if (d2 != 0) {
                w[0] *= n2 / d2;
            }
        }

        const resP = this.points[i].value.scale(this.points[i].weight * w[w.length - 1]);
        var resW = this.points[i].weight * w[w.length - 1];
        for (var wi = -2; wi >= -w.length; wi -= 1) {
            resP.addDEq(this.points[i + wi].value.scale(this.points[i + wi].weight * w[w.length + wi]));
            resW += this.points[i + wi].weight * w[w.length + wi];
        }
        return resP.scaleEq(1 / resW);
    }
    derivative(): NURBS<T> {

        var cps = new Array<T>();
        var cwd = new Array<number>();
        for (var i = 0; i < this.points.length - 1; i++) {
            const f = this.degree / (this.knots[i + this.degree] - this.knots[i]);
            cwd[i] = (this.points[i + 1].weight - this.points[i].weight) * f;
            cps[i] = this.points[i + 1].value.sub(this.points[i].value).scaleEq(f);
        }
        throw this;
        return new NURBS(cps, this.degree - 1, cwd, [...this.knots], this.cyclic);
    }





    //::::helper/misc::::

    getKnotOfInterest(t: number): number {

        //returns least i for knot[i] ≥ t
        let l = 0;
        let h = this.knots.length - 1;
        while (l < h) {
            const m = Math.floor((l + h) / 2);
            const v = this.knots[m];
            if (t > v) {
                l = m;
            } else {
                if (t < v) {
                    h = m;
                } else {
                    break;
                }
            }
        }
        while (l > 0 && this.knots[l] >= t) {
            l -= 1;
        }
        return l;
    }


    b_func_cofactor(i: number, k: number, x: number): number[] {
        //b(i,k,x) = (x-t(i))/(t(i+k)-t(i)) * b(i,k-1,x) + (t(i+k+1)-x)/(t(i+k+1)-t(i+1)) * b(i+1,k-1,x)
        const r = [x - this.knots[i], this.knots[i + k + 1] - x];
        const d1 = this.knots[i + k] - this.knots[i];
        if (d1 == 0) {
            r[0] = 1;
        } else {
            r[0] /= d1;
        }
        const d2 = this.knots[i + k + 1] - this.knots[i + 1];
        if (d2 == 0) {
            r[1] = 1;
        } else {
            r[1] /= d2;
        }
        return r;
    }

}

@Saveable.register
class NUBS<T extends Vector<any>> extends Vector<NUBS<T>> implements Curve<T>, Saveable {
    _saveName?: string;
    public points: Array<T>;
    public knots: Array<number>;
    public degree: number;
    public cyclic: boolean;
    constructor(pts: Array<T> | null = null, degree = 0, knots: Array<number> | null = null, cyclic = false) {
        super();
        if (pts != null) {
            this.degree = degree;
            this.cyclic = cyclic;
            if (knots == null) {
                this.knots = [];
                for (let i = 0; i < 1 + degree + pts.length; i += 1) {
                    this.knots[i] = i + 1;
                }
            } else {
                this.knots = knots;
            }
            this.points = pts;
        }
    }
    //::::Tower::::
    NURBS(): NURBS<T> {
        return new NURBS<T>(this.points, this.degree, null, this.knots, this.cyclic);
    }
    //::::Vector::::
    set(o: NUBS<T>): NUBS<T> {
        this.points = o.points;
        this.knots = o.knots;
        this.degree = o.degree;
        this.cyclic = o.cyclic;
        return this;
    }
    copy(): NUBS<T> {
        return new NUBS<T>().set(this);
    }
    scale(s: number): NUBS<T> {
        const r = new NUBS<T>();
        for (var i in this.points) {
            r.points[i] = this.points[i].scale(s);
        }
        r.knots = this.knots;
        r.degree = this.degree;
        r.cyclic = this.cyclic;
        return r;
    }
    add(o: NUBS<T>): NUBS<T> {
        throw o;
    }



    //::::Curve::::
    get(x: number) {
        if (this.cyclic) {
            x = py_mod(x, this.knots[this.knots.length - 1]);
        }
        //calc weights
        const i = this.getKnotOfInterest(x) + this.degree;

        const w = [1];//b(i=t,0,x)
        for (var k = 1; k < this.degree; k += 1) {

            const n = x - this.knots[i];
            const d = this.knots[i + k] - this.knots[i];
            if (d == 0) {
                w.push(w[w.length - 1]);
            } else {
                w.push(w[w.length - 1] * n / d);
            }
            for (var ioff = -1; ioff >= -w.length; ioff -= 1) {
                const cfs = this.b_func_cofactor(i + ioff, k, x);
                w[w.length + ioff] = w[w.length + ioff] * cfs[0] + w[w.length + ioff - 1] * cfs[1];
            }
            const n2 = this.knots[i + k + 2 - w.length] - x;
            const d2 = this.knots[i + k + 2 - w.length] - this.knots[i + 2 - w.length];
            if (d2 != 0) {
                w[0] *= n2 / d2;
            }
        }

        const res = this.points[i].scale(w[w.length - 1]);
        for (var wi = -2; wi >= -w.length; wi -= 1) {
            res.addDEq(this.points[i + wi].scale(w[w.length + wi]));
        }
        return res;
    }
    derivative(): NUBS<T> {

        var cps = new Array<T>();
        for (var i = 0; i < this.points.length - 1; i++) {
            const f = this.degree / (this.knots[i + this.degree] - this.knots[i]);
            cps[i] = this.points[i + 1].sub(this.points[i]).scaleEq(f);
        }
        return new NUBS(cps, this.degree - 1, [...this.knots], this.cyclic);
    }





    //::::helper/misc::::

    getKnotOfInterest(t: number): number {

        //returns least i for knot[i] ≥ t
        let l = 0;
        let h = this.knots.length - 1;
        while (l < h) {
            const m = Math.floor((l + h) / 2);
            const v = this.knots[m];
            if (t > v) {
                l = m;
            } else {
                if (t < v) {
                    h = m;
                } else {
                    break;
                }
            }
        }
        while (l > 0 && this.knots[l] >= t) {
            l -= 1;
        }
        return l;
    }


    b_func_cofactor(i: number, k: number, x: number): number[] {
        //b(i,k,x) = (x-t(i))/(t(i+k)-t(i)) * b(i,k-1,x) + (t(i+k+1)-x)/(t(i+k+1)-t(i+1)) * b(i+1,k-1,x)
        const r = [x - this.knots[i], this.knots[i + k + 1] - x];
        const d1 = this.knots[i + k] - this.knots[i];
        if (d1 == 0) {
            r[0] = 1;
        } else {
            r[0] /= d1;
        }
        const d2 = this.knots[i + k + 1] - this.knots[i + 1];
        if (d2 == 0) {
            r[1] = 1;
        } else {
            r[1] /= d2;
        }
        return r;
    }

}


@Saveable.register
class Bezier<T extends Vector<any>> extends Vector<Bezier<T>> implements Curve<T>, Saveable {
    _saveName?: string;
    constructor(public points: Array<T> = []) {
        super();
    }
    //::::Tower::::
    NURBS(): NURBS<T> {
        return this.NUBS().NURBS();
    }
    NUBS(): NUBS<T> {
        const knots = []
        for (let i = 0; i < 1 + this.points.length * 2; i += 1) {
            knots[i] = (i >= this.points.length) ? 1 : 0;
        }
        return new NUBS<T>(this.points, this.points.length, knots);
    }
    //::::Vector::::
    set(o: Bezier<T>): Bezier<T> {
        this.points = o.points;
        return this;
    }
    copy(): Bezier<T> {
        const cp: T[] = [];
        for (var i in this.points) {
            cp[i] = this.points[i].copy();
        }
        return new Bezier<T>(cp);
    }
    scale(s: number): Bezier<T> {
        const r = new Bezier<T>();
        for (var i in this.points) {
            r.points[i] = this.points[i].scale(s);
        }
        return r;
    }
    add(o: Bezier<T>): Bezier<T> {
        throw o;
    }


    //::::Curve::::
    get(t: number): T {
        if (this.order == 0) {
            return this.points[0].copy().get();
        }

        var res = this.points[0].scale(
            Math.pow((1 - t), this.order)
        );
        var bin = this.order;
        for (var i = 1; i < this.points.length; i++) {
            res.addDEq(this.points[i].scale(
                bin *
                Math.pow((1 - t), this.order - i) *
                Math.pow(t, i)
            ));
            bin *= (this.order - i) / (i + 1);
        }
        return res;
    }
    derivative(): Bezier<T> {
        var cps: T[] = [];
        if (this.order == 0) {
            return new Bezier<T>([this.points[0].scale(0)]);
        }
        for (var i = 0; i < this.order; i++) {
            cps[i] = this.points[i + 1].sub(this.points[i]).scaleEq(this.degree);
        }
        return new Bezier<T>(cps);
    }


    //::::helper/misc::::
    get order(): number {
        return this.points.length - 1;
    }
    get degree(): number {
        return this.points.length;
    }


    deCastlejau(t: number): T[][] {
        var ans: T[][] = [this.points];
        while (ans[ans.length - 1].length > 1) {
            ans.push([]);
            for (var i = 0; i < ans[ans.length - 2].length - 1; i++) {
                ans[ans.length - 1].push(ans[ans.length - 2][i + 1].scale(t).addDEq(ans[ans.length - 2][i].scale(1 - t)));
            }
        }
        return ans;
    }
    split(t: number): Bezier<T>[] {
        const c = this.copy();
        return [c, c.splitEq(t)];
    }
    splitEq(t: number): Bezier<T> {
        const o: T[] = [];
        for (var j = 0; j < this.points.length; j++) {
            o[this.points.length - 1 - j] = this.points[this.points.length - 1].copy();
            for (var i = this.points.length - 1; i > j; i--) {
                this.points[i].scaleEq(t).addDEq(this.points[i - 1].scale(1 - t));
            }
        }
        return new Bezier<T>(o);
    }
    cutL(t: number): Bezier<T> {
        return this.copy().cutLEq(t);
    }
    cutLEq(t: number): Bezier<T> {
        for (var j = 0; j < this.points.length; j++) {
            for (var i = this.points.length - 1; i > j; i--) {
                this.points[i].scaleEq(t).addDEq(this.points[i - 1].scale(1 - t));
            }
        }
        return this;
    }
    cutG(t: number): Bezier<T> {
        return this.copy().cutGEq(t);
    }
    cutGEq(t: number): Bezier<T> {
        return this.reverseEq().cutLEq(1 - t).reverseEq();
    }
    reverse(): Bezier<T> {
        return this.copy().reverseEq();
    }
    reverseEq(): Bezier<T> {
        this.points.reverse();
        return this;
    }

    incOrderEq(): Bezier<T> {
        const n = this.order;
        if (n == 0) {
            this.points[1] = this.points[0].copy();
            return this;
        }
        const k = n + 1;
        this.points[k] = this.points[n].copy();
        for (var i = n; i >= 1; i--) {
            this.points[i].scaleEq((n - i + 1) / (i + 1)).addEq(this.points[i - 1].scaleEq(i / k));
        }
        return this;
    }







}




/*
type Spline_Point<T extends Vector<any>> = {
    is_spline_point: true,
    vector: T,
    weight: number,
    continuity: number,
    position: number
} & T;
class Spline<T extends Vector<any>> extends Vector<Spline<T>> implements Curve<T>{
    // rational b-spline like curve
    public points: Array<Spline_Point<T>>;
    public cyclic: boolean;
    constructor(c?: boolean, ...pts: Array<Spline_Point<T> | T>) {
        super();
        this.points = new Array<Spline_Point<T>>();
        for (var i = 0; i < pts.length; i += 1) {
            if ((pts[i] as Spline_Point<T>).is_spline_point === true) {
                this.points[i] = pts[i] as Spline_Point<T>;
            } else {
                this.points[i] = { is_spline_point: true, vector: (pts[i] as T), weight: 1, continuity: Infinity, position: i } as Spline_Point<T>;
            }
        }
        if (c == null) {
            this.cyclic = false;
        } else {
            this.cyclic = c;
        }
        this.sort();
    }
    sort(): Spline<T> {
        this.points.sort((p1, p2) => p1.position - p2.position);
        return this;
    }

    getPointIndex(t: number): number {
        var l = 0;
        var h = this.points.length - 1
        while (l < h) {
            const m = Math.floor((l + h) / 2);
            const pos = this.points[m].position;
            if (pos > t) {
                h = m;
            } else {
                if (pos < t) {
                    l = m;
                } else {
                    return m;
                }
            }
        }
        return h;
    }
    getWeightArray(t: number): { weights: number[], start: number } {
        t = py_mod(t, this.points[this.points.length - 1].position);
        //binary search to find the knot of interest
        var start = this.getPointIndex(t);
        const weights: number[] = [1];

        // determining of degree of section





        // b(i,k,x) = (x-t_i)/(t_(i+k)-t_i) * b(i,k-1,x) + (t_(i+k+1)-x)/(t_(i+k+1)-t_(i+1)) * b(i+1,k-1,x) for b-spline



        return { weights: weights, start: start };
    }


    get(t: number): T {

        return this.points[0];

    }

    add(o: Spline<T>): Spline<T> {
        return this;

    }
    copy(): Spline<T> {
        //const r = new Spline<T>([]);
        //for (var i in this.points){
        //	r.points[i] = { is_spline_point: true, vector: this.points[i].vector, weight: this.points[i]., continuity: Infinity, position: i } as Spline_Point<T>;
        return new Spline<T>(...this.points);
    }
    scale(s: number): Spline<T> {
        const r = new Spline<T>();
        for (var i in this.points) {
            r.points[i] = { is_spline_point: true, vector: this.points[i].vector.scale(s), weight: this.points[i].weight * s, continuity: this.points[i].continuity, position: this.points[i].position } as Spline_Point<T>;
        }
        return r;
    }
    scaleEq(s: number): Spline<T> {
        for (var i in this.points) {
            this.points[i].vector.scaleEq(s);
        }
        return this;
    }
    set(o: Spline<T>): Spline<T> {
        this.points = o.points;
        return this;
    }
}
*/

export {
    Curve,
    Bezier,
    NUBS,
    NURBS
}
