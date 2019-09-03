"use strict";
p5.disableFriendlyErrors = true; // disables FES

let gMap: WorldMap;
const gPixelsPerTile: number = 48;
let debug = true;

let debugColor: p5.Color;
let imgPlayer: p5.Image;
let imgRiver: p5.Image;
type ImageMap = Record<string, p5.Image>;

const grassImages: ImageMap = {};
const allImages: ImageMap = {};
function preload() {
  imgPlayer = loadImage("build/elephant.png");
  imgRiver = loadImage("build/river.png");

  ["chest", "elephant", "cross", "player"].forEach(name => {
    allImages[name] = loadImage(`build/${name}.png`);
  });

  "nw|n|ne|w|c|e|sw|s|se|i|nf|ef|sf|wf|hf|vf".split("|").forEach(suffix => {
    grassImages[suffix] = loadImage(`build/grass_${suffix}.png`);
  });
}

function randomScreenPos(): p5.Vector {
  return createVector(random(width), random(height));
}

function randomVelocity(): p5.Vector {
  return p5.Vector.random2D().mult(random(5));
}

function textLabelledVector(
  vec: p5.Vector,
  label: string,
  xOffset: number,
  yOffset: number
) {
  text(
    `${label}${label ? " " : ""}${vec.x.toFixed(1)} ,${vec.y.toFixed(1)}`,
    xOffset,
    yOffset
  );
}

function toggleDebug() {
  debug = !debug;
}
let gPlayer: Player;
interface TileContent {
  imageName: string;
}
interface Player extends TileContent {
  pos: p5.Vector;
  mp: number;
}
type WalkOffset = -1 | 0 | 1;

function canWalkOn(t: Tile): boolean {
  return ["river", "grass"].includes(t.tileType);
}

function movementPoints(t: Tile): number {
  return random([1, 5]);
}
function removeContentsFromTile(tile: Tile, thing: TileContent) {
  const ix = tile.contents.indexOf(thing);
  if (ix >= 0) {
    tile.contents.splice(ix, 1);
  } else {
    console.error("tried to remove tile contents not at tile!");
  }
}

function posFromOffset(pos: p5.Vector, offset: Offset): p5.Vector {
  return pos.copy().add(createVector(offset[0], offset[1]));
}

function walk(offset: Offset) {
  const candidatePos = posFromOffset(gPlayer.pos, offset);
  const candidateTile = tileAt(candidatePos);
  if (canWalkOn(candidateTile)) {
    const moveCost = movementPoints(candidateTile);
    if (gPlayer.mp >= moveCost) {
      const prevTile = tileAt(gPlayer.pos);
      gPlayer.pos = candidatePos;
      const newTile = tileAt(gPlayer.pos);
      removeContentsFromTile(prevTile, gPlayer);
      addContentsToTile(newTile, gPlayer);
      gPlayer.mp -= moveCost;
      discover(newTile);
      discoverSurroundingTiles(newTile);
    }
  }
}

type Offset = [WalkOffset, WalkOffset];
const NorthOffset: Offset = [0, -1];
const EastOffset: Offset = [1, 0];
const SouthOffset: Offset = [0, 1];
const WestOffset: Offset = [-1, 0];

function offsetFor(d: Direction): Offset {
  switch (d) {
    case "North":
      return NorthOffset;
      break;
    case "East":
      return EastOffset;
      break;
    case "South":
      return SouthOffset;
      break;
    case "West":
      return WestOffset;
      break;
  }
}
type Direction = "North" | "East" | "South" | "West";
const allDirections: Direction[] = ["North", "East", "South", "West"];
function findNeighbouringTiles(t: Tile): Tile[] {
  return allDirections
    .map(mv => tileAt(t.pos.copy().add(vecFor(offsetFor(mv)))))
    .filter(t => t);
}
function vecFor(offset: Offset): p5.Vector {
  return createVector(offset[0], offset[1]);
}
/**
 * mark any surrounding tiles as discovered, if they are not already.
 * @constructor
 * @param {Tile} t - The tile whose neighbours should be discovered.
 */
function discoverSurroundingTiles(t: Tile) {
  const ns: Tile[] = findNeighbouringTiles(t);
  ns.forEach(neighbouringTile => {
    discover(neighbouringTile);
  });
}

