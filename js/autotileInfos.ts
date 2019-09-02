type NeighbourSpec = "." | "X";
type NeighbourSpecFour = {
  n: NeighbourSpec;
  e: NeighbourSpec;
  s: NeighbourSpec;
  w: NeighbourSpec;
};

type AutoTileInfo = {
  name: string;
  adjs: NeighbourSpecFour;
};

interface OneLine {
  name: string;
  grid: string;
}
type gridNum = 0 | 1 | 2;
function processOne(one: OneLine): AutoTileInfo {
  const lines = one.grid.split("|").map(line => line.split(""));
  function infoAt(x: gridNum, y: gridNum): NeighbourSpec {
    const ix: number = y * 3 + x;
    const gs = one.grid.split("").filter(c => c !== "|");
    const ch = gs[ix];
    console.log({ x, y, ix, gs, ch });

    return ch === "X" ? "X" : ".";
  }
  return {
    name: one.name,
    adjs: {
      n: infoAt(1, 0),
      e: infoAt(2, 1),
      s: infoAt(1, 2),
      w: infoAt(0, 1)
    }
  };
}

const autotileInfos: AutoTileInfo[] = [
  { name: "ne", grid: " . |XX.| X " },
  { name: "n", grid: " . |XXX| X " },
  { name: "i", grid: " . |.X.| . " },
  { name: "nf", grid: " . |.X.| X " },
  { name: "ef", grid: " . |XX.| . " },
  { name: "sf", grid: " X |.X.| . " },
  { name: "wf", grid: " . |.XX| . " },
  { name: "vf", grid: " X |.X.| X " },
  { name: "hf", grid: " . |XXX| . " },
  { name: "nw", grid: " . |.XX| X " },
  { name: "w", grid: " X |.XX| X " },
  { name: "e", grid: " X |XX.| X " },
  { name: "sw", grid: " X |.XX| . " },
  { name: "s", grid: " X |XXX| . " },
  { name: "c", grid: " X |XXX| X " },
  { name: "se", grid: " X |XX.| . " }
].map(one => processOne(one));
