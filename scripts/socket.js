import CONSTANTS from "./constants.js";
import API from "./api.js";
import { setSocket } from "../script.js";
export let sceneSocket;
export function registerSocket() {
	if (sceneSocket) {
		return sceneSocket;
	}
	//@ts-ignore
	sceneSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);
	sceneSocket.register("executeAction", (...args) => API.executeActionArr(...args));
	sceneSocket.register("macro", (...args) => API.macroArr(...args));
	setSocket(sceneSocket);
	return sceneSocket;
}