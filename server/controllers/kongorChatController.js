const readInt = (buffer, offset) => {
    return [buffer.readInt32LE(offset), offset + 4];
};

const readByte = (buffer, offset) => {
    return [buffer.readInt8(offset), offset + 1];
};

const parseReplayStatus = (data) => {
    let offset = 4;
    let replayStatus = {};
  
    // Assuming data is a Buffer
    replayStatus['match_id'] = data.readIntLE(offset, 3);  // 2 bytes for match_id
    offset += 3;
    // console.log(data.slice(offset, offset+2));
    replayStatus['status'] = data.readIntLE(offset+1, 1);  // 1 byte for status
    offset += 2;
  
    if (replayStatus['status'] === 7) {
      replayStatus['extra_byte'] = data.readIntLE(offset, 1);  // 1 byte for extra_byte
      offset += 1;
    }
  
    let status;
    if (replayStatus['status'] === 5) status = 'QUEUED';
    if (replayStatus['status'] === 6) status = 'UPLOADING';
    if (replayStatus['status'] === 7) {
      status = 'DONE';
      console.log(`Replay available: http://api.kongor.online/replays/M${replayStatus['match_id']}.honreplay`);
    }
  
    console.log(`Replay status update\n\tMatch ID: ${replayStatus['match_id']}\n\tStatus: ${status}`);
  
    return replayStatus;
  };

function createHandshakePacket() {
    let packet_data = Buffer.alloc(2);
    packet_data.writeUInt16LE(0xC00, 0);

    let accountId = Buffer.alloc(4);
    accountId.writeUInt32LE(254272, 0);
    packet_data = Buffer.concat([packet_data, accountId]);

    packet_data = Buffer.concat([packet_data, Buffer.from(process.env.HON_COOKIE, 'utf-8'), Buffer.from('\0')]);
    packet_data = Buffer.concat([packet_data, Buffer.from('203.221.253.95', 'utf-8'), Buffer.from('\0')]);
    packet_data = Buffer.concat([packet_data, Buffer.from(process.env.HON_COOKIE, 'utf-8'), Buffer.from('\0')]);

    let chat_protocol_version = Buffer.alloc(4);
    chat_protocol_version.writeUInt32LE(68, 0);
    packet_data = Buffer.concat([packet_data, chat_protocol_version]);

    let operating_system = Buffer.alloc(1);
    operating_system.writeUInt8(129, 0);
    packet_data = Buffer.concat([packet_data, operating_system]);

    let os_major_version = Buffer.alloc(1);
    os_major_version.writeUInt8(6, 0);
    packet_data = Buffer.concat([packet_data, os_major_version]);

    let os_minor_version = Buffer.alloc(1);
    os_minor_version.writeUInt8(2, 0);
    packet_data = Buffer.concat([packet_data, os_minor_version]);

    let os_micro_version = Buffer.alloc(1);
    os_micro_version.writeUInt8(0, 0);
    packet_data = Buffer.concat([packet_data, os_micro_version]);

    packet_data = Buffer.concat([packet_data, Buffer.from('wac', 'utf-8'), Buffer.from('\0')]);
    packet_data = Buffer.concat([packet_data, Buffer.from('x86_64', 'utf-8'), Buffer.from('\0')]);

    let client_version_major = Buffer.alloc(1);
    client_version_major.writeUInt8(4, 0);
    packet_data = Buffer.concat([packet_data, client_version_major]);

    let client_version_minor = Buffer.alloc(1);
    client_version_minor.writeUInt8(10, 0);
    packet_data = Buffer.concat([packet_data, client_version_minor]);

    let client_version_micro = Buffer.alloc(1);
    client_version_micro.writeUInt8(8, 0);
    packet_data = Buffer.concat([packet_data, client_version_micro]);

    let client_version_hotfix = Buffer.alloc(1);
    client_version_hotfix.writeUInt8(0, 0);
    packet_data = Buffer.concat([packet_data, client_version_hotfix]);

    let last_known_client_state = Buffer.alloc(1);
    last_known_client_state.writeUInt8(0, 0);
    packet_data = Buffer.concat([packet_data, last_known_client_state]);

    let client_chat_mode_state = Buffer.alloc(1);
    client_chat_mode_state.writeUInt8(0, 0);
    packet_data = Buffer.concat([packet_data, client_chat_mode_state]);

    packet_data = Buffer.concat([packet_data, Buffer.from('en', 'utf-8'), Buffer.from('\0')]);
    packet_data = Buffer.concat([packet_data, Buffer.from('en', 'utf-8'), Buffer.from('\0')]);

    const packet_len = Buffer.alloc(2);
    packet_len.writeUInt16LE(packet_data.length, 0);
    packet_data = Buffer.concat([packet_len, packet_data]);

    return packet_data;
}

function createReplayRequestPacket(matchId) {
    const matchIdBuffer = Buffer.alloc(4);
    matchIdBuffer.writeInt32LE(matchId, 0);

    const packet_data = Buffer.concat([
        Buffer.from([0xbe, 0x00]), // Message type
        matchIdBuffer, // Match ID
        Buffer.from('honreplay', 'utf-8'), // String
        Buffer.from([0x00]) // Null byte
    ]);

    const packet_len = packet_data.length;
    const packet_len_buffer = Buffer.alloc(2);
    packet_len_buffer.writeUInt16LE(packet_len, 0);

    return Buffer.concat([packet_len_buffer, packet_data]);
}


module.exports = {
    createHandshakePacket,
    createReplayRequestPacket,
    parseReplayStatus
};