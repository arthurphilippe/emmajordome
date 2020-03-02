import * as telegraf from "telegraf_acp_fork";
import moment = require("moment");

interface Operations {
    name: string;
    value: number;
    accountId: any;
}

import myContext from "./Context";

import * as input from "./input";
import * as task from "./task";

import Db from "./Db";

(async () => {
    let bot = new telegraf.default<myContext>(process.env.BOT_TOKEN);
    let db = new Db();
    await db.start();

    let scheduler = new task.Scheduler(bot.telegram, db);
    scheduler.schedule();

    bot.use((ctx, next) => {
        db.middleware(ctx, next);
        ctx.taskSceduler = scheduler;
    });
    bot.use(telegraf.session<myContext>());

    bot.on(
        "callback_query",
        (ctx, next) => {
            console.log("callbackquery");
            ctx.splitCb = ctx.callbackQuery.data.split(";");
            next();
        },
        task.cb
    );

    let stage = new telegraf.Stage([]);
    input.register(stage);
    task.register(stage);

    stage.command("cancel", (ctx) => {
        ctx.reply("Canceling current task and going back home.");
        ctx.scene.leave(false);
        ctx.scene.reset(false);
    });
    bot.use(stage.middleware());

    bot.command("newtask", (ctx) => ctx.scene.enter("createTask"));
    bot.command("listtasks", (ctx) => ctx.scene.enter("listTasks"));

    bot.on("message", (ctx) => {
        ctx.reply("Not sure what you are trying to do... Have a look at available commands.");
        if (ctx.scene.session.current) ctx.reply(`You are in ${ctx.scene.session.current}`);
    });

    console.log("Ready.");
    bot.catch((err: any) => {
        console.error(err);
        db.client.close();
    });
    // bot.launch({
    //     webhook: {
    //         hookPath: "bots.arthurphilippe.me:443/emmajordome",
    //         port: 443,
    //     },
    // });
    bot.startWebhook("");
    setInterval(() => {
        console.log("5 min interval...", moment().format(" D-MM-YYYY, H:mm"));
    }, 1000 * 60 * 5);
    bot.startPolling();
})();
