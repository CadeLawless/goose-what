import { NitroModules } from 'react-native-nitro-modules';

import type {
  LiveOverlayOutput,
  LiveOverlayOutputFactory,
} from './specs/LiveOverlayOutput.nitro';

export type {
  LiveOverlayEvent,
  LiveOverlayOutput,
  LiveOverlayRecordingResult,
} from './specs/LiveOverlayOutput.nitro';

let factory: LiveOverlayOutputFactory | null = null;

export function createLiveOverlayOutput(): LiveOverlayOutput {
  factory ??= NitroModules.createHybridObject<LiveOverlayOutputFactory>(
    'LiveOverlayOutputFactory',
  );
  return factory.createLiveOverlayOutput();
}
