import {
  IvsClient,
  CreateChannelCommand,
  DeleteChannelCommand,
  GetStreamCommand,
  StopStreamCommand,
  GetChannelCommand,
  type ChannelLatencyMode,
  type ChannelType,
} from "@aws-sdk/client-ivs";

// ─── IVS Client ──────────────────────────────────────────────────────────────

let _ivsClient: IvsClient | null = null;
function getIvsClient(): IvsClient {
  if (!_ivsClient) {
    _ivsClient = new IvsClient({
      region: process.env.AWS_IVS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_IVS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_IVS_SECRET_KEY || "",
      },
    });
  }
  return _ivsClient;
}

// ─── Create Channel ──────────────────────────────────────────────────────────
// Creates an IVS channel for a stream. Returns channel info + stream key.

export async function createIvsChannel(name: string) {
  const command = new CreateChannelCommand({
    name,
    latencyMode: "LOW" as ChannelLatencyMode,
    type: "STANDARD" as ChannelType,
    authorized: false,
    insecureIngest: false,
  });

  const response = await getIvsClient().send(command);

  return {
    channelArn: response.channel?.arn || "",
    ingestEndpoint: response.channel?.ingestEndpoint || "",
    playbackUrl: response.channel?.playbackUrl || "",
    streamKey: response.streamKey?.value || "",
  };
}

// ─── Delete Channel ──────────────────────────────────────────────────────────
// Deletes an IVS channel. Call when a stream is deleted or cleaned up.

export async function deleteIvsChannel(channelArn: string) {
  const command = new DeleteChannelCommand({ arn: channelArn });
  await getIvsClient().send(command);
}

// ─── Get Stream Info ─────────────────────────────────────────────────────────
// Gets live stream metadata (viewer count, health, state).

export async function getIvsStream(channelArn: string) {
  try {
    const command = new GetStreamCommand({ channelArn });
    const response = await getIvsClient().send(command);
    return {
      state: response.stream?.state, // LIVE | OFFLINE
      health: response.stream?.health, // HEALTHY | STARVING | UNKNOWN
      viewerCount: response.stream?.viewerCount || 0,
      startTime: response.stream?.startTime,
    };
  } catch (error: any) {
    // ChannelNotBroadcasting means stream is offline
    if (error.name === "ChannelNotBroadcasting") {
      return { state: "OFFLINE", health: "UNKNOWN", viewerCount: 0, startTime: null };
    }
    throw error;
  }
}

// ─── Stop Stream ─────────────────────────────────────────────────────────────
// Force-stops a live stream on the given channel.

export async function stopIvsStream(channelArn: string) {
  const command = new StopStreamCommand({ channelArn });
  await getIvsClient().send(command);
}

// ─── Get Channel ─────────────────────────────────────────────────────────────
// Gets channel details (playback URL, ingest endpoint, etc.)

export async function getIvsChannel(channelArn: string) {
  const command = new GetChannelCommand({ arn: channelArn });
  const response = await getIvsClient().send(command);
  return {
    arn: response.channel?.arn || "",
    ingestEndpoint: response.channel?.ingestEndpoint || "",
    playbackUrl: response.channel?.playbackUrl || "",
    name: response.channel?.name || "",
    latencyMode: response.channel?.latencyMode,
    type: response.channel?.type,
  };
}
