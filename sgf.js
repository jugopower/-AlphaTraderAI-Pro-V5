
class SGFParser {
  static parse(text) {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("SGF 內容是空的。");
    }

    const rootStart = text.indexOf("(;");
    if (rootStart === -1) throw new Error("這不是有效的 SGF 棋譜。");

    const mainTree = this.extractMainVariation(text.slice(rootStart));
    const nodes = this.splitNodes(mainTree);

    if (nodes.length === 0) throw new Error("SGF 中找不到棋步。");

    const rootProps = this.parseProperties(nodes[0]);
    const size = Number(rootProps.SZ?.[0] || 19);

    const metadata = {
      blackName: rootProps.PB?.[0] || "—",
      whiteName: rootProps.PW?.[0] || "—",
      result: rootProps.RE?.[0] || "—",
      date: rootProps.DT?.[0] || "—",
      event: rootProps.EV?.[0] || rootProps.GN?.[0] || "—",
      komi: rootProps.KM?.[0] || "—"
    };

    const setup = [];
    for (const value of rootProps.AB || []) setup.push({ color: "black", ...this.coord(value) });
    for (const value of rootProps.AW || []) setup.push({ color: "white", ...this.coord(value) });

    const moves = [];
    for (let i = 1; i < nodes.length; i += 1) {
      const props = this.parseProperties(nodes[i]);

      if (props.B) moves.push({ color: "black", ...this.coord(props.B[0]), comment: props.C?.[0] || "" });
      else if (props.W) moves.push({ color: "white", ...this.coord(props.W[0]), comment: props.C?.[0] || "" });
    }

    return { size, metadata, setup, moves };
  }

  static extractMainVariation(text) {
    let output = "";
    let depth = 0;
    let escaped = false;
    let inValue = false;

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];

      if (escaped) {
        if (depth <= 1) output += ch;
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        if (depth <= 1) output += ch;
        escaped = true;
        continue;
      }

      if (ch === "[") inValue = true;
      if (ch === "]") inValue = false;

      if (!inValue && ch === "(") {
        depth += 1;
        if (depth === 1) continue;
      }

      if (!inValue && ch === ")") {
        if (depth === 1) break;
        depth -= 1;
        continue;
      }

      if (depth <= 1) output += ch;
    }

    return output;
  }

  static splitNodes(tree) {
    const nodes = [];
    let current = "";
    let inValue = false;
    let escaped = false;

    for (const ch of tree) {
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        current += ch;
        escaped = true;
        continue;
      }

      if (ch === "[") inValue = true;
      if (ch === "]") inValue = false;

      if (ch === ";" && !inValue) {
        if (current.trim()) nodes.push(current);
        current = "";
      } else {
        current += ch;
      }
    }

    if (current.trim()) nodes.push(current);
    return nodes;
  }

  static parseProperties(nodeText) {
    const props = {};
    const regex = /([A-Z]+)((?:\[(?:\\.|[^\]])*\])+)/g;
    let match;

    while ((match = regex.exec(nodeText)) !== null) {
      const key = match[1];
      const values = [];
      const valueRegex = /\[((?:\\.|[^\]])*)\]/g;
      let valueMatch;

      while ((valueMatch = valueRegex.exec(match[2])) !== null) {
        values.push(valueMatch[1].replace(/\\\]/g, "]").replace(/\\\\/g, "\\"));
      }
      props[key] = values;
    }

    return props;
  }

  static coord(value) {
    if (!value || value.length < 2) return { pass: true, x: -1, y: -1 };
    return {
      pass: false,
      x: value.charCodeAt(0) - 97,
      y: value.charCodeAt(1) - 97
    };
  }
}

window.SGFParser = SGFParser;
