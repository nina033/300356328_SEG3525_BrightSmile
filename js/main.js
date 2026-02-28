document.addEventListener('DOMContentLoaded', () => {
  initNav();
  if (document.querySelector('.booking-page')) {
    initBooking();
  }
  if (document.getElementById('contactForm')) {
    initContactForm();
  }
});

// ===== MOBILE NAVIGATION =====
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
}

// ===== BOOKING FORM =====
function initBooking() {
  const state = {
    currentStep: 1,
    service: null,
    serviceName: '',
    price: '',
    date: null,
    time: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  };

  // Check if a service was pre-selected via URL
  const params = new URLSearchParams(window.location.search);
  const preselected = params.get('service');

  // --- Elements ---
  const steps = document.querySelectorAll('.booking-step');
  const stepIndicators = document.querySelectorAll('.step[data-step]');
  const stepLines = document.querySelectorAll('.step-line');

  const serviceCards = document.querySelectorAll('.booking-service-card');
  const toStep2Btn = document.getElementById('toStep2');
  const toStep3Btn = document.getElementById('toStep3');
  const toStep4Btn = document.getElementById('toStep4');
  const backToStep1Btn = document.getElementById('backToStep1');
  const backToStep2Btn = document.getElementById('backToStep2');
  const backToStep3Btn = document.getElementById('backToStep3');
  const confirmBtn = document.getElementById('confirmBooking');

  const timeSlots = document.querySelectorAll('.time-slot');

  // --- Service Selection ---
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      serviceCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.service = card.dataset.service;
      state.serviceName = card.querySelector('h3').textContent;
      state.price = card.querySelector('.price').textContent;
      toStep2Btn.disabled = false;
    });

    // Pre-select from URL
    if (preselected && card.dataset.service === preselected) {
      card.click();
    }
  });

  // --- Calendar ---
  let calendarDate = new Date();
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarMonthEl = document.getElementById('calendarMonth');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  function renderCalendar() {
    // Remove old day cells
    calendarGrid.querySelectorAll('.day').forEach(d => d.remove());

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonthEl.textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'day empty';
      calendarGrid.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'day';
      dayEl.textContent = d;

      const dateObj = new Date(year, month, d);
      dateObj.setHours(0, 0, 0, 0);

      // Disable past dates and Sundays
      if (dateObj < today || dateObj.getDay() === 0) {
        dayEl.classList.add('disabled');
      } else {
        dayEl.addEventListener('click', () => {
          calendarGrid.querySelectorAll('.day').forEach(el => el.classList.remove('selected'));
          dayEl.classList.add('selected');
          state.date = dateObj;
          checkStep2Complete();
          // Randomize some unavailable time slots
          randomizeTimeSlots();
        });
      }

      // Highlight today
      if (dateObj.getTime() === today.getTime()) {
        dayEl.classList.add('today');
      }

      // Re-select if already selected
      if (state.date && dateObj.getTime() === state.date.getTime()) {
        dayEl.classList.add('selected');
      }

      calendarGrid.appendChild(dayEl);
    }
  }

  function randomizeTimeSlots() {
    timeSlots.forEach(slot => {
      slot.classList.remove('unavailable', 'selected');
      // Randomly make ~20% unavailable
      if (Math.random() < 0.2) {
        slot.classList.add('unavailable');
      }
    });
    state.time = null;
    toStep3Btn.disabled = true;
  }

  prevMonthBtn.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();

  // --- Time Slots ---
  timeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      if (slot.classList.contains('unavailable')) return;
      timeSlots.forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      state.time = slot.dataset.time;
      state.timeLabel = slot.textContent;
      checkStep2Complete();
    });
  });

  function checkStep2Complete() {
    const complete = state.date && state.time;
    toStep3Btn.disabled = !complete;
    updateDatetimeMsg();
  }

  function updateDatetimeMsg() {
    const msgEl = document.getElementById('datetimeMsg');
    const msgText = document.getElementById('datetimeMsgText');
    if (!msgEl) return;

    if (state.date && state.time) {
      msgEl.classList.remove('visible', 'caution');
      msgEl.classList.add('success');
      msgEl.classList.add('visible');
      msgEl.querySelector('.validation-icon').textContent = '✅';
      msgText.textContent = 'Date and time selected, you\'re all set!';
    } else if (state.date && !state.time) {
      msgEl.classList.add('visible', 'caution');
      msgEl.classList.remove('success');
      msgEl.querySelector('.validation-icon').textContent = '⚠️';
      msgText.textContent = 'Please select a time slot to continue';
    } else if (!state.date && state.time) {
      msgEl.classList.add('visible', 'caution');
      msgEl.classList.remove('success');
      msgEl.querySelector('.validation-icon').textContent = '⚠️';
      msgText.textContent = 'Please select a date to continue';
    } else {
      msgEl.classList.add('visible', 'caution');
      msgEl.classList.remove('success');
      msgEl.querySelector('.validation-icon').textContent = '⚠️';
      msgText.textContent = 'Please select both a date and a time to continue';
    }
  }

  // --- Navigation ---
  function goToStep(n) {
    state.currentStep = n;

    // Show correct step
    steps.forEach(s => s.classList.remove('active'));
    const targetStep = n <= 4 ? document.getElementById(`step${n}`) : document.getElementById('stepSuccess');
    if (targetStep) targetStep.classList.add('active');

    if (n === 2) {
      updateDatetimeMsg();
    }

    // Update indicators
    stepIndicators.forEach(ind => {
      const stepNum = parseInt(ind.dataset.step);
      ind.classList.remove('active', 'completed');
      if (stepNum === n) ind.classList.add('active');
      else if (stepNum < n) ind.classList.add('completed');
    });

    // Update lines
    stepLines.forEach(line => {
      const lineNum = parseInt(line.dataset.line);
      line.classList.toggle('completed', lineNum < n);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toStep2Btn.addEventListener('click', () => goToStep(2));
  backToStep1Btn.addEventListener('click', () => goToStep(1));
  backToStep2Btn.addEventListener('click', () => goToStep(2));
  backToStep3Btn.addEventListener('click', () => goToStep(3));

  // Step 3 → 4: validate details
  toStep3Btn.addEventListener('click', () => goToStep(3));

  toStep4Btn.addEventListener('click', () => {
    if (validateDetails()) {
      populateSummary();
      goToStep(4);
    }
  });

  // --- Form Validation ---
  function validateDetails() {
    let valid = true;
    const fields = [
      { id: 'firstName', key: 'firstName', validator: v => v.trim().length > 0 },
      { id: 'lastName', key: 'lastName', validator: v => v.trim().length > 0 },
      { id: 'email', key: 'email', validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
      { id: 'phone', key: 'phone', validator: v => v.replace(/\D/g, '').length >= 7 }
    ];

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const group = input.closest('.form-group');
      const value = input.value;
      state[f.key] = value;

      if (!f.validator(value)) {
        group.classList.add('error');
        valid = false;
      } else {
        group.classList.remove('error');
      }
    });

    state.notes = document.getElementById('notes').value;
    return valid;
  }

  // Clear error on input
  document.querySelectorAll('.details-form input').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group').classList.remove('error');
    });
  });

  // --- Summary ---
  function populateSummary() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('summaryService').textContent = state.serviceName;
    document.getElementById('summaryDate').textContent = state.date
      ? `${months[state.date.getMonth()]} ${state.date.getDate()}, ${state.date.getFullYear()}`
      : '—';
    document.getElementById('summaryTime').textContent = state.timeLabel || '—';
    document.getElementById('summaryName').textContent = `${state.firstName} ${state.lastName}`;
    document.getElementById('summaryEmail').textContent = state.email;
    document.getElementById('summaryPhone').textContent = state.phone;
    document.getElementById('summaryNotes').textContent = state.notes;
    document.getElementById('summaryCost').textContent = state.price;
  }

  // --- Confirm ---
  confirmBtn.addEventListener('click', () => {
    document.getElementById('confirmEmail').textContent = state.email;
    document.querySelector('.step-indicator').style.display = 'none';
    goToStep(5);
  });
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById('contactForm');
  const successEl = document.getElementById('contactSuccess');
  const sendAnotherBtn = document.getElementById('sendAnother');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Validate required fields
    const fields = [
      { id: 'contactFirstName', validator: v => v.trim().length > 0 },
      { id: 'contactLastName', validator: v => v.trim().length > 0 },
      { id: 'contactEmail', validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
      { id: 'contactSubject', validator: v => v.length > 0 },
      { id: 'contactMessage', validator: v => v.trim().length > 0 }
    ];

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const group = input.closest('.form-group');
      if (!f.validator(input.value)) {
        group.classList.add('error');
        valid = false;
      } else {
        group.classList.remove('error');
      }
    });

    if (valid) {
      form.style.display = 'none';
      successEl.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Clear errors on input
  form.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group').classList.remove('error');
    });
    input.addEventListener('change', () => {
      input.closest('.form-group').classList.remove('error');
    });
  });

  // Send another message
  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = 'block';
      successEl.style.display = 'none';
    });
  }
}
