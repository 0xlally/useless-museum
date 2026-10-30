/** Hand-drawn card illustrations for the procedural concept pieces (decorative, not renders). */
const SHAPES = {
  shadow: '<circle cx="100" cy="58" r="31" fill="none" stroke="#a47b41" stroke-width="5"/><path d="M100 30v79M73 91h60" stroke="#b48e53" stroke-width="7"/><path d="M123 67v37" stroke="#756442" stroke-width="4"/>',
  yawn: '<rect x="76" y="34" width="48" height="70" rx="7" fill="#a4b8bc" opacity=".7"/><path d="M72 35h56M83 62h34M83 78h34" stroke="#b29560" stroke-width="7"/><circle cx="100" cy="23" r="6" fill="#a17a41"/>',
  coffee: '<path d="M76 43h48l-5 62H81z" fill="#e3d5bf" stroke="#93704b" stroke-width="3"/><path d="M73 58h54M75 75h50M78 92h44" stroke="#b08a4c" stroke-width="9"/><path d="M126 51q29 16-3 32" fill="none" stroke="#a17d4e" stroke-width="7"/>',
  dust: '<path d="M60 77h80v23H60z" fill="#c8bda5"/><path d="M65 67v32m12-32v32m12-32v32m12-32v32m12-32v32m12-32v32m12-32v32M64 83V43h74" fill="none" stroke="#ab8e52" stroke-width="4"/>',
  wait: '<path d="M100 65v42" stroke="#a98a4d" stroke-width="8"/><circle cx="100" cy="56" r="32" fill="#ece5d6" stroke="#a1824a" stroke-width="6"/><path d="M100 34v22l17 11" fill="none" stroke="#4f5146" stroke-width="3"/>',
  monday: '<path d="M62 86l15-17h46l15 17v16H62z" fill="#a68c59"/><ellipse cx="100" cy="72" rx="26" ry="12" fill="#ba5438"/><path d="M91 66v12m18-12v12" stroke="#e9d7be" stroke-width="4"/>',
};

export function thumbSvg(kind) {
  return `<svg viewBox="0 0 200 145" aria-hidden="true" focusable="false"><ellipse cx="100" cy="121" rx="53" ry="9" fill="#000" opacity=".05"/><path d="M49 110v14q51 24 102 0v-14" fill="#d8d3c6"/><ellipse cx="100" cy="110" rx="51" ry="12" fill="#e4dfd4"/>${SHAPES[kind] || SHAPES.shadow}</svg>`;
}
