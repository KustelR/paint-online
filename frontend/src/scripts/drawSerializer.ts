import { Position, Color } from "./drawing";


export class DrawData {
    constructor(actions: Array<action>, color?: Color) {
        this.actions = actions;
        this.color = color;
    }

    actions: Array<action>
    color?: Color

    send(sender: (data: string) => void) {
        const data = JSON.stringify(this);
        sender(data);
    }

    addAction(type: string, start: Position, end: Position) {
        this.actions.push({start: start, end: end, type: type})
    }
}

type action = {
    start?: Position
    end?: Position
    type: string
}

