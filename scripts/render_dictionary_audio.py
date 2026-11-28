"""Render the dictionary MP3s with Piper and FFmpeg from the published UK IPA."""

import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig


ROOT = Path(__file__).resolve().parents[1]
VOWELS = set('aeiouɑɐɒæəɛɜɪɔʊʌ')
IPA_TOKEN = re.compile(r'eɪ|aɪ|ɔɪ|aʊ|əʊ|ɪə|eə|ʊə|ɛə|.')


def phonemes(ipa, inventory):
    # Piper's eSpeak input places stress immediately before the vowel.
    text = ipa.replace('.', '').replace('ʳ', '')
    text = re.sub(r'([ˈˌ])([^aeiouɑɐɒæəɛɜɪɔʊʌ ]*)', r'\2\1', text)
    if not re.search(r'[ ˈˌ]', text):
        for index, letter in enumerate(text):
            if letter in VOWELS:
                text = text[:index] + 'ˈ' + text[index:]
                break

    result = []
    for token in IPA_TOKEN.findall(text):
        result.extend([token] if token in inventory else list(token))
    missing = {token for token in result if token not in inventory}
    if missing:
        raise ValueError(f'Unsupported phonemes {missing} in /{ipa}/')
    return result


def normalise(audio, rate):
    frame = max(1, rate // 100)
    padded = np.pad(audio, (0, -len(audio) % frame))
    levels = np.sqrt(np.mean(padded.reshape(-1, frame) ** 2, axis=1))
    active = np.flatnonzero(levels >= max(0.0003, levels.max() * 0.025))
    if not len(active):
        raise ValueError('Piper returned silent audio')

    # Keep quiet consonants and a small pause for instant mobile playback.
    start = max(0, (active[0] - 6) * frame)
    end = min(len(audio), (active[-1] + 9) * frame)
    samples = audio[start:end]
    rms = float(np.sqrt(np.mean(levels[active] ** 2)))
    gain = min(10 ** (-19 / 20) / rms, 10 ** (-2 / 20) / np.max(np.abs(samples)))
    return np.pad(samples * gain, (4 * frame, 4 * frame)).astype('<f4')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', type=Path, help='Path to en_GB-cori-medium.onnx')
    parser.add_argument('words', nargs='*', help='Optional headwords to render')
    args = parser.parse_args()
    voice = PiperVoice.load(args.model)
    config = SynthesisConfig(length_scale=1.03, noise_scale=0.55, noise_w_scale=0.65)
    rate = voice.config.sample_rate
    lexicon = json.loads((ROOT / 'shared/academy/lexicon.json').read_text(encoding='utf8'))
    entries = ((word, lexicon[word]) for word in args.words) if args.words else lexicon.items()
    count = 0
    for word, entry in entries:
        for form in entry['forms']:
            tokens = phonemes(form['ipa'], voice.config.phoneme_id_map)
            samples = voice.phoneme_ids_to_audio(voice.phonemes_to_ids(tokens), config)
            samples = normalise(samples, rate)
            output = ROOT / 'public/dictionary-audio' / form['file']
            subprocess.run([
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                '-f', 'f32le', '-ar', str(rate), '-ac', '1', '-i', 'pipe:0',
                '-codec:a', 'libmp3lame', '-b:a', '48k', str(output),
            ], input=samples.tobytes(), check=True)
            count += 1
            if args.words:
                print(f'{word}: /{form["ipa"]}/ {"".join(tokens)} {len(samples) / rate:.2f}s')
    print(f'Rendered {count} audio files.')


if __name__ == '__main__':
    main()
