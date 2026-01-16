
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. Setup Data
  await page.goto('http://localhost:8081');
  
  const testNotes = [
    {
      id: 1705363200000,
      title: "Test Note for Red Dot",
      blocks: [{type: 'text', content: '<p>Content</p>'}],
      review: {
        modeId: "ebbinghaus",
        nextReviewDate: "2026-01-17", // Tomorrow relative to 2026-01-16
        currentIntervalIndex: 0,
        lastReviewDate: "2026-01-16"
      }
    }
  ];

  await page.evaluate((notes) => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, testNotes);

  // 2. Reload to load data
  await page.reload();

  // 3. Navigate to Todo
  await page.waitForSelector('#todoBtn');
  await page.click('#todoBtn');
  
  // Wait for the view to load
  await page.waitForSelector('#todo-list-panel');
  
  // 4. Verify Calendar Collapse State (Default should be collapsed/hidden)
  const wrapperState = await page.evaluate(() => {
    const wrapper = document.getElementById('todo-calendar-wrapper');
    const style = window.getComputedStyle(wrapper);
    return {
      display: style.display,
      hasClass: wrapper.classList.contains('collapsed')
    };
  });

  console.log('Initial Calendar State:', wrapperState);

  if (wrapperState.display !== 'none') {
    console.error('FAIL: Calendar should be hidden by default.');
  } else {
    console.log('PASS: Calendar is hidden by default.');
  }

  // 5. Verify Toggle
  await page.click('.calendar-header');
  // Wait a bit for any potential transitions (though we removed them, JS execution takes a tick)
  await new Promise(r => setTimeout(r, 500));

  const wrapperStateAfter = await page.evaluate(() => {
    const wrapper = document.getElementById('todo-calendar-wrapper');
    const style = window.getComputedStyle(wrapper);
    return {
      display: style.display,
      hasClass: wrapper.classList.contains('collapsed')
    };
  });

  console.log('After Toggle Calendar State:', wrapperStateAfter);

  if (wrapperStateAfter.display === 'none') {
    console.error('FAIL: Calendar should be visible after toggle.');
  } else {
    console.log('PASS: Calendar is visible after toggle.');
  }

  // 6. Verify Red Dot
  // We need to wait for flatpickr to render. It usually renders immediately.
  // Check if any .event-dot exists
  const dotsCount = await page.evaluate(() => {
    return document.querySelectorAll('.event-dot').length;
  });

  console.log('Red Dots Found:', dotsCount);

  if (dotsCount === 0) {
    console.error('FAIL: No red dots found.');
    // Debug: check if flatpickr days are rendered
    const daysCount = await page.evaluate(() => document.querySelectorAll('.flatpickr-day').length);
    console.log('Total calendar days rendered:', daysCount);
  } else {
    console.log('PASS: Red dots are visible.');
  }

  // 7. Verify Button Icons
  // Select a task to show the preview
  await page.click('.todo-item');
  await page.waitForSelector('.review-actions', { visible: true });

  const iconCheck = await page.evaluate(() => {
    const btn = document.querySelector('.btn-forget');
    const icon = btn.querySelector('i');
    const style = window.getComputedStyle(icon);
    return {
      hasIcon: !!icon,
      fontFamily: style.fontFamily,
      classList: icon.className
    };
  });

  console.log('Button Icon Check:', iconCheck);

  if (!iconCheck.hasIcon) {
    console.error('FAIL: Button icon missing.');
  } else {
    console.log('PASS: Button icon present.');
  }

  await browser.close();
})();
