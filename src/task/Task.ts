import * as mongodb from "mongodb";
import * as telegraf from "telegraf_acp_fork";

export default interface Task {
    _id: mongodb.ObjectID;
    referenceId: number;
    name: string;
    nextOn: Date;
    // grace_minutes: number;
}

export function isTask(x: any): x is Task {
    return (
        x.name !== undefined &&
        x.at !== undefined &&
        x.at.minutes !== undefined &&
        x.at.hours !== undefined &&
        x.referenceId !== undefined
    );
}

export enum closureType {
    Completed = "Completed",
    Canceled = "Canceled",
    Missed = "Missed",
}

export interface Occurence {
    _id: mongodb.ObjectID;
    referenceId: number;
    task: mongodb.ObjectID | Task;
    on: Date;
    closed?: Date;
    closureKind?: closureType;
}

export function isOccurence(x: any): x is Occurence {
    return x.task !== undefined && x.on !== undefined && x.referenceId !== undefined;
}

export function toSimpleString(task: Task): string {
    return `- ${task.name} at ${task.nextOn.getHours()}:${task.nextOn.getMinutes()}`;
}

export class Tasks {
    public collection: mongodb.Collection<Task>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Task>("tasks");
    }
}

export class Occurences {
    public collection: mongodb.Collection<Occurence>;
    private taskColl: mongodb.Collection<Task>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Occurence>("occurences");
        this.taskColl = dbclient.collection<Task>("tasks");
    }

    generateInlineButtons(item: Occurence) {
        if (!item.closed) {
            return [
                telegraf.Markup.callbackButton("❌", `task;cancel;${item._id.toHexString()}`),
                telegraf.Markup.callbackButton("✅", `task;complete;${item._id.toHexString()}`),
            ];
        } else if (item.closureKind == closureType.Canceled) {
            return [
                telegraf.Markup.callbackButton("🔙❌", `task;undo;${item._id.toHexString()}`),
                telegraf.Markup.callbackButton("✅", `task;complete;${item._id.toHexString()}`),
            ];
        } else {
            return [
                telegraf.Markup.callbackButton("❌", `task;cancel;${item._id.toHexString()}`),
                telegraf.Markup.callbackButton("🔙✅", `task;undo;${item._id.toHexString()}`),
            ];
        }
    }

    async getName(item: Occurence, task?: Task): Promise<string> {
        let name: string;
        if (!task) {
            try {
                task = await this.taskColl.findOne(
                    { _id: item.task as mongodb.ObjectID },
                    { projection: { name: 1 } }
                );
                name = task.name;
            } catch (_err) {
                name = "Deleted item";
            }
        } else {
            name = task.name;
        }
        return name;
    }

    async generateMessage(item: Occurence, detailed: boolean = false, task?: Task) {
        let name = await this.getName(item, task);

        let prefix: string;
        if (!item.closed) {
            prefix = "🔔";
        } else if (item.closureKind == closureType.Canceled) {
            prefix = "❌";
        } else {
            prefix = "✅";
        }

        return `${prefix} ${name}`;
    }
}
