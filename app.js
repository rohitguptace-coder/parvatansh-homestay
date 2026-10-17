const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const checkin = $('#checkin');
const checkout = $('#checkout');
const bookingNote = $('#bookingNote');
const modal = $('#bookingModal');
const toast = $('#toast');
let activeRoom = { name: 'Wood-Finish Room', price: 2499 };
let dates = null;
let toastTimer;

const today = new Date();
const toISO = date => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
checkin.min = toISO(today);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
checkout.min = toISO(tomorrow);
checkin.addEventListener('change', () => {
  if (!checkin.value) return;
  const nextDay = new Date(`${checkin.value}T12:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  checkout.min = toISO(nextDay);
  if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function openBooking(room = activeRoom) {
  activeRoom = room;
  $('#modalRoom').textContent = `${room.name} · ${$('#guests').value} guests`;
  const nights = dates?.nights || 1;
  $('#summaryDates').textContent = dates ? `${formatDate(dates.start)} — ${formatDate(dates.end)} · ${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Choose your dates';
  $('#summaryPrice').textContent = dates ? `₹${(room.price * nights).toLocaleString('en-IN')} total` : `From ₹${room.price.toLocaleString('en-IN')} / night`;
  $('#paymentPanel').hidden = true;
  $('#payButton').hidden = false;
  $('#confirmButton').disabled = false;
  $('#confirmButton').innerHTML = 'Confirm booking <span>↗</span>';
  $('#confirmNote').textContent = 'No payment will be taken in this demo.';
  $('#confirmNote').classList.remove('confirmation-note');
  $('.payment-panel .modal-input').firstChild.textContent = 'UPI ID';
  $('.payment-panel .modal-input input').placeholder = 'name@bank';
  $$('.payment-option').forEach((option, index) => option.classList.toggle('active', index === 0));
  $('.secure-note').hidden = false;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => $('#guestName').focus(), 250);
}

function closeBooking() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

$('#bookingForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkin.value || !checkout.value) {
    bookingNote.textContent = 'Choose your check-in and check-out dates to see available stays.';
    bookingNote.classList.add('note-alert');
    (checkin.value ? checkout : checkin).focus();
    return;
  }
  const start = new Date(`${checkin.value}T12:00:00`);
  const end = new Date(`${checkout.value}T12:00:00`);
  const nights = Math.round((end - start) / 86400000);
  if (nights < 1) {
    bookingNote.textContent = 'Check-out must be at least one night after check-in.';
    bookingNote.classList.add('note-alert');
    return;
  }
  dates = { start: checkin.value, end: checkout.value, nights };
  bookingNote.classList.remove('note-alert');
  const estimatedTotal = 2499 * nights;
  bookingNote.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'} selected · ${$('#guests').value} guests · The host will confirm availability.`;
  $('#priceTotal').hidden = false;
  $('#priceTotal').textContent = `Sample estimate for ${nights} ${nights === 1 ? 'night' : 'nights'}: ₹${estimatedTotal.toLocaleString('en-IN')} · Host confirms final rate`;
  $('#rooms').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Dates selected — choose a room to continue.');
});

$$('[data-select]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.room-card');
  $$('.room-card').forEach(item => item.classList.remove('selected'));
  card.classList.add('selected');
  activeRoom = { name: card.dataset.room, price: Number(card.dataset.price) };
  if (!dates) {
    showToast('Choose your dates first to continue with this room.');
    $('#booking').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => checkin.focus(), 400);
    return;
  }
  openBooking(activeRoom);
}));

$('#modalClose').addEventListener('click', closeBooking);
modal.addEventListener('click', event => { if (event.target === modal) closeBooking(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeBooking(); });

$('#payButton').addEventListener('click', () => {
  const name = $('#guestName');
  const email = $('#guestEmail');
  if (!name.value.trim()) { name.focus(); name.reportValidity(); return; }
  if (!email.value.trim() || !email.checkValidity()) { email.focus(); email.reportValidity(); return; }
  $('#paymentPanel').hidden = false;
  $('#payButton').hidden = true;
  $('.secure-note').hidden = true;
  $('#paymentPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

$$('.payment-option').forEach(option => option.addEventListener('click', () => {
  $$('.payment-option').forEach(item => item.classList.remove('active'));
  option.classList.add('active');
  const input = $('.payment-panel .modal-input');
  input.firstChild.textContent = option.textContent === 'Card' ? 'Card number' : option.textContent === 'Net banking' ? 'Bank name' : 'UPI ID';
  input.querySelector('input').placeholder = option.textContent === 'Card' ? '0000 0000 0000 0000' : option.textContent === 'Net banking' ? 'Choose your bank' : 'name@bank';
});

$('#confirmButton').addEventListener('click', () => {
  const bookingCode = `PAR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  $('#confirmNote').textContent = `Request ${bookingCode} saved in this demo. No payment was taken.`;
  $('#confirmNote').classList.add('confirmation-note');
  $('#confirmButton').textContent = 'Request received ✓';
  $('#confirmButton').disabled = true;
});

$('#saveBtn').addEventListener('click', event => {
  const button = event.currentTarget;
  button.classList.toggle('active');
  showToast(button.classList.contains('active') ? 'Parvatansh saved to your stays.' : 'Removed from your saved stays.');
});
$('#saveStay').addEventListener('click', event => {
  const button = event.currentTarget;
  const saved = button.classList.toggle('active');
  button.textContent = saved ? '♥  Saved' : '♡  Save';
  showToast(saved ? 'Parvatansh saved to your stays.' : 'Removed from your saved stays.');
});
$('#shareStay').addEventListener('click', async () => {
  const shareData = { title: 'Parvatansh Homestay', text: 'Take a look at Parvatansh Homestay.' };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (error) { if (error.name !== 'AbortError') showToast('Sharing is not available in this browser.'); }
  } else if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(window.location.href); showToast('Page link copied.'); } catch { showToast('Copy the page link from your browser to share it.'); }
  } else showToast('Copy the page link from your browser to share it.');
});
$$('.room-heart').forEach(button => button.addEventListener('click', () => {
  button.classList.toggle('active');
  button.textContent = button.classList.contains('active') ? '♥' : '♡';
  showToast(button.classList.contains('active') ? `${button.closest('.room-card').dataset.room} saved.` : 'Room removed from saved stays.');
}));

$('#galleryBtn').addEventListener('click', () => showToast('Photo gallery preview · 6 property photos.'));
$('#roomNext').addEventListener('click', () => $('#roomGrid').scrollBy({ left: $('#roomGrid').clientWidth / 2, behavior: 'smooth' }));
$('#roomPrev').addEventListener('click', () => $('#roomGrid').scrollBy({ left: -$('#roomGrid').clientWidth / 2, behavior: 'smooth' }));
$$('.review-nav button').forEach(button => button.addEventListener('click', () => showToast('More guest stories coming soon.')));

$('.menu-btn').addEventListener('click', event => {
  const nav = $('.main-nav');
  nav.classList.toggle('nav-open');
  event.currentTarget.setAttribute('aria-expanded', nav.classList.contains('nav-open'));
});
$$('.main-nav a').forEach(link => link.addEventListener('click', () => $('.main-nav').classList.remove('nav-open')));
