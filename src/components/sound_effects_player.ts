import { Howl, Howler } from "howler";

import {
  ClientEventInfo,
  ClientEventType,
  ClientFlowEngine,
  ClientFlowEngineObserver,
} from "../client_side/client_flow_engine";
import {
  BOARD_SIZE,
  Move,
  Position,
  Square,
} from "../game_flow_util/game_elements";

const MAX_VOLUME = 0.3;
const VICTORY_THEME_VOLUME_SCALAR: number = 0.3;
const DEFEAT_THEME_VOLUME_SCALAR: number = 0.3;
const MOVE_VOLUME_SCALARS: number[] = [1];
const CAPTURE_VOLUME_SCALARS: number[] = [1.5, 1.5, 1.5];


interface Sound {
  audio: Howl;
  // between 0 and 1
  volumeScalar: number;
}

let VICORY_THEME_SOUND: Sound;
let DEFEAT_THEME_SOUND: Sound;
let MOVE_SOUNDS: Sound[];
let CAPTURE_SOUNDS: Sound[];

function initializeStaticSounds() {
  let volumeScalars: number[];

  VICORY_THEME_SOUND = {
    audio: new Howl({
      src: require("../assets/gameplay_audio/victory_theme.wav"),
    }),
    volumeScalar: VICTORY_THEME_VOLUME_SCALAR,
  };

  DEFEAT_THEME_SOUND = {
    audio: new Howl({
      src: require("../assets/gameplay_audio/defeat_theme.wav"),
    }),
    volumeScalar: DEFEAT_THEME_VOLUME_SCALAR,
  };

  MOVE_SOUNDS = [];
  for (let i = 0; i < 1; i++) {
    MOVE_SOUNDS.push({
      audio: new Howl({
        src: require(`../assets/gameplay_audio/move_${i + 1}.wav`),
      }),
      volumeScalar: MOVE_VOLUME_SCALARS[i],
    });
  }

  CAPTURE_SOUNDS = [];
  for (let i = 0; i < 3; i++) {
    CAPTURE_SOUNDS.push({
      audio: new Howl({
        src: require(`../assets/gameplay_audio/capture_${i + 1}.wav`),
      }),
      volumeScalar: CAPTURE_VOLUME_SCALARS[i],
    });
  }
}

const MAX_DISTANCE: number = Math.sqrt(2) * (BOARD_SIZE - 1);
const MIDDLE_COORDINATE = (BOARD_SIZE - 1) / 2;

export class SoundEffectsPlayer implements ClientFlowEngineObserver {
  private _isMuted: boolean = false;
  private playerIndex: number = null as any;
  private playerRow: number = MIDDLE_COORDINATE;
  private playerColumn: number = MIDDLE_COORDINATE;

  constructor(private clientFlowEngine: ClientFlowEngine) {
    initializeStaticSounds();
    if (clientFlowEngine != null) {
      clientFlowEngine.addObserver(this);
    }
  }

  get isMuted(): boolean {
    return this._isMuted;
  }

  mute(): void {
    this._isMuted = true;
  }

  unmute(): void {
    this._isMuted = false;
  }

  private playSound(sound: Sound, sourceSquare: Square) {
    if (!this._isMuted) {
      let relativeDistanceFromSource: number =
        sourceSquare == null
          ? 0
          : Math.sqrt(
              Math.pow(this.playerRow - sourceSquare.row, 2) +
                Math.pow(this.playerColumn - sourceSquare.column, 2)
            ) / MAX_DISTANCE;
      let volume: number =
        MAX_VOLUME *
        sound.volumeScalar *
        Math.pow(1 - relativeDistanceFromSource, 5);
      Howler.volume(volume);
      sound.audio.play();
    }
  }

  private playRandomSound(sounds: Sound[], sourceSquare: Square) {
    this.playSound(
      sounds[Math.floor(Math.random() * sounds.length)],
      sourceSquare
    );
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.roleAssigned: {
        this.playerIndex = info.get(ClientEventInfo.playerIndex);
        let startSquare = Position.getStartSquareByPlayer(this.playerIndex);
        this.playerRow = startSquare.row;
        this.playerColumn = startSquare.column;
        break;
      }
      case ClientEventType.move: {
        let move: Move = info.get(ClientEventInfo.move);
        if (info.get(ClientEventInfo.movingPlayerIndex) === this.playerIndex) {
          this.playerRow = move.row;
          this.playerColumn = move.column;
        }
        let sourceSquare = new Square(move.row, move.column);
        if (move.isCapture || move.isEnPassant) {
          this.playRandomSound(CAPTURE_SOUNDS, sourceSquare);
        } else {
          this.playRandomSound(MOVE_SOUNDS, sourceSquare);
        }

        break;
      }
      case ClientEventType.death: {
        if (info.get(ClientEventInfo.dyingPlayerIndex) === this.playerIndex) {
          this.playerRow = MIDDLE_COORDINATE;
          this.playerColumn = MIDDLE_COORDINATE;
        }
        break;
      }
      case ClientEventType.respawn: {
        let respawnSquare: Square = info.get(ClientEventInfo.respawnSquare);
        if (
          info.get(ClientEventInfo.respawningPlayerIndex) === this.playerIndex
        ) {
          this.playerRow = respawnSquare.row;
          this.playerColumn = respawnSquare.row;
        }
        break;
      }
      case ClientEventType.gameEnded: {
        let isVictory =
          Position.getStartPieceByPlayer(this.playerIndex).color ===
          info.get(ClientEventInfo.winningColor);
        if (isVictory) {
          this.playSound(VICORY_THEME_SOUND, null as any);
        } else {
          this.playSound(DEFEAT_THEME_SOUND, null as any);
        }
        break;
      }
      case ClientEventType.disconnectedFromLobby: {
        this.clientFlowEngine.removeObserver(this);
        break;
      }
      case ClientEventType.returnToLobby: {
        this.clientFlowEngine.removeObserver(this);
        break;
      }
    }
  }
}
