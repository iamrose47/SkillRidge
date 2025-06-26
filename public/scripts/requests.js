const token = localStorage.getItem('token');

async function loadRequests() {
  const res = await axios.get('/exchange/my-requests', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const incomingDiv = document.getElementById('incoming');
  const outgoingDiv = document.getElementById('outgoing');

  res.data.incoming.forEach(req => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p><strong>From:</strong> ${req.fromUser.name}</p>
      <p>${req.message || 'No message'}</p>
      <button onclick="respond('${req._id}', 'accepted')">Accept</button>
      <button onclick="respond('${req._id}', 'rejected')">Reject</button>
      <hr />
    `;
    incomingDiv.appendChild(div);
  });

  res.data.outgoing.forEach(req => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p><strong>To:</strong> ${req.toUser.name}</p>
      <p>Status: ${req.status}</p>
      <hr />
    `;
    outgoingDiv.appendChild(div);
  });
}

async function respond(requestId, status) {
  try {
    await axios.put(`/exchange/update/${requestId}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showToast(`Request ${status}`, true);
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    showToast('Failed to update request', false);
  }
}

loadRequests();