function tileAt(pos: p5.Vector) {
  const ix = pos.x + gMap.width * pos.y;
  return gMap.tiles[ix];
}
function walkNorth() {
  walk(NorthOffset);
}
function walkEast() {
  walk(EastOffset);
}
function walkSouth() {
  walk(SouthOffset);
}
function walkWest() {
  walk(WestOffset);
}
function keyPressed() {
  switch (key) {
    case "b":
      toggleDebug();
      break;
    case "w":
      walkNorth();
      break;
    case "d":
      walkEast();
      break;
    case "a":
      walkWest();
      break;
    case "s":
      walkSouth();
      break;
    case "t":
      runTests();
      break;
  }
}
interface Chest extends TileContent {
  goldValue: number;
}
interface Cross extends TileContent {}

interface Tile {
  tileType: TileType;
  discovered: boolean;
  pos: p5.Vector;
  contents: TileContent[];
}

interface WorldMap {
  width: number;
  height: number;
  tiles: Tile[];
}
function createTileAt(pos: p5.Vector, tiletype: TileType): Tile {
  return {
    pos: pos.copy(),
    tileType: tiletype,
    discovered: false,
    contents: []
  };
}

function createRandomTileAt(pos: p5.Vector): Tile {
  return createTileAt(pos.copy(), random(["grass", "river"]));
}

function createWorldMap(): WorldMap {
  let tiles: Tile[] = [];
  const mapWidth = 10;

  repeat(100, ix =>
    tiles.push(
      createRandomTileAt(createVector(ix % mapWidth, Math.floor(ix / mapWidth)))
    )
  );

  return {
    width: mapWidth,
    height: Math.ceil(tiles.length / mapWidth),
    tiles: tiles
  };
}

