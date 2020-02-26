import * as telegraf from "telegraf_acp_fork";
import createTask from "./sceneCreateTask";
import listTasks from "./sceneListTasks";

export function register(stage: telegraf.Stage<any>) {
    stage.register(createTask);
    stage.register(listTasks);
}

export * from "./Task";
export * from "./scheduler";
export * from "./cb";
