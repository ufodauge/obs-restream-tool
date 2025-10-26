import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";

const generateComponentContent = (name: string, content: string) => {
  return [
    "type Props = {",
    "  className?: string;",
    "};",
    "",
    "export const " + name + " = ({ className }: Props) => (",
    content,
    ");",
    "",
  ].join("\n");
};

const { values } = util.parseArgs({
  options: {
    source: {
      type: "string",
      short: "i",
    },
    out: {
      type: "string",
      short: "o",
    },
  },
  args: process.argv.slice(2),
});

if (values.source === undefined || values.out === undefined) {
  console.log("invalid args");
  process.exit(1);
}

const source = path.normalize(values.source);
const out = path.normalize(values.out);

const files = await fs.readdir(source);
const svgs = await Promise.all(
  files.map(async (v) => {
    const content = await fs.readFile(path.resolve(source, v));
    const name =
      path
        .basename(v, ".svg")
        .split("_")
        .map((s) => s[0].toLocaleUpperCase() + s.slice(1))
        .join("") + "Icon";
    const component = generateComponentContent(
      name,
      content
        .toString()
        .replace(/height="\S+?"/, "")
        .replace(/width="\S+?"/, "")
        .replace(/fill="\S+?"/, "className={className}"),
    );

    return {
      name,
      component,
    };
  }),
);

for (const { name, component } of svgs) {
  await fs.writeFile(path.resolve(out, `${name}.tsx`), component);
}
