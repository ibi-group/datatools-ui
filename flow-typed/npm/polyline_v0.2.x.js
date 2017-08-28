// flow-typed signature: e8af478fdd21bcfff8ff15754086c5b2
// flow-typed version: <<STUB>>/polyline_v^0.2.0/flow_v0.53.1

type Coordinate = [number, number]

declare module 'polyline' {
  declare module.exports: {
    decode(string): Coordinate[],
    encode(Coordinate[]): string
  }
}
