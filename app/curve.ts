import { Saveable } from "./save";
import { Vector } from "./vector";

interface Curve<T> extends Saveable {
    get(t: number): T;
    derivative(): Curve<T>;
}


function py_mod(n: number, m = 1): number {
    return ((n % m) + m) % m;
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

        // determining of order of section





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
