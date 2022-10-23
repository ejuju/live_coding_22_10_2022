import { Color, Vector } from "p5";
import type p5 from "p5";

const MAX_STEERING_FORCE = 0.2;

export class Herd {
    private _: p5;

    // Individuals make up the herd.
    // New individuals are added to the herd as time passes.
    // Territory determines where people are born.
    // Black hole kills some individuals as time passes.
    private individuals: Individual[] = [];
    private birthsPerTick: number = 1;
    private birthSurvivalRate: number = 0.1;
    private tickSurvivalRate: number = 1;
    private territory: Vector;
    private blackHole: BlackHole;

    // Create a new herd.
    constructor(_: p5, territory: Vector, blackhole: BlackHole) {
        this._ = _;
        this.territory = territory;
        this.blackHole = blackhole;
    }

    // Add people to the herd.
    add(...someone: Individual[]) { this.individuals.push(...someone); }

    // Move forward in time.
    tick() {
        // Let time pass for all individuals.
        this.individuals.forEach(i => i.tick(this.individuals, this.blackHole))

        // Create new individuals according to birth rate.
        for (let i = 0; i < this.birthsPerTick; i++) {
            if (this._.random(0, 1) < this.birthSurvivalRate) {
                this.add(new Individual(
                    this._,
                    this._.random(0, this.territory.x),
                    this._.random(0, this.territory.y)
                ))
            }
        }

        // Kill some individuals randomly.
        this.individuals = this.individuals.filter(() => {
            return this._.random(0, 1) < this.tickSurvivalRate
        })
    }

    // Render herd inside simulation.
    render() {
        this.individuals.forEach(i => i.render());
        // this.blackHole.render();
    }
}

export class Individual {
    private _: p5;

    // Position: Where are you?
    // Velocity & Acceleration: Where are you going and how fast?
    // Max speed: How fast can you go?
    private position: Vector;
    private velocity: Vector;
    private acceleration: Vector;
    private maxSpeed: number;
    private size: number;
    private color: Color;

    // Alignment: Do you want to go where others are going?
    // Cohesion: Do you want to stay within the herd?
    // Separation: Do you want to get away from the herd?
    // Black hole: Do you want to 
    private alignmentBias: number;
    private cohesionBias: number;
    private seperationBias: number;

    // Create a new individual.
    constructor(_: p5, x: number, y: number) {
        this._ = _;

        this.position = _.createVector(x, y);
        this.velocity = Vector.random2D();
        this.velocity.setMag(_.random(1, 2));
        this.acceleration = _.createVector();
        this.maxSpeed = 4;
        this.size = 0.5;

        this.seperationBias = _.random(1.5, 2); // 1, 2
        this.alignmentBias = _.random(1, 2); // 0.5, 1.5
        this.cohesionBias = _.random(0, 2); // 0.1, 1

        this.color = _.color(
            this.seperationBias * 120,
            this.alignmentBias * 120,
            this.cohesionBias * 120,
        )
    }

    // Render this individual inside simulation.
    render() {
        this._.push();
        this._.fill(this.color)
        this._.circle(this.position.x, this.position.y, this.size)
        this._.pop();
    }

    // Move forward in time.
    tick(others: Individual[], blackhole: BlackHole) {
        this.lookAround(others, blackhole)
        this.move()
        this.handleBoundaries()
    }

    // Gather information about surroundings and update acceleration
    private lookAround(others: Individual[], blackhole: BlackHole) {
        // Apply seperation force and bias
        let separationForce = this.separate(others);
        separationForce.mult(this.seperationBias);
        this.acceleration.add(separationForce);

        // Apply alignment force and bias
        let alignmentForce = this.align(others);
        alignmentForce.mult(this.alignmentBias);
        this.acceleration.add(alignmentForce);

        // Apply cohesion force and bias
        let cohesionForce = this.cohere(others);
        cohesionForce.mult(this.cohesionBias);
        this.acceleration.add(cohesionForce);

        // Apply attraction to black hole
        let blackholeAttractionForce = this.steer(blackhole.position);
        blackholeAttractionForce.mult(blackhole.force(this.position))
        this.acceleration.add(blackholeAttractionForce);
    }

    // Physically move in the simulation.
    private move() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.acceleration.mult(0);
    }

    // Handle boundaries of the simulation.
    private handleBoundaries() {
        if (this.position.x < 0) { this.position.x = this._.width }
        if (this.position.y < 0) { this.position.y = this._.height }
        if (this.position.y > this._.height) { this.position.y = 0 }
        if (this.position.x > this._.width) { this.position.x = 0 }
    }

    // Calculates where to go to align with others.
    private align(others: Individual[]): Vector {
        const depth = 40;
        const steering = this._.createVector();
        let total = 0;
        others.forEach(o => {
            if (o !== this && this.position.dist(o.position) < depth) {
                steering.add(o.velocity);
                total++;
            }
        })
        if (total === 0) { return steering }
        steering.div(total);

        steering.setMag(this.maxSpeed);
        steering.sub(this.velocity);
        steering.limit(MAX_STEERING_FORCE);
        return steering
    }

    // Calculates where to go to move away from others.
    private separate(others: Individual[]): Vector {
        const depth = 40;
        const steering = this._.createVector();
        let total = 0;
        others.forEach(o => {
            const dist = this.position.dist(o.position);
            if (o !== this && dist < depth) {
                const diff = Vector.sub(this.position, o.position);
                diff.div(dist * dist);
                steering.add(diff);
                total++;
            }
        })
        if (total === 0) { return steering }
        steering.div(total);

        steering.setMag(this.maxSpeed);
        steering.sub(this.velocity);
        steering.limit(MAX_STEERING_FORCE);
        return steering;
    }

    // Calculates where to go to stay inside the local group.
    private cohere(others: Individual[]) {
        const depth = 150;
        const steering = this._.createVector();
        let total = 0;
        others.forEach(o => {
            if (o !== this && this.position.dist(o.position) < depth) {
                steering.add(o.position);
                total++;
            }
        })
        if (total === 0) { return steering }
        steering.div(total);
        return this.steer(steering)
    }

    // Calculates the vector to move to a certain position. 
    private steer(position: Vector): Vector {
        const steering = this._.createVector(position.x, position.y)
        steering.sub(this.position);
        steering.setMag(this.maxSpeed);
        steering.sub(this.velocity);
        steering.limit(MAX_STEERING_FORCE);
        return steering
    }
}

// The black hole draws people in.
export class BlackHole {
    private _: p5;
    position: Vector;
    private size: number;

    constructor(_: p5, position: Vector) {
        this._ = _;
        this.position = position;
        this.size = 20;
    }

    // Calculates the force to apply according to the position of an object.
    force(position: Vector): number {
        return 50 / (15 + this.position.dist(position))
    }

    render() {
        this._.push();
        this._.noFill();
        this._.strokeWeight(1);
        // this._.bezier(
        //     this.position.x,
        //     this.position.y,
        //     this.position.x + this._.randomGaussian(-this.size * 2, this.size * 2),
        //     this.position.y + this._.randomGaussian(-this.size * 2, this.size * 2),
        //     this.position.x + this._.randomGaussian(-this.size * 2, this.size * 2),
        //     this.position.y + this._.randomGaussian(-this.size * 2, this.size * 2),
        //     this.position.x,
        //     this.position.y
        // )

        this._.fill("#ffffff05")
        this._.circle(this.position.x, this.position.y, this.size)
        this._.pop();
    }
}