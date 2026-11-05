import { describe, expect, it } from 'vitest';
import { encodeWav } from '../../scripts/lib/wav';
import { gongTone, tone, SAMPLE_RATE } from '../../scripts/lib/synth';
import { gongGlb, photoGongGlb } from '../../scripts/lib/glb';

describe('encodeWav', () => {
  it('ghi header RIFF/WAVE PCM 16-bit mono', () => {
    const buf = encodeWav(new Float32Array([0, 0.5, -0.5, 1]), 22050);
    expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
    expect(buf.toString('ascii', 8, 12)).toBe('WAVE');
    expect(buf.readUInt16LE(22)).toBe(1);
    expect(buf.readUInt32LE(24)).toBe(22050);
    expect(buf.readUInt32LE(40)).toBe(8);
    expect(buf.length).toBe(44 + 8);
    expect(buf.readInt16LE(44 + 6)).toBe(32767);
  });
});

describe('synth', () => {
  it('gongTone dài đúng số mẫu, không vượt biên độ 1', () => {
    const s = gongTone(220, 1);
    expect(s.length).toBe(SAMPLE_RATE);
    expect(s.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeLessThanOrEqual(1);
  });
  it('tone nối các nốt liên tiếp', () => {
    expect(tone([440, 660], 0.1).length).toBe(Math.floor(0.1 * SAMPLE_RATE) * 2);
  });
});

describe('gongGlb', () => {
  it('tạo file GLB 2.0 hợp lệ', () => {
    const glb = gongGlb();
    expect(glb.readUInt32LE(0)).toBe(0x46546c67);
    expect(glb.readUInt32LE(4)).toBe(2);
    expect(glb.readUInt32LE(8)).toBe(glb.length);
    const jsonLength = glb.readUInt32LE(12);
    expect(glb.readUInt32LE(16)).toBe(0x4e4f534a);
    const json = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength));
    expect(json.asset.version).toBe('2.0');
    expect(json.accessors).toHaveLength(3);
    expect(json.accessors[0].min).toHaveLength(3);
    expect(jsonLength % 4).toBe(0);
    const binOffset = 20 + jsonLength;
    const binLength = glb.readUInt32LE(binOffset);
    expect(glb.readUInt32LE(binOffset + 4)).toBe(0x004e4942);
    expect(binLength).toBe(json.buffers[0].byteLength);
    expect(binOffset + 8 + binLength).toBe(glb.length);
  });
});

describe('photoGongGlb', () => {
  it('dán ảnh lên mặt chiêng, vành không có ảnh', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9, 0x00]);
    const glb = photoGongGlb(jpeg, 'image/jpeg');
    expect(glb.readUInt32LE(8)).toBe(glb.length);
    const jsonLength = glb.readUInt32LE(12);
    const json = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength));
    const [faces, rim] = json.meshes[0].primitives;
    expect(faces.attributes.TEXCOORD_0).toBeTypeOf('number');
    expect(rim.attributes.TEXCOORD_0).toBeUndefined();
    expect(json.materials[0].pbrMetallicRoughness.baseColorTexture).toEqual({ index: 0 });
    expect(json.images).toEqual([{ bufferView: 0, mimeType: 'image/jpeg' }]);
    // Mọi đoạn trong bộ đệm đều bắt đầu ở bội số của 4.
    for (const v of json.bufferViews) expect(v.byteOffset % 4).toBe(0);
    const bin = 20 + jsonLength + 8;
    expect(glb.subarray(bin, bin + jpeg.length)).toEqual(jpeg);
  });
});
