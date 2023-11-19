import { Position, Color } from "./drawing";


export class DrawData {
    constructor(actions: Array<action>, lineWidth?: number, color?: Color) {
        this.actions = actions;
        this.color = color;
        if (lineWidth) this.lineWidth = lineWidth
    }

    actions: Array<action>
    color?: Color
    lineWidth: number | undefined = undefined;

    send(sender: (data: DrawData) => void) {
        sender(this);
    }

    addAction(type: string, start: Position, end: Position) {
        this.actions.push({start: start, end: end, type: type})
    }

    isEmpty(): boolean {
        if (this.actions.length === 0) {
            return true;
        }
        return false;
    }
}

export class History {
    constructor(actions?: Array<DrawData>, redoArr?: Array<DrawData>, limit?: number) {
        actions ? this.actions = actions :  this.actions = [];
        redoArr ? this.redoArr = redoArr : this.redoArr = [];
        limit ? this.limit = limit : this.limit = 1000;
    }

    limit: number
    actions: Array<DrawData>;
    redoArr: Array<DrawData>;

    addAction(action: DrawData) {
        this.actions.push(action);
        if (this.actions.length > this.limit) {
            this.actions = this.actions.slice(this.actions.length - this.limit)
        }
    }

    remind() {
        return this.actions;
    }

    undo() {
        if (this.actions.length > 0) {
            const el = this.actions.pop()
            if (!el) return
            this.redoArr.push(el)
        }
    }

    redo() {
        if (this.redoArr.length > 0) {
            const redoEl = this.redoArr.pop()
            if (!redoEl) return
            this.actions.push(redoEl)
        }
    }

}

type action = {
    start?: Position
    end?: Position
    type: string
}

