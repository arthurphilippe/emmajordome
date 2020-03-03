import Db from "../Db";
import moment = require("moment");
import Task, { Occurence, Tasks, closureType } from "./Task";
import * as mongodb from "mongodb";
import * as telegraf from "telegraf_acp_fork";

// export async function schedule()

export class Scheduler {
    timeout: NodeJS.Timeout;
    db: Db;
    api: telegraf.Telegram;
    tasks: Tasks;

    constructor(api: telegraf.Telegram, db: Db) {
        this.api = api;
        this.db = db;
        this.tasks = db.components.tasks;
    }

    public async schedule() {
        if (this.timeout) clearTimeout(this.timeout);

        let results = await this.tasks.collection
            .find()
            .sort({ nextOn: 1 })
            .limit(1)
            .toArray();

        if (results.length) {
            let now = moment().valueOf();
            let target = moment(results[0].nextOn).valueOf();
            if (now < target)
                this.timeout = setTimeout(this.createOccurances.bind(this), target - now);
            else this.createOccurances();
        } else {
        }
    }

    async findDueTasks() {
        let tasks = await this.tasks.collection
            .find({ nextOn: { $lte: new Date() } })
            .sort({ nextOn: 1 })
            .toArray();
        return tasks;
    }

    async createOccurances() {
        console.log("creatingOccurances");
        this.timeout = undefined;

        let tasks = await this.findDueTasks();
        let occurences: Occurence[] = [];
        let messages: any[] = [];

        tasks.forEach((ta) => {
            let id = new mongodb.ObjectID();
            occurences.push({
                _id: id,
                referenceId: ta.referenceId,
                task: ta._id,
                on: ta.nextOn,
            });

            messages.push(
                this.api.sendMessage.bind(
                    this.api,
                    ta.referenceId,
                    `🔔 ${ta.name}`,
                    telegraf.Markup.inlineKeyboard([
                        telegraf.Markup.callbackButton("❌", `task;cancel;${id.toHexString()}`),
                        telegraf.Markup.callbackButton("✅", `task;complete;${id.toHexString()}`),
                    ]).extra()
                )
            );

            bumpTaskDate(ta);
            this.tasks.collection.updateOne({ _id: ta._id }, { $set: { nextOn: ta.nextOn } });
        });
        await this.db.components.occurences.collection.insertMany(occurences);
        messages.forEach((msg) => msg());

        this.db.components.occurences.collection.updateMany(
            {
                on: {
                    $lt: moment()
                        .subtract(1, "day")
                        .toDate(),
                },
            },
            {
                $set: {
                    closed: new Date(),
                    closureKind: closureType.Missed,
                },
            }
        );

        this.schedule();
    }
}

// async function updateTasks(db: Db, tasks: Task[]) {}

function bumpTaskDate(task: Task): void {
    let nextOn = moment(task.nextOn);
    nextOn.add(1, "day");
    task.nextOn = nextOn.toDate();
}
