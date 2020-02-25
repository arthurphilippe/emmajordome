import * as telegraf from "telegraf_acp_fork";
import myContext from "../Context";
import Replies from "./Replies";
import inputStateBase from "./inputStateBase";

export default function stringMca(
    ctx: myContext,
    replies: Replies = {
        success: "String OK",
        failure: "String NOK",
        question: "Input a string",
    }
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let scn_ctx: Partial<inputStateBase> = {
            resolve,
            reject,
            replies,
        };

        ctx.scene.enter("inputString", scn_ctx, false, true);
    });
}

export let scene = new telegraf.BaseScene<myContext>("inputString");

scene.enter((ctx) => {
    let state = ctx.scene.state as inputStateBase;
    if (state.replies.question) ctx.reply(state.replies.question);
});

scene.on("text", (ctx) => {
    let state = ctx.scene.state as inputStateBase;

    ctx.scene.leave();
    state.resolve(ctx.message.text);
});

scene.on("message", (ctx) => {
    ctx.reply("Please only send me text.");
});
