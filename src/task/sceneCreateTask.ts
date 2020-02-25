import myContext from "../Context";
import * as telegraf from "telegraf_acp_fork";
import * as input from "../input";
import { replyAndLeave } from "../replyAndLeave";
import moment = require("moment");

let createTask = new telegraf.BaseScene<myContext>("createTask");

export default createTask;

async function prepareNextOccurenceDate(at: { minutes: number; hours: number }): Promise<Date> {
    let now = moment().utc();
    let occur = moment()
        .utc()
        .startOf("day")
        .add(at.hours, "hours")
        .add(at.minutes, "minutes");
    if (occur <= now) {
        occur.add(1, "day");
    }
    return occur.toDate();
}

async function commitTask(ctx: myContext, name: string, nextOccur: Date): Promise<void> {
    try {
        let result = await ctx.tasks.collection.insertOne({
            name,
            nextOn: nextOccur,
            referenceId: ctx.message.chat.id,
        });

        if (!result.insertedCount) throw Error("No document inserted.");
        ctx.reply("🟢 Task created succesfuly!");
        ctx.taskSceduler.schedule();
    } catch (err) {
        console.error(err);
        ctx.reply("🔴 Failed to write to database. You can either /retry or /cancel.");
        ctx.scene.state = { name, nextOccur };
    }
}

createTask.enter((ctx) => {
    input
        .string(ctx, {
            question: "Grand, let's create a new recurring task.\nHow shall we call it?",
            failure: "",
            success: "",
        })
        .catch(replyAndLeave.bind(ctx))
        .then(async (chosenName) => {
            try {
                let at = await input.time(ctx, true, {
                    question: 'At what UTC time, shall it occur?\nReply with "HH:MM" format.',
                });

                let nextOccur = await prepareNextOccurenceDate(at);

                ctx.reply("First occurence is due: " + moment(nextOccur).calendar());

                await commitTask(ctx, chosenName, nextOccur);
            } catch (err) {
                replyAndLeave(ctx, err);
            }
        });
});

createTask.command("retry", (ctx) => {
    let state = ctx.scene.state as { name: string; nextOccur: Date };
    if (!state.nextOccur || !state.name) ctx.reply("🔴 There no failed operation to retry.");
    else {
        commitTask(ctx, state.name, state.nextOccur);
        delete state.name;
        delete state.nextOccur;
    }
});
