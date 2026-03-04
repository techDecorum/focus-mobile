import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Patch missing Buffer methods needed by Anchor/borsh deserialization
if (typeof Buffer.prototype.readUIntLE === 'undefined') {
  Buffer.prototype.readUIntLE = function(offset: number, byteLength: number): number {
    let val = 0;
    let mul = 1;
    let i = 0;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    val = this[offset];
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    return val;
  };
}

if (typeof Buffer.prototype.readUIntBE === 'undefined') {
  Buffer.prototype.readUIntBE = function(offset: number, byteLength: number): number {
    let val = 0;
    let i = byteLength - 1;
    let mul = 1;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    val = this[offset + i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    return val;
  };
}

if (typeof Buffer.prototype.readIntLE === 'undefined') {
  Buffer.prototype.readIntLE = function(offset: number, byteLength: number): number {
    let val = this.readUIntLE(offset, byteLength);
    const limit = Math.pow(2, 8 * byteLength - 1);
    if (val >= limit) val -= limit * 2;
    return val;
  };
}

if (typeof Buffer.prototype.readIntBE === 'undefined') {
  Buffer.prototype.readIntBE = function(offset: number, byteLength: number): number {
    let val = this.readUIntBE(offset, byteLength);
    const limit = Math.pow(2, 8 * byteLength - 1);
    if (val >= limit) val -= limit * 2;
    return val;
  };
}

if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  } as any;
}

if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    listeners: any = {};
    addEventListener(type: string, listener: any) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(listener);
    }
    removeEventListener(type: string, listener: any) {
      if (this.listeners[type]) {
        this.listeners[type] = this.listeners[type].filter((l: any) => l !== listener);
      }
    }
    dispatchEvent(event: any) {
      if (this.listeners[event.type]) {
        this.listeners[event.type].forEach((l: any) => l(event));
      }
    }
  } as any;
}