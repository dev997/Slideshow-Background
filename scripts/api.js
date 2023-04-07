import { fade } from "../script.js";
const API = {
	async executeActionArr(...inAttributes) {
		if (!Array.isArray(inAttributes)) {
			throw error("executeActionArr | inAttributes must be of type array");
		}
		let [options] = inAttributes;
		options = {
			...options,
			fromSocket: true,
		};
		this.executeAction(options);
	},
	executeAction(options) {
		fade(options);
	}
};
export default API;