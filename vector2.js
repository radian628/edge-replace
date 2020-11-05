/** 2-Dimensional Vector Class */
export class V2 {
    /**
     * Vector constructor.
     * @param {number} x - X component of vector.
     * @param {number} y - Y component of vector.
     * 
     * Vector constructor.
     * @param {V2} x - Create copy of vector x.
     */
    constructor(x, y) {
        if (y === undefined && x instanceof V2) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Create a vector from polar coordinates.
     * @param {number} angle - Angle of vector relative to the X axis.
     * @param {number} length - Magnitude of vector.
     */
    static fromPolar(angle, length) {
        return new V2(Math.cos(angle) * length, Math.sin(angle) * length);
    }

    /**
     * Returns length of vector.
     */
    length() {
        return Math.hypot(this.x, this.y);
    }

    /**
     * Adds another vector to this, and returns this vector.
     * @param {V2} v - The vector to add
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtracts another vector from this, and returns this vector.
     * @param {V2} v - The vector to subtract.
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiplies this vector by a scalar, and returns this vector.
     * @param {number} s - The number to multiply by.
     */
    mult(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /**
     * Divides this vector by a scalar, and returns this vector.
     * @param {number} s - The number to divide by.
     */
    div(s) {
        this.x /= s;
        this.y /= s;
        return this;
    }

    /**
     * Changes the vector's length such that it is one, but retains the direction, then returns it.
     */
    normalize() {
        let len = this.length();
        this.div(len);
        return this;
    }

    /**
     * Scales the vector to a specific length while retaining its direction, and then returns it.
     * @param {*} s - The new length of the vector.
     */
    rescale(s) {
        this.normalize().mult(s);
        return this;
    }

    /**
     * Returns the vector's angle relative to the x axis.
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Returns the distance between this vector and another vector.
     * @param {*} v - The vector to compare to. 
     */
    getDistanceTo(v) {
        return new V2(this).sub(v).length();
    }

    /**
     * Returns the direction pointing from the position corresponding to this vector, to the position correspondong to another vector.
     * @param {*} v - The vector to point towards.
     */
    getDirectionTo(v) {
        let diff = new V2(v).sub(this);
        return diff.angle();
    }
}