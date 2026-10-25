const answer = document.querySelector('#oracle-answer');
const ask = document.querySelector('#ask-oracle');
const counter = document.querySelector('#oracle-counter');
const eraLabel = document.querySelector('#oracle-era-label');
const artifact = document.querySelector('.oracle-artifact');
// Original historical responses, rendered as text. The old shortened outbound
// link is intentionally not recreated as a live link.
const noAnswers = ['Nope', 'Nei, ikke akkurat nå…', 'Kanskje vente til pandemien er over?', 'NEI!', 'Nah', 'Helst ikke', 'Les mer her!'];
let era = 'march';
let index = 0;

function showAnswer() {
  const text = era === 'october' ? 'Ja!' : noAnswers[index];
  answer.textContent = text;
  answer.classList.toggle('long-answer', text.length > 16);
  counter.textContent = era === 'october' ? '01 / 01' : `${String(index + 1).padStart(2, '0')} / 07`;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && answer.animate) {
    answer.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: 'ease-out' });
  }
}

ask.addEventListener('click', () => {
  // Visit every answer before repeating. The original used random selection;
  // this small museum recreation makes all seven discoverable.
  index = (index + 1) % noAnswers.length;
  showAnswer();
});

document.querySelectorAll('input[name="era"]').forEach((input) => {
  input.addEventListener('change', () => {
    era = input.value;
    index = 0;
    artifact.classList.toggle('oracle-yes', era === 'october');
    eraLabel.textContent = era === 'october' ? 'OCTOBER VERSION' : 'MARCH VERSION';
    showAnswer();
  });
});

function revealHash() {
  const id = location.hash.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  if (target.matches('.exhibit')) target.querySelector('details').open = true;
  if (target.matches('.field-note')) target.querySelector('details').open = true;
  // A deep link can also point at the commit artifact inside a closed story.
  let disclosure = target.closest('details');
  while (disclosure) {
    disclosure.open = true;
    disclosure = disclosure.parentElement.closest('details');
  }
}

document.querySelectorAll('[data-connection]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    target.querySelector('details').open = true;
    // Native anchor scrolling handles movement. Focus also carries the reader
    // to the destination when they follow a connection with the keyboard.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});
window.addEventListener('hashchange', revealHash);
revealHash();

// Inspect the response array between the two public October commits. This is
// local, deterministic inspection, not a request to the historical service.
const gap = document.querySelector('.gap-controls');
if (gap) {
  gap.hidden = false;
  const slots = [...gap.querySelectorAll('[data-index]')];
  const result = gap.querySelector('.gap-result');
  const fix = gap.querySelector('.gap-fix');
  let selected = 0;
  let fixed = false;
  function inspect() {
    for (const slot of slots) {
      slot.setAttribute('aria-pressed', String(Number(slot.dataset.index) === selected));
      slot.disabled = fixed && Number(slot.dataset.index) !== 0;
    }
    result.textContent = fixed
      ? 'The fix always selects position 0. “Ja!” every time.'
      : selected === 0 ? 'Position 0 returns “Ja!”' : `Position ${selected} has no response to return.`;
    fix.setAttribute('aria-pressed', String(fixed));
    fix.classList.toggle('is-fixed', fixed);
    fix.firstChild.textContent = fixed ? 'Undo the fix ' : 'Try the next commit ';
  }
  for (const slot of slots) slot.addEventListener('click', () => {
    selected = Number(slot.dataset.index);
    inspect();
  });
  fix.addEventListener('click', () => {
    fixed = !fixed;
    if (fixed) selected = 0;
    inspect();
  });
}
