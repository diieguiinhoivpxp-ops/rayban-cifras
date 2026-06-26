const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' };

const sampleSongs = [];

let songs = JSON.parse(localStorage.getItem('raybanCifrasSongs') || 'null') || sampleSongs;
let current = 0;
let transpose = 0;
let fontSize = 22;
let autoScroll = null;
let editingIndex = null;

const el = id => document.getElementById(id);
const songsEl = el('songs');
const songView = el('songView');

function saveState() {
  localStorage.setItem('raybanCifrasSongs', JSON.stringify(songs));
}

function normalizeRoot(root) {
  return FLAT_TO_SHARP[root] || root;
}

function transposeChord(chord, steps) {
  return chord.replace(/^([A-G](?:#|b)?)(.*)$/i, (_, root, rest) => {
    const normalized = normalizeRoot(root[0].toUpperCase() + root.slice(1));
    const idx = NOTES_SHARP.indexOf(normalized);
    if (idx === -1) return chord;
    return NOTES_SHARP[(idx + steps + 120) % 12] + rest;
  });
}

function renderLyrics(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\[([^\]]+)\]/g, (_, chord) => `<span class="chord">${transposeChord(chord, transpose)}</span>`);
}

function renderSongs() {
  const q = el('searchInput').value.toLowerCase();
  songsEl.innerHTML = '';
  songs.forEach((song, index) => {
    if (!`${song.title} ${song.artist}`.toLowerCase().includes(q)) return;
    const button = document.createElement('button');
    button.className = `songCard ${index === current ? 'active' : ''}`;
    button.innerHTML = `${song.setlist ? '⭐ ' : ''}${song.title}<small>${song.artist} • Tom ${song.key || '-'}</small>`;
    button.addEventListener('click', () => {
      current = index;
      transpose = 0;
      render();
    });
    button.addEventListener('dblclick', () => {
      song.setlist = !song.setlist;
      saveState();
      render();
    });
    songsEl.appendChild(button);
  });
}

function renderSetlist() {
  const view = el('setlistView');
  const selected = songs.filter(s => s.setlist);
  view.innerHTML = selected.length ? selected.map((s, i) => `<div class="setItem">${i + 1}. <strong>${s.title}</strong><br><small>${s.artist}</small></div>`).join('') : '<p>Nenhuma música marcada.</p>';
}

function render() {
  const song = songs[current];
  el('currentSongMeta').textContent = `${song.title} — ${song.artist} • Tom ${song.key || '-'} • Transposição ${transpose}`;
  el('transposeValue').textContent = transpose > 0 ? `+${transpose}` : String(transpose);
  songView.style.fontSize = `${fontSize}px`;
  songView.innerHTML = renderLyrics(song.lyrics);
  renderSongs();
  renderSetlist();
}

function openDialog(index = null) {
  editingIndex = index;
  const song = index === null ? { title:'', artist:'', key:'', lyrics:'' } : songs[index];
  el('songTitle').value = song.title;
  el('songArtist').value = song.artist;
  el('songKey').value = song.key;
  el('songLyrics').value = song.lyrics;
  el('songDialog').showModal();
}

function toggleAutoScroll() {
  if (autoScroll) {
    clearInterval(autoScroll);
    autoScroll = null;
    el('scrollToggle').textContent = 'Auto';
    return;
  }
  el('scrollToggle').textContent = 'Parar';
  autoScroll = setInterval(() => {
    const speed = Number(el('speedRange').value);
    songView.scrollTop += speed / 2;
  }, 100);
}

el('searchInput').addEventListener('input', renderSongs);
el('addSongBtn').addEventListener('click', () => openDialog());
el('setlistBtn').addEventListener('click', () => el('setlistDialog').showModal());
el('stageToggle').addEventListener('click', () => document.body.classList.toggle('stage'));
el('transposeDown').addEventListener('click', () => { transpose--; render(); });
el('transposeUp').addEventListener('click', () => { transpose++; render(); });
el('fontDown').addEventListener('click', () => { fontSize = Math.max(16, fontSize - 2); render(); });
el('fontUp').addEventListener('click', () => { fontSize = Math.min(48, fontSize + 2); render(); });
el('scrollToggle').addEventListener('click', toggleAutoScroll);
el('prevSong').addEventListener('click', () => { current = (current - 1 + songs.length) % songs.length; transpose = 0; render(); });
el('nextSong').addEventListener('click', () => { current = (current + 1) % songs.length; transpose = 0; render(); });
el('saveSong').addEventListener('click', event => {
  event.preventDefault();
  const song = {
    title: el('songTitle').value.trim() || 'Sem título',
    artist: el('songArtist').value.trim() || 'Desconhecido',
    key: el('songKey').value.trim(),
    lyrics: el('songLyrics').value.trim() || '[C]Cole sua cifra aqui',
    setlist: false
  };
  if (editingIndex === null) {
    songs.push(song);
    current = songs.length - 1;
  } else {
    songs[editingIndex] = { ...songs[editingIndex], ...song };
  }
  saveState();
  el('songDialog').close();
  render();
});

songView.addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); toggleAutoScroll(); }
  if (e.key === 'ArrowRight') el('nextSong').click();
  if (e.key === 'ArrowLeft') el('prevSong').click();
  if (e.key === '+') el('transposeUp').click();
  if (e.key === '-') el('transposeDown').click();
});

render();
