import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { EngineTestUtils } from "@dendronhq/common-server";
import _ from "lodash";
import { DendronEngineV2 } from "../../enginev2";
import { replaceRefs } from "./plugins/replaceRefs";
import { getProcessor } from "./utils";

// @ts-ignore
const mdSimple = `
# H1 Header

h1 content

h1.1 content

## H2 Header

h2 content

### H3 Header

h3 content

- bullet1
- bullet2

1. ordered1
2. ordered2

\`\`\`
code fence
\`\`\`

\`code span\`

- [link](normal-link)
- ![image](image-link.jpg)
- [[foo-wiki-link]]
- [[label|foo-wiki-link]]
- [[label|foo-wiki-link]]#foobar

HTML

*[HTML]: HyperText Markup Language
`;

describe("replaceRefs", () => {
  // @ts-ignore
  let root: string;

  beforeEach(() => {
    root = EngineTestUtils.setupStoreDir();
  });

  test("imagePrefix", () => {
    const out = getProcessor()
      .use(replaceRefs, { imageRefPrefix: "bond/", scratch: "" })
      .processSync(`![alt-text](image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](bond/image-url.jpg)");
  });

  test("wiki2Md", () => {
    const links = `
[link](normal-link)

- [[foo-wiki-link]]
- [[label|foo-wiki-link]]
- [[label|foo-wiki-link]]#foobar
    `;
    const proc = getProcessor().use(replaceRefs, {
      wikiLink2Md: true,
      scratch: "",
    });
    const out = proc.processSync(links);
    const tokens = proc.parse(links);

    expect(out.toString()).toMatchSnapshot("raw");
    expect(tokens).toMatchSnapshot("parsed");
  });

  test("wiki2Md and swap id", async () => {
    const engine = DendronEngineV2.create({ vaults: [root] });
    await engine.init();
    const proc = getProcessor().use(replaceRefs, {
      wikiLink2Md: true,
      wikiLinkUseId: true,
      scratch: "",
      engine,
    });
    debugger;

    const note = NoteUtilsV2.getNoteByFname(
      "engine-server.replace-refs",
      engine.notes,
      { throwIfEmpty: true }
    ) as NotePropsV2;
    const out = proc.processSync(note.body);

    expect(out.toString()).toMatchSnapshot("raw");
  });
});

describe("Markdown extensions", () => {
  test("abbreviations are preserved", async () => {
    const abbr = `
HTML, JS and CSS are the fundamental building blocks of the web.

*[CSS]: Cascading Style Sheets
*[HTML]: HyperText Markup Language
*[JS]: JavaScript
    `;
    const proc = getProcessor();
    const out = await proc.process(abbr);
    expect(out.toString()).toMatchSnapshot();
  });
});
