"""Render the dictionary MP3s with Piper and FFmpeg from the published UK IPA."""

import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig
from piper.phoneme_ids import BOS, PAD


ROOT = Path(__file__).resolve().parents[1]
VOWELS = set('aeiouɑɐɒæəɛɜɪɔʊʌ')
IPA_TOKEN = re.compile(r'eɪ|aɪ|ɔɪ|aʊ|əʊ|ɪə|eə|ʊə|ɛə|.')
REVIEWED_TAKES = {
    'aunt': (1.15, ''),
    'buy a present': (1.08, '.'),
    'drama': (1.15, ''),
    'eat': (1.08, '.'),
    'eighty': (1.10, '.'),
    'go sailing': (1.08, '.'),
    'grandma': (1.08, '.'),
    'lawyer': (1.15, ''),
    'lock': (1.08, '.'),
    'snow': (1.27, '.'),
    'Thursday': (1.08, '.'),
    'throw': (1.08, '.'),
}
SOUTHERN_TAKES = {'bus stop', 'do up your coat', 'thirsty'}


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

    # A level gate is useful for measuring speech but can cut quiet consonants.
    rms = float(np.sqrt(np.mean(levels[active] ** 2)))
    gain = min(10 ** (-19 / 20) / rms, 10 ** (-2 / 20) / np.max(np.abs(audio)))
    return np.pad(audio * gain, (4 * frame, 6 * frame)).astype('<f4')


def emphasise_consonants(audio, tokens, sample_counts, inventory, rate):
    """Raise the soft frication of /θ/ and the release of edge /t/."""
    edges = np.cumsum([0, *sample_counts])
    if edges[-1] != len(audio):
        raise ValueError('Piper phoneme timing does not cover the generated audio')

    pad_size = len(inventory[PAD])
    index = len(inventory[BOS]) + pad_size
    for position, token in enumerate(tokens):
        end = index + len(inventory[token]) + pad_size
        previous = tokens[position - 1] if position else ' '
        following = tokens[position + 1] if position + 1 < len(tokens) else '.'
        edge_t = token == 't' and (following in (' ', '.') or
                                   (previous == ' ' and following != 'ʃ'))
        if token == 'θ' or edge_t:
            span = audio[edges[index]:edges[end]]
            if len(span) < rate // 100:
                raise ValueError(f'Consonant /{token}/ has no usable aligned audio')
            # Smooth both ends so the gain change introduces no click.
            fade = min(rate // 200, len(span) // 2)
            ramp = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
            envelope = np.ones(len(span))
            envelope[:fade] = ramp
            envelope[-fade:] = ramp[::-1]
            boost = 10 ** ((6 if token == 'θ' else 3) / 20) - 1
            span *= 1 + boost * envelope

        index = end


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', type=Path, help='Path to en_GB-cori-medium.onnx')
    parser.add_argument('words', nargs='*', help='Optional headwords to render')
    args = parser.parse_args()
    cori = PiperVoice.load(args.model, include_alignments=True)
    southern = None
    standard = SynthesisConfig(length_scale=1.14, noise_scale=0.28, noise_w_scale=0.22)
    lexicon = json.loads((ROOT / 'shared/academy/lexicon.json').read_text(encoding='utf8'))
    entries = ((word, lexicon[word]) for word in args.words) if args.words else lexicon.items()
    count = 0
    for word, entry in entries:
        voice = cori
        if word in SOUTHERN_TAKES:
            if southern is None:
                model = args.model.with_name('en_GB-southern_english_female-low.onnx')
                southern = PiperVoice.load(model, include_alignments=True)
            voice = southern
        length, punctuation = (
            (1.17, '.') if word in SOUTHERN_TAKES else REVIEWED_TAKES.get(word, (None, '.'))
        )
        config = standard if length is None else SynthesisConfig(
            length_scale=length, noise_scale=0, noise_w_scale=0,
        )
        rate = voice.config.sample_rate
        inventory = voice.config.phoneme_id_map
        for form in entry['forms']:
            tokens = phonemes(form['ipa'], inventory) + list(punctuation)
            ids = voice.phonemes_to_ids(tokens)
            samples, timing = voice.phoneme_ids_to_audio(ids, config, include_alignments=True)
            if timing is None or len(timing) != len(ids):
                raise ValueError('Install piper-tts[alignment] to verify phoneme timing')
            emphasise_consonants(samples, tokens, timing, inventory, rate)
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
