import { readFile } from "fs/promises";

export const readConfig = () => readFile("config.json", "ascii").then(data => JSON.parse(data));

