import myContext from "../Context";
import * as telegraf from "telegraf_acp_fork";
import * as input from "../input";
import { replyAndLeave } from "../replyAndLeave";
import moment = require("moment");
import Task from "./Task";

let listTask = new telegraf.BaseScene<myContext>("listTasks");

export default listTask;

interface State {
    tasks?: Task[];
    idx?: number;
}

listTask.enter(async (ctx) => {
    let tasks = await ctx.tasks.collection.find({ referenceId: ctx.chat.id }).toArray();
    let builder: string[] = [];

    builder.push("Here are you tasks:");

    tasks.forEach((task, idx) => {
        let sufix = ";";
        if (idx == tasks.length - 1) sufix = ".";
        let hours = task.nextOn.getHours();
        let minutes = task.nextOn.getMinutes();
        builder.push(`- /${idx + 1} ${task.name} at ${hours}:${minutes}${sufix}`);
    });

    (ctx.scene.state as State).tasks = tasks;

    builder.push("Either select a task or /cancel");
    ctx.reply(builder.join("\n"));
});

listTask.command("delete", async (ctx, next) => {
    let state = ctx.scene.state as State;
    if (state.idx !== undefined) {
        let result = await ctx.tasks.collection.deleteOne({ _id: state.tasks[state.idx - 1]._id });

        if (result.deletedCount == 1) {
            ctx.reply("🟢 Task deleted!");
            ctx.scene.leave();
        } else {
            ctx.reply("🔴 Error while deleting. You can re-run /delete or /cancel.");
        }
    } else {
        next();
    }
});

listTask.on("text", (ctx) => {
    let state = ctx.scene.state as State;

    let res = RegExp(/\/(\d+)/).exec(ctx.message.text);
    console.log(res);
    if (res && res.length >= 2) {
        let idx = parseInt(res[1]);
        if (isNaN(idx)) {
            ctx.reply(`${res[1]} is not a number...`);
        } else if (idx > 0 && idx <= state.tasks.length) {
            // idx += 1;
            state.idx = idx;

            let hours = state.tasks[idx - 1].nextOn.getHours();
            let minutes = state.tasks[idx - 1].nextOn.getMinutes();

            ctx.reply(
                `Selected: ${state.tasks[idx - 1].name} (${hours}:${minutes}).\n` +
                    `You can /delete it.`
            );
        } else {
            ctx.reply(`There is no more than ${state.tasks.length} tasks availables`);
        }
    } else {
        // not handled
    }
});