function assertEqual(a: any, b: any, msg: string) {
  if (a !== b) {
    throw `AssertionFailed: Not equal: ${a}!==${b} (${msg})`;
  }
}
function assertTruthy(a: any, msg: string) {
  if (!a) {
    throw `AssertionFailed: Not truthy. (${msg})`;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  gMap = createWorldMap();
  //gMap = makeSimpleSquareMap(); //
  gPlayer = { pos: createVector(0, 0), mp: 200, imageName: "player" };
  addContentsToTile(tileAt(gPlayer.pos), gPlayer);
  imageMode(CENTER);
  console.log(autotileInfos);
}
function getTileNeighbourType(
  tile: Tile,
  map: WorldMap,
  offset: Offset
): NeighbourSpec {
  const nt = tileAt(posFromOffset(tile.pos, offset));
  return nt && nt.tileType == tile.tileType ? "X" : ".";
}

function getTileNeighbourTypes(tile: Tile, map: WorldMap): NeighbourSpecFour {
  return {
    n: getTileNeighbourType(tile, map, NorthOffset),
    e: getTileNeighbourType(tile, map, EastOffset),
    s: getTileNeighbourType(tile, map, SouthOffset),
    w: getTileNeighbourType(tile, map, WestOffset)
  };
}
function getTileImageBasedOnSurrounds(
  tile: Tile,
  map: WorldMap,
  autotileInfos: AutoTileInfo[]
): p5.Image {
  const suffix = getTileImageNameSuffixBasedOnSurrounds(
    tile,
    map,
    autotileInfos
  );
  if (tile.tileType === "grass") {
    return grassImages[suffix];
  } else {
    return imgRiver;
  }
}

function getTileImageNameSuffixBasedOnSurrounds(
  tile: Tile,
  map: WorldMap,
  autotileInfos: AutoTileInfo[]
): string {
  const ns = getTileNeighbourTypes(tile, map);
  const foundATI = autotileInfos.find(
    ati =>
      ati.adjs.e == ns.e &&
      ati.adjs.s == ns.s &&
      ati.adjs.n == ns.n &&
      ati.adjs.w == ns.w
  );
  console.log({ pos: tile.pos, ns, autotileInfos, foundATI });
  return foundATI ? foundATI.name : "NONEFOUND";
}
function addContentsToTile(t: Tile, thing: TileContent) {
  t.contents.push(thing);
}

function draw() {
  background(0);
  fill("white");
  noStroke();

  drawWorldMap(gMap);
  if (debug) {
    drawDebug();
  }
}

function drawDebug() {
  fill("white");
  noStroke();
  textLabelledVector(gPlayer.pos, "player pos", 50, height - 200);
}
function drawWorldMap(map: WorldMap) {
  rectMode(CENTER);
  push();
  const tiles = map.tiles;
  translate(width / 2, height / 2);
  tiles.forEach(t => {
    push();
    translate(tilePosToScreenOffsetPosFromCentre(t.pos, map.width, map.height));
    let img: p5.Image;
    if (t.discovered) {
      img =
        t.tileType === "grass"
          ? getTileImageBasedOnSurrounds(t, gMap, autotileInfos)
          : imgRiver;
      image(imgRiver, 0, 0, gPixelsPerTile, gPixelsPerTile);
    } else {
      fill("gray");
      square(0, 0, gPixelsPerTile);
    }
    if (img) {
      image(img, 0, 0, gPixelsPerTile, gPixelsPerTile);
    }
    t.contents.forEach(thing => {
      drawTileOccupier(thing);
    });
    pop();
  });
  pop();
  fill("white");
  noStroke();
  text(`Movement Points: ${gPlayer.mp}`, 50, height - 100);
}

function drawTileOccupier(thing: TileContent) {
  fill("yellow");
  circle(0, 0, 10);
  const img: p5.Image = allImages[thing.imageName];
  assertTruthy(img, `img named ${thing.imageName}`);
  image(img, 0, 0, gPixelsPerTile, gPixelsPerTile);
}

function tilePosToScreenOffsetPosFromCentre(
  pos: p5.Vector,
  ww: number,
  wh: number
): p5.Vector {
  return createVector(pos.x - ww / 2, pos.y - wh / 2).mult(gPixelsPerTile);
}

function repeat(n: number, fn: (ix: number) => any) {
  for (let i = 0; i < n; i++) {
    fn(i);
  }
}
function randomTile() {
  return random(gMap.tiles);
}

function discover(t: Tile) {
  t.discovered = true;
}
type TileType = "grass" | "river";
function runTests() {
  const world = makeSimpleSquareMap();

  const t = (x: number, y: number) => tileAt(createVector(x, y));
  const sufx = (x: number, y: number) =>
    getTileImageNameSuffixBasedOnSurrounds(t(x, y), world, autotileInfos);

  assertEqual(sufx(1, 1), "nw", "nw tile");
  assertEqual(sufx(2, 1), "n", "north tile");
  assertEqual(sufx(3, 1), "ne", "ne tile");
  assertEqual(sufx(1, 2), "w", "west tile");
  assertEqual(sufx(2, 2), "c", "center tile");
  assertEqual(sufx(3, 2), "e", "e tile");
  assertEqual(sufx(1, 3), "sw", "sw tile");
  assertEqual(sufx(2, 3), "s", "south tile");
  assertEqual(sufx(3, 3), "se", "se tile");
}

function makeSimpleSquareMap(): WorldMap {
  const tiles: Tile[] = [];
  function ct(x: number, y: number, tt: TileType) {
    tiles.push(createTileAt(createVector(x, y), tt));
  }

  ct(0, 0, "river");
  ct(1, 0, "river");
  ct(2, 0, "river");
  ct(3, 0, "river");
  ct(4, 0, "river");
  ct(5, 0, "river");
  ct(6, 0, "river");
  ct(0, 1, "river");
  ct(1, 1, "grass");
  ct(2, 1, "grass");
  ct(3, 1, "grass");
  ct(4, 1, "river");
  ct(5, 1, "grass");
  ct(6, 1, "river");
  ct(0, 2, "river");
  ct(1, 2, "grass");
  ct(2, 2, "grass");
  ct(3, 2, "grass");
  ct(4, 2, "river");
  ct(5, 2, "grass");
  ct(6, 2, "river");
  ct(0, 3, "river");
  ct(1, 3, "grass");
  ct(2, 3, "grass");
  ct(3, 3, "grass");
  ct(4, 3, "river");
  ct(5, 3, "grass");
  ct(6, 3, "river");
  ct(0, 4, "river");
  ct(1, 4, "river");
  ct(2, 4, "river");
  ct(3, 4, "river");
  ct(4, 4, "river");
  ct(5, 4, "river");
  ct(6, 4, "river");

  ct(0, 5, "river");
  ct(1, 5, "grass");
  ct(2, 5, "grass");
  ct(3, 5, "grass");
  ct(4, 5, "river");
  ct(5, 5, "grass");
  ct(6, 5, "river");

  ct(0, 6, "river");
  ct(1, 6, "river");
  ct(2, 6, "river");
  ct(3, 6, "river");
  ct(4, 6, "river");
  ct(5, 6, "river");
  ct(6, 6, "river");

  return {
    width: 7,
    height: 7,
    tiles: tiles
  };
}
