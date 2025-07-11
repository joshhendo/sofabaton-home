declare module 'sonos-discovery' {
  export default class SonosSystem {
    constructor(config?: any);
    zones: any[];
    getPlayer(roomName: string): any;
    getAnyPlayer(): any;
    on(event: string, callback: (...args: any[]) => void): void;
  }
}