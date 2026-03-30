import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  theme: {
    colors: {
      neon: {
        green: '#39ff14',
        blue: '#00f0ff',
        pink: '#ff00ff',
        amber: '#ffbf00',
        red: '#ff3b3b',
        purple: '#b388ff',
      },
      surface: {
        dark: '#0a0a0f',
        mid: '#12121a',
        light: '#1a1a28',
        border: '#2a2a3a',
      },
    },
    fontFamily: {
      mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
    },
  },
  shortcuts: {
    'panel': 'bg-surface-mid border border-surface-border rounded-lg',
    'panel-header': 'px-3 py-2 border-b border-surface-border font-mono text-sm text-neon-blue',
    'btn': 'px-3 py-1 rounded font-mono text-xs cursor-pointer transition-colors',
    'btn-primary': 'btn bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 border border-neon-blue/40',
    'btn-danger': 'btn bg-neon-red/20 text-neon-red hover:bg-neon-red/30 border border-neon-red/40',
    'toggle-on': 'bg-neon-green/30 border-neon-green/50',
    'toggle-off': 'bg-surface-dark border-surface-border',
  },
});
