

//function compile_expr<T extends Vector<T>>(expr: string): (a: Vector<T>[]) => Vector<T> {




//}





export abstract class Vector<T extends Vector<T>>{

    //    constructor() { } //zero

    abstract vec_add(other: T): T;
    abstract vec_scale(s: number): T;

    abstract vec_copy(): T; //shallow copy of vector
    abstract vec_set(other: T): T;//sets this vector to another vector

    //optional optimization stuff
    vec_addEq(other: T): T {
        return this.vec_set(this.vec_add(other));
    }
    vec_addD(other: T): T {
        return other.vec_addEq(this as any as T);
    }
    vec_addDEq(other: T): T {
        return this.vec_addEq(other);
    }

    vec_fmaEq(other: T, scale: number): T {
        return this.vec_addDEq(other.vec_scale(scale));
    }

    vec_neg(): T {
        return this.vec_scale(-1);
    }
    vec_negEq(): T {
        return this.vec_scaleEq(-1);
    }

    vec_sub(other: T): T {
        return this.vec_add(other.vec_neg());
    }
    vec_subEq(other: T): T {
        return this.vec_addEq(other.vec_neg());
    }
    vec_subD(other: T): T {
        return other.vec_negEq().vec_addEq(this as any as T);
    }
    vec_subDEq(other: T): T {
        return this.vec_subEq(other);
    }

    vec_scaleEq(s: number): T {
        return this.vec_set(this.vec_scale(s));
    }

    vec_lerp(other: T, alpha: number): T {
        return this.vec_scale(1 - alpha).vec_addDEq(other.vec_scale(alpha));
    }
    vec_lerpEq(other: T, alpha: number): T {
        return this.vec_scaleEq(1 - alpha).vec_addDEq(other.vec_scale(alpha));
    }
    vec_lerpD(other: T, alpha: number): T {
        return this.vec_scale(1 - alpha).vec_addDEq(other.vec_scaleEq(alpha));
    }
    vec_lerpDEq(other: T, alpha: number): T {
        return this.vec_scaleEq(1 - alpha).vec_addDEq(other.vec_scaleEq(alpha));
    }
}

export interface NormedVector<T extends NormedVector<T>> extends Vector<T> {
    vec_norm: () => number;
    vec_norm2: () => number;
}

