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

export class History {
    constructor(limit: number | undefined) {
        this.actions = [];
        if (limit) this.limit = limit;
    }

    limit: number = 20
    actions: Array<DrawData>;
    offset: number = 0;

    addAction(action: DrawData) {
        this.actions.push(action);
        if (this.actions.length > this.limit) {
            this.actions = this.actions.slice(this.actions.length - this.limit)
        }
    }

    remind() {
        return this.actions.slice(0, this.actions.length - (1 + this.offset));
    }

    undo() {
        if (this.offset  < this.actions.length) {
            this.offset++;
        } else {
            throw new Error("NOthing to undo")
        }
    }

    redo() {
        if (this.offset > 0) {
            this.offset--;
        } else {
            throw new Error("Nothing to redo")
        }
    }

}

type action = {
    start?: Position
    end?: Position
    type: string
}

