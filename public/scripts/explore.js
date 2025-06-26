const container = document.getElementById('matches');

async function loadMatches() {
  const token = localStorage.getItem('token');
  const res = await axios.get('/user/matches', {
    headers: { Authorization: `Bearer ${token}` }
  });

  res.data.matches.forEach(user => {
    const div = document.createElement('div');
    div.className = 'user-card';
    div.innerHTML = `
      <h3>${user.name}</h3>
      <p><strong>Teaches:</strong> ${user.skillsToTeach.join(', ')}</p>
      <p><strong>Location:</strong> ${user.location}</p>
      <button onclick="sendRequest('${user._id}')">Send Request</button>
    `;
    container.appendChild(div);
  });
}

async function sendRequest(toUserId) {
  const token = localStorage.getItem('token');
  const message = prompt('Optional message:');
  try {
    await axios.post('/exchange/send', { toUser: toUserId, message }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showToast('Request sent!', true);
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to send request';
    showToast(msg, false);
  }
}

loadMatches();
