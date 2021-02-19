import { Saveable } from "./save";
import { NormedVector, Vector } from "./vector";


@Saveable.register
class SphereHull<T extends NormedVector<any>> implements Saveable {
    _saveName?: string;
    public center: T;
    public radius: number;
    constructor(public points: T[]) { }
    update(): SphereHull<T> {
        if (this.points.length > 0) {




        } else {
            this.radius = -1;
        }
        return this;
    }
    contains(p: T): boolean {
        if (this.radius < 0) {
            return false;
        }
        return (this.center.sub(p).norm2() <= this.radius * this.radius);
    }

}


@Saveable.register
class ConvexHull<T extends Vector<any>> implements Saveable {
    _saveName?: string;
    constructor(public points: T[]) {

    }
    //todo


}
