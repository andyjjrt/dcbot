import chalk from "chalk";

export const log = (type="others", message="" ) => {
  console.log(
    chalk.cyanBright(`[${new Date().toLocaleString()}] [${type}] `) + message
  );
}