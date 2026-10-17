/**
 * Keyframes and print rules for the store screen, scoped with an `ss-` prefix.
 * Motion is transform and opacity only; reduced-motion users get no looping animation.
 */
const CSS = `
.ss-root{touch-action:manipulation;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
.ss-root :focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.ss-scroll{scrollbar-width:thin;overscroll-behavior:contain}
.ss-hide-bar{scrollbar-width:none;-ms-overflow-style:none}
.ss-hide-bar::-webkit-scrollbar{display:none}
@keyframes ss-fade{from{opacity:0}to{opacity:1}}
@keyframes ss-rise{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
@keyframes ss-sheet{from{opacity:0;transform:translate3d(0,28px,0)}to{opacity:1;transform:none}}
@keyframes ss-drawer-r{from{transform:translate3d(100%,0,0)}to{transform:none}}
@keyframes ss-drawer-up{from{transform:translate3d(0,100%,0)}to{transform:none}}
@keyframes ss-kb{from{transform:scale(1) translate3d(0,0,0)}to{transform:scale(1.1) translate3d(-1.5%,-1%,0)}}
@keyframes ss-bump{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes ss-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.5);opacity:0}}
@keyframes ss-pop{0%{transform:scale(.9);opacity:0}100%{transform:none;opacity:1}}
.ss-fade{animation:ss-fade .3s ease both}
.ss-rise{animation:ss-rise .45s cubic-bezier(.2,.8,.2,1) both}
.ss-sheet{animation:ss-sheet .35s cubic-bezier(.2,.8,.2,1) both}
.ss-drawer{animation:ss-drawer-up .38s cubic-bezier(.2,.8,.2,1) both}
@media (min-width:768px){.ss-drawer{animation-name:ss-drawer-r}}
.ss-kb{animation:ss-kb 16s ease-out both;transform-origin:50% 50%;will-change:transform}
.ss-bump{animation:ss-bump .42s cubic-bezier(.2,.8,.2,1)}
.ss-ring{animation:ss-ring 2.4s ease-out infinite}
@keyframes ss-breathe{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.04,1.12);opacity:0}}
.ss-breathe{animation:ss-breathe 2.6s ease-in-out infinite}
.ss-pop{animation:ss-pop .25s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion: reduce){
  .ss-kb,.ss-ring,.ss-breathe,.ss-bump,.ss-rise,.ss-sheet,.ss-pop,.ss-drawer{animation:none!important}
}
@media print{
  html,body{background:var(--void)!important;height:auto!important;overflow:visible!important}
  .ss-root{height:auto!important;overflow:visible!important}
  .ss-root *{visibility:hidden}
  .ss-print,.ss-print *{visibility:visible;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ss-layer{position:absolute!important;inset:0 auto auto 0!important;width:100%!important;height:auto!important;overflow:visible!important}
  .ss-noprint{display:none!important}
}
`;

export function Styles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
