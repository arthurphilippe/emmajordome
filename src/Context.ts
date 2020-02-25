import * as task from "./task";
import * as telegraf from "telegraf_acp_fork";

export default interface Context extends telegraf.SceneContextMessageUpdate {
    tasks?: task.Tasks;
    occurences?: task.Occurences;
    taskSceduler?: task.Scheduler;
    splitCb?: string[];
}
