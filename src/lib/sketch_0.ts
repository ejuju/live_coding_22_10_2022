import type { Renderer } from "p5";
import type p5 from "p5";
import { BlackHole, Herd, Individual } from "./herd";
import { calcHeight, calcWidth } from "./utils";


const INITIAL_POPULATION = 100;

export default (_: p5) => {
    const width = calcWidth()
    const height = calcHeight()
    const blackhole = new BlackHole(_, _.createVector(width / 2, height / 2))
    const herd = new Herd(_, _.createVector(width, height), blackhole)

    _.setup = () => {
        _.createCanvas(width, height);
        _.background("#fff");
        _.fill("#000");
        _.stroke("#000");
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
        _.background("#ffffff44");
        const text_lines = [
            "Instinct de séparation",
            "Instinct d'alignement",
            "Instinct de cohésion",
        ];
        text_lines.forEach((txt, i) => { _.text(txt, 50, (i + 1) * 50) })

        if (_.mouseX < 100 ||
            _.mouseX > _.width - 100 ||
            _.mouseY < 100 ||
            _.mouseY > _.height - 100
        ) {
            blackhole.position.x = _.width / 2;
            blackhole.position.y = _.height / 2;
        } else {
            blackhole.position.x = _.mouseX;
            blackhole.position.y = _.mouseY;
        }

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