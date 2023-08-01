import { readFile } from "fs/promises";

// TODO: do config validation and parsing
export const readConfig = () => readFile("config.json", "ascii").then(data => JSON.parse(data));

