export class KeyRotator {
  constructor( keyArray ) {
    this.keys = keyArray
    this.keysSize = this.keys.length
    this.currentKey = 0
  }

  getKey() {
    if ( this.currentKey >= this.keysSize ) {
      this.currentKey = 0
    }

    return this.keys[ this.currentKey++ ]
  }
}
