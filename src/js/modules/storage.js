const KEY = 'flowline';

export function save(name, value) {
  try {
    localStorage.setItem(`${KEY}:${name}`, JSON.stringify(value));
  } catch (e) {
  }
}

export function load(name, fallback = null) {
  try {
    const raw = localStorage.getItem(`${KEY}:${name}`);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}