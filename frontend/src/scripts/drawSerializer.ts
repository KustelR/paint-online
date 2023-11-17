import { Position, Color } from "./drawing";


export class DrawData {
    constructor(actionType: string, actions: Array<action>, color?: Color) {
        this.actionType = actionType;
        this.actions = actions;
        this.color = color;
    }
    actionType: string
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
    start: Position
    end: Position
    type: string
}

