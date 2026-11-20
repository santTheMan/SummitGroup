/**
 * Header behaviour: a solid background once the page scrolls, and a
 * disclosure-pattern menu on small screens (button + aria-expanded, Escape
 * and outside click close it, focus returns to the button).
 */
export function mountHeader(header: HTMLElement): void {
  const button = header.querySelector<HTMLButtonElement>('[data-menu-button]');
  const nav = header.querySelector<HTMLElement>('[data-nav]');
  const wide = window.matchMedia('(min-width: 64em)');

  const onScroll = () => {
    header.dataset.scrolled = String(window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (!button || !nav) return;
  button.hidden = false;

  const isOpen = () => header.dataset.menuOpen === 'true';
  const setOpen = (open: boolean) => {
    header.dataset.menuOpen = String(open);
    button.setAttribute('aria-expanded', String(open));
  };

  button.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  // Following a link closes the panel.
  nav.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && event.target instanceof Node && !header.contains(event.target)) setOpen(false);
  });

  wide.addEventListener('change', () => setOpen(false));
}
