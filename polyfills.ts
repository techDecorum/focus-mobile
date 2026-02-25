import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Event polyfill for Solana web3.js
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