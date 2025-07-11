import axios from 'axios';
import _ from 'lodash';
import bluebird from 'bluebird';

export type ZonesResponse = Array<{
    uuid: string
    coordinator: {
        uuid: string
        state: {
            volume: number
            mute: boolean
            equalizer: {
                bass: number
                treble: number
                loudness: boolean
                speechEnhancement?: boolean
                nightMode?: boolean
            }
            currentTrack: {
                artist?: string
                title?: string
                album?: string
                albumArtUri?: string
                duration: number
                uri: string
                trackUri: string
                type: string
                stationName: string
                absoluteAlbumArtUri?: string
            }
            nextTrack: {
                artist: string
                title: string
                album: string
                albumArtUri: string
                duration: number
                uri: string
                trackUri?: string
                absoluteAlbumArtUri?: string
            }
            trackNo: number
            elapsedTime: number
            elapsedTimeFormatted: string
            playbackState: string
            playMode: {
                repeat: string
                shuffle: boolean
                crossfade: boolean
            }
        }
        roomName: string
        coordinator: string
        groupState: {
            volume: number
            mute: boolean
        }
    }
    members: Array<{
        uuid: string
        state: {
            volume: number
            mute: boolean
            equalizer: {
                bass: number
                treble: number
                loudness: boolean
                speechEnhancement?: boolean
                nightMode?: boolean
            }
            currentTrack: {
                duration: number
                uri: string
                trackUri: string
                type: string
                stationName: string
                artist?: string
                title?: string
                album?: string
                albumArtUri?: string
                absoluteAlbumArtUri?: string
            }
            nextTrack: {
                artist: string
                title: string
                album: string
                albumArtUri: string
                duration: number
                uri: string
                trackUri?: string
                absoluteAlbumArtUri?: string
            }
            trackNo: number
            elapsedTime: number
            elapsedTimeFormatted: string
            playbackState: string
            playMode: {
                repeat: string
                shuffle: boolean
                crossfade: boolean
            }
        }
        roomName: string
        coordinator: string
        groupState: {
            volume: number
            mute: boolean
        }
    }>
}>


export async function getPlayers(): Promise<string[]> {
    const resp = await axios.get<ZonesResponse>('http://localhost:5005/zones');
    const data = resp.data;

    const players = [];

    for (const zone of data) {
        for (const member of zone.members) {
            players.push(member.roomName);
        }
    }

    return players;
}

export async function createGroup(coordinator: string, players: string[]): Promise<string | null> {
    const existingGroups = await axios.get<ZonesResponse>('http://localhost:5005/zones');

    if (players.length <= 1) {
        return null;
    }

    // If the coordinator is already a coordinator, have all players in it that aren't requested leave,
    // and all players that are requested join if they aren't already
    const existingZone = _.find(existingGroups.data, (x => x.coordinator.roomName === coordinator));

    if (existingZone) {
        // it is!
        // Look for existing members which shouldn't be there
        for (const member of existingZone.members) {
            if (member.roomName === coordinator) {
                continue;
            }

            if (!players.includes(member.roomName)) {
                // This room isn't requested
                axios.get(`http://localhost:5005/${member.roomName}/leave`);
            }
        }

        // Look for requested members that need to be added
        // for (const member of players) {
        //     if (member === coordinator) {
        //         continue;
        //     }
        //
        //     if (!_.find(existingZone.members, (x) => x.roomName === member)) {
        //         // This member doesn't exist, but we want it to!
        //         await axios.get(`http://localhost:5005/${member}/join/${coordinator}`);
        //     }
        // }
    } else {
        // The requested coordinator isn't yet a coordinator. Have it leave which group it's in and add all requested mebers to it
        await axios.get(`http://localhost:5005/${coordinator}/leave`);

        for (const member of players) {
            if (member === coordinator) {
                continue;
            }

            await axios.get(`http://localhost:5005/${member}/join/${coordinator}`);
        }
    }

    // Set the volume to 10 for all members
    for (const member of players) {
        await axios.get(`http://localhost:5005/${member}/volume/10`);
    }

    // for (let i = 0; i < players.length; i++) {
    //     const player = players[i];
    //     if (player === coordinator) {
    //         continue;
    //     }
    //
    //     const leaveCommand = `http://localhost:5005/${players[i]}/leave`;
    //     const volumeCommand = `http://localhost:5005/${players[i]}/volume/10`;
    //     const joinCommand = `http://localhost:5005/${players[i]}/join/${coordinator}`;
    //
    //     console.log(leaveCommand);
    //     await axios.get(encodeURI(leaveCommand));
    //
    //     await axios.get(encodeURI(volumeCommand));
    //
    //     console.log(joinCommand);
    //     await axios.get(encodeURI(joinCommand));
    // }

    return coordinator;
}

export async function setFavourite(player: string, favourite: string) {
    await axios.get(`http://localhost:5005/${player}/favorite/${favourite}`);
}

export async function playerAction(player: string, action: 'play' | 'pause' | 'playpause') {
    await axios.get(`http://localhost:5005/${player}/${action}`);
}

export async function zoneAction(zone: string, action: string) {
    await axios.get(`http://localhost:5005/${zone}/groupVolume/${action}`);
}

export async function getZoneWithCoordinator(coordinator: string) {
    const resp = await axios.get<ZonesResponse>(`http://localhost:5005/zones`);
    const data = resp.data;

    for (const zone of data) {
        if (zone.coordinator.roomName === coordinator) {
            return zone.uuid;
        }
    }

    return null;
}