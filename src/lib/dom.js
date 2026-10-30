import {
  createIcons, ArrowUpRight, ArrowRight, ArrowLeft, Plus, Minus, RotateCw, MoveUpRight, X, Check, Copy, Box,
  Grid2X2, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, VolumeX, ExternalLink, LoaderCircle, Radio, Search, Maximize,
} from 'lucide';

const icons = {
  ArrowUpRight, ArrowRight, ArrowLeft, Plus, Minus, RotateCw, MoveUpRight, X, Check, Copy, Box, Grid2X2,
  SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, VolumeX, ExternalLink, LoaderCircle, Radio, Search, Maximize,
};

// lucide normalises data-lucide names with toPascalCase ("ArrowUpRight" -> "Arrowupright"), so register that form too.
for (const k of Object.keys(icons)) icons[k[0].toUpperCase() + k.slice(1).toLowerCase()] ??= icons[k];

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);

export const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
export const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.6 } });

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

let toastTimer;
export function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4200);
}

export function modal(content) {
  $('#dialog-content').innerHTML = content;
  const dialog = $('#dialog');
  if (!dialog.open) dialog.showModal();
  refreshIcons();
}

export const closeModal = () => $('#dialog').close();
