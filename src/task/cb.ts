import myContext from "../Context";
import { ObjectID, UpdateQuery } from "mongodb";
import Task, { Occurence, closureType } from "./Task";
import * as telegraf from "telegraf_acp_fork";
import { string } from "src/input";

// interface occurenceOp ;

async function completeTasks(ctx: myContext, operationStr: string, idStr: string) {
    let id = new ObjectID(idStr);

    const occurenceOperations = new Map<string, UpdateQuery<Occurence>>([
        [
            "undo",
            {
                $unset: { closed: "", closureKind: "" },
            },
        ],
        [
            "complete",
            {
                $set: { closed: new Date(), closureKind: closureType.Completed },
            },
        ],
        [
            "cancel",
            {
                $set: { closed: new Date(), closureKind: closureType.Canceled },
            },
        ],
    ]);

    let activeOp = occurenceOperations.get(operationStr);

    try {
        let result = await ctx.occurences.collection.findOneAndUpdate({ _id: id }, activeOp, {
            returnOriginal: false,
        });

        if (result.ok) {
            ctx.editMessageText(
                await ctx.occurences.generateMessage(result.value),
                telegraf.Markup.inlineKeyboard(
                    ctx.occurences.generateInlineButtons(result.value)
                ).extra()
            ).catch(console.error);
        }
    } catch (err) {
        console.error(err);
    }
}

export function cb(ctx: myContext, next: Function) {
    if (ctx.splitCb.length < 2 || ctx.splitCb[0] != "task") {
        next();
    } else {
        if (
            (ctx.splitCb[1] == "complete" ||
                ctx.splitCb[1] == "cancel" ||
                ctx.splitCb[1] == "undo") &&
            ctx.splitCb.length >= 3
        ) {
            completeTasks(ctx, ctx.splitCb[1], ctx.splitCb[2]);
        }
    }
}
