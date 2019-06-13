import { Vector, Point } from "./vectors";

interface Transform<A, B> {
    apply(a: A): B;
    transform_linear: boolean;
    transform_invertible: boolean;
    inverse(): Transform<B, A>;
    unapply(b: B): A;
}
class CompoundTransform<A, B, C> implements Transform<A, C>{
    transform_linear: boolean;
    transform_invertible: boolean;
    constructor(public t1: Transform<A, B>, public t2: Transform<B, C>) {
        this.transform_linear = t1.transform_linear && t2.transform_linear;
        this.transform_invertible = t1.transform_invertible && t2.transform_invertible;
    }
    apply(a: A): C {
        return this.t2.apply(this.t1.apply(a));
    }
    inverse(): Transform<C, A> {
        return new CompoundTransform<C, B, A>(this.t2.inverse(), this.t1.inverse());
    }
    unapply(c: C): A {
        return this.t1.unapply(this.t2.unapply(c));
    }
}








function arrMatrixMulArr(m: Array<Array<number>>, v: Array<number>): Array<number> {
    var res: number[] = [];
    for (var i in m) {
        res[i] = 0;
        for (var j in m[i]) {
            if (v[j] != null) {
                res[i] += m[i][j] * v[j]
            }
        }
    }
    return res;
}

function arrMatrixMul(m1: Array<Array<number>>, m2: Array<Array<number>>): Array<Array<number>> {
    //m1*m2, nulls are 0s, indices can be anything
    var res: number[][] = [];
    for (var i in m2) {
        res[i] = arrMatrixMulArr(m1, m2[i]);
    }
    return res;
}

function transpose(m: Array<Array<number>>): Array<Array<number>> {
    var res: Array<Array<number>> = [];
    for (var i in m) {
        for (var j in m[i]) {
            if (res[j] == null) {
                res[j] = [];
            }
            res[j][i] = m[i][j];
        }
    }
    return res;
}

function identity(m: Array<Array<number>>): Array<Array<number>> {
    var r: Array<Array<number>> = []
    for (var i in m) {
        r[i] = [];
        r[i][i] = 1;
        for (var j in m[i]) {
            r[j] = [];
            r[j][j] = 1;
        }
    }
    return r;
}
function fmaRowsInPlace(r1: Array<number>, r2: Array<number>, n = 1): void {
    //r1+=r2*n
    for (var i in r2) {
        r1[i] += r2[i] * n;
    }
}
function mRowInPlace(r1: Array<number>, n = 1): void {
    //r1+=r2*n
    for (var i in r1) {
        r1[i] *= n;
    }
}
function swap(a: Array<any>, i1: any, i2: any): void {
    const tmp = a[i1];
    a[i1] = a[i2];
    a[i2] = tmp;
}
function copy(m: Array<Array<number>>): Array<Array<number>> {
    var res: Array<Array<number>> = [];
    for (var i in m) {
        res[i] = [];
        for (var j in m[i]) {
            res[i][j] = m[i][j];
        }
    }
    return res;
}

function inverse(m: Array<Array<number>>): Array<Array<number>> {
    //output undefined for noninvertible transformations
    var workid = identity(m);
    var workmx: Array<Array<number>> = copy(m);
    const cols = workid;


    for (var col in cols) {
        var maxRow = col;
        for (var row in cols) {
            //if (Math.abs(workmx[row][col]) > Math.abs(workmx[maxRow][col])) {// fix error plox
            //    maxRow = row;
            //}
        }
        //swap row with maxRow
        swap(workmx, col, maxRow);
        swap(workid, col, maxRow);
        //normalize row
        const nf = 1 / (workmx[col][col]);
        mRowInPlace(workmx[col], nf);
        mRowInPlace(workid[col], nf);

        //zero other entries
        for (var row in cols) {
            if (row != col) {
                //println(">"+row+","+col+":"+work[row][col]);
                fmaRowsInPlace(workmx[row], workmx[col], -workmx[row][col]);
                fmaRowsInPlace(workid[row], workid[col], -workid[row][col]);

            }
        }
    }
    //rref complete
    return workid;
}





class PtTransform implements Transform<Point, Point>{
    transform_linear = true;
    transform_invertible: boolean;
    unapply(b: Point): Point {
        throw new Error("Method not implemented.");
    }

    constructor(public coordMatrix: Array<Array<number>> = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) {
        this.transform_invertible = false; //todo
    }
    apply(p: Point): Point {
        const r = arrMatrixMulArr(this.coordMatrix, [p.x, p.y, p.z, p.w]);
        return new Point(r[0], r[1], r[2], r[3], p.s);
    }
    compose(o: PtTransform): PtTransform {
        //put the colums
        const m = transpose(o.coordMatrix);
        for (var i in m) {
            m[i] = arrMatrixMulArr(this.coordMatrix, m[i]);
        }
        return new PtTransform(m);
    }
    inverse(): Transform<Point, Point> { //not always possible
        return new PtTransform(inverse(this.coordMatrix));
    }
}



export {
    PtTransform, Transform
}
