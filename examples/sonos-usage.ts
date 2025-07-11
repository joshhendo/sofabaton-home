import { SonosService } from '../src/sonos-service.js';

// Example usage of the Sonos service
async function exampleUsage() {
  // Create a new instance of the Sonos service
  const sonos = new SonosService();

  try {
    // Get all available players
    console.log('Getting all players...');
    const players = await sonos.getPlayers();
    console.log('Available players:', players);

    // Get zones
    console.log('\nGetting zones...');
    const zones = await sonos.getZones();
    console.log('Zones:', JSON.stringify(zones, null, 2));

    // Control playback
    const playerName = 'Living Room'; // Replace with your player name
    
    // Play
    await sonos.play(playerName);
    console.log(`\nStarted playback on ${playerName}`);

    // Get player state
    const state = await sonos.getState(playerName);
    console.log(`\nPlayer state:`, state);

    // Set volume
    await sonos.setVolume(playerName, 20);
    console.log(`\nSet volume to 20 on ${playerName}`);

    // Play a favorite
    const favoriteName = 'My Playlist'; // Replace with your favorite name
    await sonos.playFavorite(playerName, favoriteName);
    console.log(`\nPlaying favorite "${favoriteName}" on ${playerName}`);

    // Group players
    const players = ['Living Room', 'Kitchen', 'Bedroom'];
    await sonos.createGroup('Living Room', players);
    console.log(`\nCreated group with coordinator "Living Room"`);

    // Control group volume
    await sonos.setGroupVolume('Living Room', 15);
    console.log(`\nSet group volume to 15`);

    // Play Spotify (requires Spotify URI)
    const spotifyUri = 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'; // Example track
    await sonos.playSpotifyNow(playerName, spotifyUri);
    console.log(`\nPlaying Spotify track on ${playerName}`);

    // Play TuneIn radio station
    const stationId = 's12345'; // Replace with actual station ID
    await sonos.playTuneIn(playerName, stationId);
    console.log(`\nPlaying TuneIn station on ${playerName}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Available methods in the SonosService:
/*
- Volume Control:
  - setVolume(roomName, volume)
  - setGroupVolume(roomName, volume)

- Playback Control:
  - play(roomName)
  - pause(roomName)
  - playPause(roomName)
  - next(roomName)
  - previous(roomName)

- Group Management:
  - join(roomName, coordinatorName)
  - leave(roomName)
  - createGroup(coordinatorName, playerNames)

- Mute Control:
  - mute(roomName)
  - unmute(roomName)
  - toggleMute(roomName)
  - groupMute(roomName)
  - groupUnmute(roomName)

- Content Management:
  - playFavorite(roomName, favoriteName)
  - playPlaylist(roomName, playlistName)
  - getFavorites()
  - getPlaylists()

- Queue Management:
  - clearQueue(roomName)
  - getQueue(roomName, detailed?, limit?)

- Music Services:
  - playSpotifyNow(roomName, spotifyUri)
  - addSpotifyToQueue(roomName, spotifyUri)
  - playSpotifyNext(roomName, spotifyUri)
  - playTuneIn(roomName, stationId)

- Other Controls:
  - seek(roomName, trackNo?, elapsedTime?)
  - setSleepTimer(roomName, sleepTime)
  - setLineIn(roomName, sourcePlayerName?)
  - setPlayMode(roomName, playMode)
  - setEqualizer(roomName, settings)
  - reindexMusicLibrary()
  - pauseAll()
*/

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage();
}