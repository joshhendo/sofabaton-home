import SonosSystem from 'sonos-discovery';
import { XmlEntities } from 'html-entities';
import _ from 'lodash';

const xmlEntities = new XmlEntities();

export interface SonosServiceConfig {
  household?: string;
  listenInterface?: string;
  port?: number;
  discoveryPort?: number;
}

export interface TrackInfo {
  artist?: string;
  title?: string;
  album?: string;
  albumArtUri?: string;
  duration: number;
  uri: string;
  trackUri: string;
  type?: string;
  stationName?: string;
  absoluteAlbumArtUri?: string;
}

export interface PlayerState {
  volume: number;
  mute: boolean;
  equalizer: {
    bass: number;
    treble: number;
    loudness: boolean;
    speechEnhancement?: boolean;
    nightMode?: boolean;
  };
  currentTrack: TrackInfo;
  nextTrack: TrackInfo;
  trackNo: number;
  elapsedTime: number;
  elapsedTimeFormatted: string;
  playbackState: string;
  playMode: {
    repeat: string;
    shuffle: boolean;
    crossfade: boolean;
  };
}

export interface SimplifiedZone {
  uuid: string;
  coordinator: {
    uuid: string;
    state: PlayerState;
    roomName: string;
    coordinator: string;
    groupState: {
      volume: number;
      mute: boolean;
    };
  };
  members: Array<{
    uuid: string;
    state: PlayerState;
    roomName: string;
    coordinator: string;
    groupState: {
      volume: number;
      mute: boolean;
    };
  }>;
}

export class SonosService {
  private discovery: any;
  private initialized: boolean = false;

