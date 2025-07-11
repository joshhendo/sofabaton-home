import { SonosService, SimplifiedZone } from './sonos-service.js';
import _ from 'lodash';

// Re-export types for backward compatibility
export type ZonesResponse = SimplifiedZone[];

// Create a singleton instance of the Sonos service
const sonosService = new SonosService();

export async function getPlayers(): Promise<string[]> {
    return sonosService.getPlayers();
}

export async function createGroup(coordinator: string, players: string[]): Promise<string | null> {
    return sonosService.createGroup(coordinator, players);
}

export async function setFavourite(player: string, favourite: string) {
    return sonosService.playFavorite(player, favourite);
}

export async function playerAction(player: string, action: 'play' | 'pause' | 'playpause') {
    return sonosService.playerAction(player, action);
}

export async function zoneAction(zone: string, action: string) {
    return sonosService.zoneAction(zone, action);
}

export async function getZoneWithCoordinator(coordinator: string) {
    const zones = await sonosService.getZones();
    
    for (const zone of zones) {
        if (zone.coordinator.roomName === coordinator) {
            return zone.uuid;
        }
    }

    return null;
}