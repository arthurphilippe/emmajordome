import myContext from "./Context";
import * as mongodb from "mongodb";

import * as task from "./task";

export default class Db {
    client: mongodb.MongoClient;
    db: mongodb.Db;
    constructor() {
        this.client = new mongodb.MongoClient("mongodb://root:example@localhost", {
            useUnifiedTopology: true,
        });
    }
    public async start() {
        this.client = await this.client.connect();
        this.db = this.client.db("minicount");
        return;
    }
    get components() {
        return {
            tasks: new task.Tasks(this.db),
            occurences: new task.Occurences(this.db),
        };
    }
    public middleware<TContext extends myContext>(ctx: TContext, next: Function) {
        if (!this.client.isConnected()) {
            throw "db middware cannot be used without being connected.";
        }
        for (let key in this.components) {
            ctx[key] = this.components[key];
        }
        next();
    }
}