  constructor(config: SonosServiceConfig = {}) {
    this.discovery = new SonosSystem(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Wait for discovery to find devices
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.discovery.zones.length > 0) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 10000);
    });

    this.initialized = true;
  }

  getPlayer(roomName: string): any {
    return this.discovery.getPlayer(roomName);
  }

  getAnyPlayer(): any {
    return this.discovery.getAnyPlayer();
  }

  // Zone management
  async getZones(): Promise<SimplifiedZone[]> {
    await this.initialize();

    return this.discovery.zones.map((zone: any) => {
      const coordinator = zone.coordinator;
      return {
        uuid: zone.uuid,
        coordinator: this.simplifyPlayer(coordinator),
        members: zone.members.map((member: any) => this.simplifyPlayer(member))
      };
    });
  }

  private simplifyPlayer(player: any) {
    return {
      uuid: player.uuid,
      state: player.state,
      roomName: player.roomName,
      coordinator: player.coordinator ? player.coordinator.uuid : player.uuid,
      groupState: player.groupState || { volume: player.state.volume, mute: player.state.mute }
    };
  }

  // Volume control
  async setVolume(roomName: string, volume: number): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.setVolume(volume);
  }

  async getGroupVolume(roomName: string): Promise<number> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.groupState.volume;
  }

  async setGroupVolume(roomName: string, volume: number): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.setGroupVolume(volume);
  }

  // Playback control
  async play(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.play();
  }

  async pause(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.pause();
  }

  async playPause(roomName: string): Promise<{ status: string; paused: boolean }> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const state = player.coordinator.state.playbackState;
    if (state === 'PLAYING') {
      await player.coordinator.pause();
      return { status: 'success', paused: true };
    } else {
      await player.coordinator.play();
      return { status: 'success', paused: false };
    }
  }

  async next(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.nextTrack();
  }

  async previous(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.previousTrack();
  }

  // State
  async getState(roomName: string): Promise<PlayerState> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.state;
  }

  // Group management
  async join(roomName: string, coordinatorName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    const coordinator = this.getPlayer(coordinatorName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    if (!coordinator) throw new Error(`Coordinator ${coordinatorName} not found`);

    return player.setAVTransport(`x-rincon:${coordinator.uuid}`);
  }

  async leave(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    return player.becomeCoordinatorOfStandaloneGroup();
  }

  // Mute control
  async mute(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.mute();
  }

  async unmute(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.unMute();
  }

  async toggleMute(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    if (player.state.mute) {
      return player.unMute();
    } else {
      return player.mute();
    }
  }

  async groupMute(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.muteGroup();
  }

  async groupUnmute(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.unMuteGroup();
  }

  // Favorites
  async getFavorites(): Promise<any> {
    await this.initialize();
    const player = this.getAnyPlayer();
    return player.system.getFavorites();
  }

  async playFavorite(roomName: string, favorite: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    return player.coordinator.replaceWithFavorite(decodeURIComponent(favorite))
      .then(() => player.coordinator.play());
  }

  // Playlists
  async getPlaylists(): Promise<any> {
    await this.initialize();
    const player = this.getAnyPlayer();
    return player.system.getPlaylists();
  }

  async playPlaylist(roomName: string, playlist: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    return player.coordinator.replaceWithPlaylist(decodeURIComponent(playlist))
      .then(() => player.coordinator.play());
  }

  // Queue management
  async clearQueue(roomName: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);
    return player.coordinator.clearQueue();
  }

  async getQueue(roomName: string, detailed = false, limit = 500): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const queue = await player.coordinator.getQueue(0, limit);

    if (!detailed) {
      return queue.items.map((item: any) => ({
        title: item.title,
        artist: item.artist,
        album: item.album,
        albumArtUri: item.albumArtUri
      }));
    }

    return queue;
  }

  // Seek
  async seek(roomName: string, trackNo?: number, elapsedTime?: number): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    if (trackNo !== undefined) {
      await player.coordinator.seek(trackNo);
    }

    if (elapsedTime !== undefined) {
      await player.coordinator.timeSeek(elapsedTime);
    }

    return { status: 'success' };
  }

  // Sleep timer
  async setSleepTimer(roomName: string, sleepTime: string | number): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const formattedTime = sleepTime === 'off' ? 0 : parseInt(sleepTime.toString());
    return player.coordinator.sleep(formattedTime);
  }

  // Line-in
  async setLineIn(roomName: string, sourcePlayerName?: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const sourcePlayer = sourcePlayerName ? this.getPlayer(sourcePlayerName) : player;
    if (!sourcePlayer) throw new Error(`Source player ${sourcePlayerName} not found`);

    const uri = `x-rincon-stream:${sourcePlayer.uuid}`;
    return player.coordinator.setAVTransport(uri);
  }

  // Play mode
  async setPlayMode(roomName: string, playMode: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const modes: { [key: string]: any } = {
      'normal': { shuffle: false, repeat: false, crossfade: false },
      'repeat_all': { shuffle: false, repeat: true, crossfade: false },
      'shuffle': { shuffle: true, repeat: false, crossfade: false },
      'shuffle_norepeat': { shuffle: true, repeat: false, crossfade: false },
      'shuffle_repeat_one': { shuffle: true, repeat: 'one', crossfade: false },
      'repeat_one': { shuffle: false, repeat: 'one', crossfade: false },
      'crossfade': { crossfade: true }
    };

    const mode = modes[playMode.toLowerCase()];
    if (!mode) throw new Error(`Invalid play mode: ${playMode}`);

    return player.coordinator.setPlayMode(mode);
  }

  // Spotify
  async addSpotifyToQueue(roomName: string, spotifyUri: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const uri = this.spotifyUriToSonosUri(spotifyUri);
    const metadata = this.generateSpotifyMetadata(spotifyUri);

    return player.coordinator.addURIToQueue(uri, metadata);
  }

  async playSpotifyNow(roomName: string, spotifyUri: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const uri = this.spotifyUriToSonosUri(spotifyUri);
    const metadata = this.generateSpotifyMetadata(spotifyUri);

    await player.coordinator.clearQueue();
    await player.coordinator.addURIToQueue(uri, metadata);
    return player.coordinator.play();
  }

  async playSpotifyNext(roomName: string, spotifyUri: string): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const uri = this.spotifyUriToSonosUri(spotifyUri);
    const metadata = this.generateSpotifyMetadata(spotifyUri);
    const position = player.coordinator.state.trackNo + 1;

    return player.coordinator.addURIToQueue(uri, metadata, position);
  }

  private spotifyUriToSonosUri(spotifyUri: string): string {
    const parts = spotifyUri.split(':');
    const spotifyID = parts[parts.length - 1];
    const type = parts[parts.length - 2];

    if (type === 'track') {
      return `x-sonos-spotify:spotify:track:${spotifyID}?sid=9&flags=8224&sn=9`;
    } else if (type === 'album') {
      return `x-rincon-cpcontainer:1004206cspotify:album:${spotifyID}?sid=9&flags=8300&sn=9`;
    } else if (type === 'artist') {
      return `x-rincon-cpcontainer:1004206cspotify:artist:${spotifyID}?sid=9&flags=8300&sn=9`;
    } else if (type === 'playlist') {
      const userID = parts[parts.length - 3];
      return `x-rincon-cpcontainer:1006206cspotify:playlist:${spotifyID}?sid=9&flags=8300&sn=9`;
    }

    throw new Error(`Unsupported Spotify URI type: ${type}`);
  }

  private generateSpotifyMetadata(spotifyUri: string): string {
    const parts = spotifyUri.split(':');
    const type = parts[parts.length - 2];

    if (type === 'track') {
      return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="${spotifyUri}" restricted="true">
          <dc:title></dc:title>
          <upnp:class>object.item.audioItem.musicTrack</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON2311_X_#Svc2311-0-Token</desc>
        </item>
      </DIDL-Lite>`;
    }

    return '';
  }

  // TuneIn Radio
  async playTuneIn(roomName: string, stationId: string | number): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const stationIdStr = stationId.toString();
    const uri = `x-sonosapi-stream:${stationIdStr}?sid=254&flags=8224&sn=0`;
    const metadata = `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
      <item id="R:0/0/0" parentID="R:0/0" restricted="true">
        <dc:title>TuneIn</dc:title>
        <upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON65031_</desc>
      </item>
    </DIDL-Lite>`;

    return player.coordinator.setAVTransport(uri, metadata);
  }

  // Equalizer
  async setEqualizer(roomName: string, settings: { bass?: number; treble?: number; loudness?: boolean }): Promise<any> {
    await this.initialize();
    const player = this.getPlayer(roomName);
    if (!player) throw new Error(`Player ${roomName} not found`);

    const promises = [];

    if (settings.bass !== undefined) {
      promises.push(player.setBass(settings.bass));
    }

    if (settings.treble !== undefined) {
      promises.push(player.setTreble(settings.treble));
    }

    if (settings.loudness !== undefined) {
      promises.push(player.setLoudness(settings.loudness));
    }

    await Promise.all(promises);
    return { status: 'success' };
  }

  // Reindex music library
  async reindexMusicLibrary(): Promise<any> {
    await this.initialize();
    const player = this.getAnyPlayer();
    return player.system.refreshShareIndex();
  }

  // Pause all
  async pauseAll(): Promise<any> {
    await this.initialize();
    const promises = this.discovery.zones
      .filter((zone: any) => zone.coordinator.state.playbackState === 'PLAYING')
      .map((zone: any) => zone.coordinator.pause());

    await Promise.all(promises);
    return { paused: promises.length };
  }

  // Get services
  async getServices(): Promise<any> {
    await this.initialize();
    const player = this.getAnyPlayer();
    return player.system.getMusicServices();
  }

  // Helper methods for group management (similar to your existing code)
  async createGroup(coordinatorName: string, playerNames: string[]): Promise<string | null> {
    if (playerNames.length <= 1) {
      return null;
    }

    await this.initialize();

    const zones = await this.getZones();
    const existingZone = zones.find(z => z.coordinator.roomName === coordinatorName);

    if (existingZone) {
      // Remove members that shouldn't be there
      for (const member of existingZone.members) {
        if (member.roomName === coordinatorName) continue;

        if (!playerNames.includes(member.roomName)) {
          await this.leave(member.roomName);
        }
      }

      // Add new members
      for (const playerName of playerNames) {
        if (playerName === coordinatorName) continue;

        const isMember = existingZone.members.some(m => m.roomName === playerName);
        if (!isMember) {
          await this.join(playerName, coordinatorName);
        }
      }
    } else {
      // Make coordinator leave its current group
      await this.leave(coordinatorName);

      // Add all members to the new group
      for (const playerName of playerNames) {
        if (playerName === coordinatorName) continue;
        await this.join(playerName, coordinatorName);
      }
    }

    // Set volume for all members
    for (const playerName of playerNames) {
      await this.setVolume(playerName, 10);
    }

    return coordinatorName;
  }

  async getPlayers(): Promise<string[]> {
    await this.initialize();

    const zones = await this.getZones();
    const players: string[] = [];

    for (const zone of zones) {
      for (const member of zone.members) {
        players.push(member.roomName);
      }
    }

    return players;
  }

  async playerAction(playerName: string, action: 'play' | 'pause' | 'playpause'): Promise<any> {
    switch (action) {
      case 'play':
        return this.play(playerName);
      case 'pause':
        return this.pause(playerName);
      case 'playpause':
        return this.playPause(playerName);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async zoneAction(zoneName: string, volume: number, type: 'absolute' | 'relative'): Promise<any> {
    const volumeToSet = type === 'absolute' ? volume : ((await this.getGroupVolume(zoneName)) + volume);

    console.log(volumeToSet);

    return this.setGroupVolume(zoneName, volumeToSet);
  }
}
