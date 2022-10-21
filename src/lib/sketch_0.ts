import type p5 from "p5";
import { BlackHole, Herd, Individual } from "./herd";
import { calcHeight, calcWidth } from "./utils";


const INITIAL_POPULATION = 0;

export default (_: p5) => {
    const width = calcWidth()
    const height = calcHeight()
    const blackhole = new BlackHole(_, _.createVector(width / 2, height / 2))
    const herd = new Herd(_, _.createVector(width, height), blackhole)

    _.setup = () => {
        _.createCanvas(width, height);
        _.background("#000");
        _.fill("#fff");
        _.stroke("#fff");
        _.strokeWeight(0.5);
        _.textSize(16);

        for (let i = 0; i < INITIAL_POPULATION; i++) {
            herd.add(new Individual(
                _,
                _.random(0, _.width),
                _.random(0, _.height)
            ))
        }
    }

    _.draw = () => {
        _.background("#00000044");
        const text_lines = [
            "Instinct de séparation",
            "Instinct d'alignement",
            "Instinct de cohésion",
        ];
        text_lines.forEach((txt, i) => { _.text(txt, 50, (i + 1) * 50) })

        blackhole.position.x = _.mouseX;
        blackhole.position.y = _.mouseY;

        herd.tick()
        herd.render()
    }

    _.mouseReleased = () => {
        herd.add(new Individual(_, _.mouseX, _.mouseY))
    }

    _.mouseDragged = () => {
        herd.add(new Individual(_, _.mouseX, _.mouseY))
    }
}