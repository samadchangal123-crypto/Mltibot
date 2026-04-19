document.getElementById('agreeCheckbox').addEventListener('change', function() {
  document.getElementById('submitButton').disabled = !this.checked;
});

let Commands = [{
  'commands': []
}, {
  'handleEvent': []
}];

function showAds() {
  var ads = [];
  if (ads.length === 0) return;
  var index = Math.floor(Math.random() * ads.length);
  window.location.href = ads[index];
}

function measurePing() {
  var xhr = new XMLHttpRequest();
  var startTime, endTime;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      endTime = Date.now();
      var pingTime = endTime - startTime;
      document.getElementById("ping").textContent = pingTime + " ms";
    }
  };
  xhr.open("GET", location.href + "?t=" + new Date().getTime());
  startTime = Date.now();
  xhr.send();
}
setInterval(measurePing, 1000);

function updateTime() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Manila',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  const formattedTime = now.toLocaleString('en-US', options);
  document.getElementById('time').textContent = formattedTime;
}
updateTime();
setInterval(updateTime, 1000);

function showToast(message, isSuccess) {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(-80px);
    background: ${isSuccess ? 'linear-gradient(135deg, #1a1a2e, #16213e)' : 'linear-gradient(135deg, #2a0a0a, #1a0000)'};
    border: 2px solid ${isSuccess ? '#00e5ff' : '#ff4444'};
    color: ${isSuccess ? '#00e5ff' : '#ff6b6b'};
    padding: 18px 30px;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    z-index: 99999;
    box-shadow: 0 0 30px ${isSuccess ? 'rgba(0,229,255,0.4)' : 'rgba(255,68,68,0.4)'};
    text-align: center;
    max-width: 90vw;
    min-width: 280px;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
    opacity: 0;
  `;

  const icon = isSuccess ? '✅' : '❌';
  const label = isSuccess ? 'BOT CREATED SUCCESSFULLY!' : 'ERROR';
  toast.innerHTML = `
    <div style="font-size:22px; margin-bottom:6px;">${icon}</div>
    <div style="letter-spacing:1px; margin-bottom:4px;">${label}</div>
    <div style="font-size:13px; color: ${isSuccess ? '#b0f0ff' : '#ffaaaa'}; font-weight:400;">${message}</div>
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(-80px)';
    toast.style.opacity = '0';
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
  }, 5000);
}

async function State() {
  const jsonInput = document.getElementById('json-data');
  const button = document.getElementById('submitButton');

  if (!Commands[0].commands.length) {
    return showResult('Please provide at least one valid command for execution.');
  }

  try {
    button.style.display = 'none';
    const State = JSON.parse(jsonInput.value);

    if (State && typeof State === 'object') {
      showToast('Creating your bot, please wait...', true);

      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: State,
          commands: Commands,
          prefix: document.getElementById('inputOfPrefix').value,
          admin: document.getElementById('inputOfAdmin').value,
        }),
      });

      const data = await response.json();
      jsonInput.value = '';

      if (data.success) {
        showToast(data.message || 'Bot has been created and is now online!', true);
        showResult('✅ ' + (data.message || 'Bot created successfully!'));
      } else {
        showToast(data.message || 'Something went wrong. Please try again.', false);
        showResult('❌ ' + (data.message || 'Failed to create bot.'));
      }

    } else {
      jsonInput.value = '';
      showToast('Invalid JSON data. Please check your input.', false);
      showResult('Invalid JSON data. Please check your input.');
    }
  } catch (parseError) {
    jsonInput.value = '';
    console.error('Error parsing JSON:', parseError);
    showToast('Error parsing JSON. Please check your appstate.', false);
    showResult('Error parsing JSON. Please check your input.');
  } finally {
    setTimeout(() => {
      button.style.display = 'block';
    }, 4000);
  }
}

function showResult(message) {
  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = `<h5>${message}</h5>`;
  resultContainer.style.display = 'block';
}

async function commandList() {
  try {
    const response = await fetch('/commands');
    const { commands, handleEvent } = await response.json();
    commands.forEach(cmd => {
      if (cmd && !Commands[0].commands.includes(cmd)) Commands[0].commands.push(cmd);
    });
    handleEvent.forEach(evt => {
      if (evt && !Commands[1].handleEvent.includes(evt)) Commands[1].handleEvent.push(evt);
    });
  } catch (error) {
    console.log(error);
  }
}

commandList();
