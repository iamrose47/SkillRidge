let allPosts = [];
let currentUserId = null;
let acceptedFriends = [];


let currentGroupId = null;
let groupChatInterval;



function filterFeedBySkill() {
  const keyword = document.getElementById('feed-search').value.toLowerCase().trim();
  if (!keyword) {
    renderPosts(allPosts); // Show all if input is empty
    return;
  }

  const filtered = allPosts.filter(post =>
    post.skills.some(skill => skill.toLowerCase().includes(keyword)) ||
    post.content.toLowerCase().includes(keyword)
  );
  renderPosts(filtered);
}





function openGroupChat(groupId, groupName) {
  currentGroupId = groupId;
  document.getElementById('group-chat-title').textContent = `Chat: ${groupName}`;
  document.getElementById('group-chat-modal').classList.remove('hidden');
  loadGroupMessages();

  groupChatInterval = setInterval(loadGroupMessages, 2000);
}

function closeGroupChat() {
  document.getElementById('group-chat-modal').classList.add('hidden');
  if (groupChatInterval) clearInterval(groupChatInterval);
}

async function loadGroupMessages() {
  if (!currentGroupId) return;
  try {
    const res = await axios.get(`/group-chat/history/${currentGroupId}`, {
      headers: { Authorization: localStorage.getItem('token') }
    });

    const box = document.getElementById('group-chat-messages');
    box.innerHTML = '';
    res.data.messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true // set to false if you want 24-hour format
});
      const div = document.createElement('div');
      div.className = 'chat-bubble';
      div.innerHTML = `<strong>${msg.sender.name}</strong>: ${msg.text} <span class="chat-time">${time}</span>`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  } catch (err) {
    showToast('Failed to load group chat', false);
  }
}

document.getElementById('group-chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('group-chat-input').value;
  if (!text || !currentGroupId) return;

  try {
    await axios.post(`/group-chat/send/${currentGroupId}`, { text }, {
      headers: { Authorization: localStorage.getItem('token') }
    });
    document.getElementById('group-chat-input').value = '';
    await loadGroupMessages();
  } catch (err) {
    showToast('Failed to send message', false);
  }
});










async function createGroup(name, memberEmails ) {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post('/groups/create', { name, memberEmails }, {
      headers: { Authorization: token }
    });
    showToast(`Group "${name}" created!`, true);
    if (res.data.notFoundEmails && res.data.notFoundEmails.length > 0) {
      alert(`These emails were not found: ${res.data.notFoundEmails.join(', ')}`);
    }

    await loadMyGroups();
  } catch (err) {
    showToast('Failed to create group', false);
  }
}

async function loadMyGroups() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/groups/my-groups', {
      headers: { Authorization: token }
    });
    renderGroups(res.data.groups);
  } catch (err) {
    showToast('Failed to load groups', false);
  }
}

function renderGroups(groups) {
  const container = document.getElementById('my-groups');
  container.innerHTML = '';

  groups.forEach(group => {
    const isAdmin = group.admin._id === currentUserId;
    const div = document.createElement('div');
    div.className = 'group-card';
    div.innerHTML = `
      <h4>${group.name}</h4>
      <p>Admin: ${group.admin.name}</p>
      <p>Members: ${group.members.length}</p>
      <button onclick="viewGroupMembers('${group._id}')">View Members</button>
      <button onclick="openGroupChat('${group._id}', '${group.name}')">Open Chat</button>
      ${isAdmin ? `
        <button onclick="promptAddToGroup('${group._id}')">Add Member</button>
        <button onclick="promptRemoveFromGroup('${group._id}', '${group.name}')">Remove Member</button>
        <button onclick="deleteGroup('${group._id}')">Delete</button>
      ` : `<button onclick="leaveGroup('${group._id}')">Leave</button>`}
    `;
    container.appendChild(div);
  });
}


function promptAddToGroup(groupId) {
  const email = prompt('Enter the email of the user to add:');
  if (!email) return;
  axios.post(`/groups/add/${groupId}`, { email }, {
    headers: { Authorization: localStorage.getItem('token') }
  }).then(() => {
    showToast('User added to group!', true);
    loadMyGroups();
  }).catch(() => showToast('Failed to add user', false));
}

function promptRemoveFromGroup(groupId, groupName) {
  const email = prompt(`Enter the email of the user to remove from "${groupName}":`);
  if (!email) return;
  axios.post(`/groups/remove/${groupId}`, { email }, {
    headers: { Authorization: localStorage.getItem('token') }
  }).then(() => {
    showToast('User removed from group!', true);
    loadMyGroups();
  }).catch(() => showToast('Failed to remove user', false));
}


async function viewGroupMembers(groupId) {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/groups/members/${groupId}`, {
      headers: { Authorization: token }
    });

    const membersList = document.getElementById('group-members-list');
    membersList.innerHTML = res.data.members.map(m =>
      `<li>${m.name} (${m.email})</li>`).join('');
    document.getElementById('group-members-modal').classList.remove('hidden');
  } catch (err) {
    showToast('Failed to fetch members', false);
  }
}

async function leaveGroup(groupId) {
  if (!confirm('Are you sure you want to leave the group?')) return;
  try {
    const token = localStorage.getItem('token');
    await axios.post(`/groups/leave/${groupId}`, {}, {
      headers: { Authorization: token }
    });
    showToast('Left the group', true);
    await loadMyGroups();
  } catch (err) {
    showToast('Failed to leave group', false);
  }
}

async function deleteGroup(groupId) {
  if (!confirm('Are you sure you want to delete this group?')) return;
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`/groups/delete/${groupId}`, {
      headers: { Authorization: token }
    });
    showToast('Group deleted!', true);
    await loadMyGroups();
  } catch (err) {
    showToast('Failed to delete group', false);
  }
}






let inlineSuggestion = '';
const input = document.getElementById('chat-input');
const suggestionDiv = document.getElementById('inline-suggestion');

input.addEventListener('input', () => {
  const text = input.value;
  const lastWord = text.split(' ').pop().toLowerCase();

  if (lastWord.length < 2) {
    inlineSuggestion = '';
    suggestionDiv.textContent = '';
    return;
  }

  const match = [...new Set([...currentChatWords, ...globalWords])]
    .find(word => word.startsWith(lastWord) && word !== lastWord);

  if (match) {
    inlineSuggestion = match.slice(lastWord.length);
    suggestionDiv.textContent = text + inlineSuggestion;
  } else {
    inlineSuggestion = '';
    suggestionDiv.textContent = '';
  }
});

// 🟡 On TAB or → key
input.addEventListener('keydown', (e) => {
  if ((e.key === 'Tab' || e.key === 'ArrowRight') && inlineSuggestion) {
    e.preventDefault();
    input.value += inlineSuggestion;
    inlineSuggestion = '';
    suggestionDiv.textContent = '';
  }
});





let globalWords = [];
let currentChatWords = [];

// Fetch words from backend on page load
async function fetchSuggestionWords() {
  const token = localStorage.getItem('token');
  const res = await axios.get('/chat/suggestions', {
    headers: { Authorization: token }
  });
  globalWords = res.data.global;
  currentChatWords = res.data.current || [];
}

// Attach once DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await fetchSuggestionWords();
});

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const suggestWords = debounce((e) => {
  const input = e.target.value.toLowerCase().trim();
  const wordsTyped = input.split(/\s+/); // all current words
  const lastWord = wordsTyped[wordsTyped.length - 1];

  const uniqueSuggestions = new Set();

  if (!lastWord || lastWord.length < 2) {
    document.getElementById('chat-suggestions').innerHTML = '';
    return;
  }

  // Match from both sources
  const allSources = [...currentChatWords, ...globalWords];
  allSources.forEach(word => {
    if (word.startsWith(lastWord)) {
      uniqueSuggestions.add(word);
    }
  });

  const matches = Array.from(uniqueSuggestions).slice(0, 5); // limit to 5
  const suggestionBox = document.getElementById('chat-suggestions');
  suggestionBox.innerHTML = matches.map(w => `<div onclick="selectSuggestion('${w}')">${w}</div>`).join('');
}, 300);


document.getElementById('chat-input').addEventListener('input', suggestWords);

function selectSuggestion(word) {
  const input = document.getElementById('chat-input');
  const words = input.value.split(' ');
  words.pop();
  words.push(word);
  input.value = words.join(' ') + ' ';
  document.getElementById('chat-suggestions').innerHTML = '';
}


// ✅ Load Posts
async function loadPosts() {
  const token = localStorage.getItem('token');
  try {
    const res = await axios.get('/posts/all', {
      headers: { Authorization: token }
    });
    allPosts = res.data.posts;
    // console.log("📦 Posts from backend:", res.data.posts);
    // res.data.posts.forEach(p => {
    //  console.log(`Post by ${p.author.name} (${p.author._id}): requestStatus = ${p.requestStatus}, canCancel = ${p.canCancel}`);
    // });
    // console.log("Posts from backend:", allPosts);
    // console.log("Current User ID:", currentUserId);
    currentUserId = res.data.currentUserId;
    renderPosts(allPosts);
    updateFriendsList();
  } catch (err) {
    showToast('Failed to load posts', false);
  }
}



function renderPosts(posts) {
  const feed = document.getElementById('post-feed');
  feed.innerHTML = '';
console.log("acceptedFriends (in renderPosts start):", acceptedFriends);
  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';

    const postOwner = post.author._id;
    const isFriend = acceptedFriends.some(f => f._id === postOwner); // Keep this for clarity, though `post.requestStatus === 'accepted'` would also imply it
    console.log(`--- Post by ${post.author.name} (ID: ${postOwner}) ---`);
    console.log(`  isFriend: ${isFriend}`);
    console.log(`  post.requestStatus: ${post.requestStatus}`);
    console.log(`  post.canCancel: ${post.canCancel}`);

    let inlineActionBtn = '';
    let commentSectionActionBtn = '';

    // Show delete button only for own posts
    if (postOwner === currentUserId) {
      commentSectionActionBtn = `<button onclick="deletePost('${post._id}')">Delete</button>`;
    } 
    // else if (post.requestStatus === 'accepted') { // If they are accepted friends
    //     // No action button needed here usually, maybe "Message"
    //     inlineActionBtn = `<button onclick="openChat('${postOwner}', '${post.author.name}')">Message</button>`;
    //     commentSectionActionBtn = inlineActionBtn;
    // } 
   else if (post.canCancel) {
  inlineActionBtn = `<button onclick="cancelRequest('${postOwner}')">Cancel Request</button>`;
} else if (post.requestStatus === 'none' || post.requestStatus === 'rejected') {
  inlineActionBtn = `<button onclick="sendRequest('${postOwner}')">Send Request</button>`;
}

    // You might want a specific display for 'incoming_pending' to show "Accept/Ignore" on the post itself,
    // but typically that's handled in the requests list. For posts, "Send Request" might be okay.

    card.innerHTML = `
      <p><strong>${post.author.name}</strong> ${inlineActionBtn}</p>
      <p>${post.content}</p>
      <p><em>Skills: ${post.skills.join(', ')}</em></p>
      <button onclick="toggleLike('${post._id}')">❤️ (${post.likes.length})</button>
      <button onclick="toggleCommentBox('${post._id}')">💬 (${post.comments.length})</button>
      <div id="comments-${post._id}" class="comment-section" style="display: none;">
        <input type="text" placeholder="Add a comment" id="comment-input-${post._id}">
        <button onclick="addComment('${post._id}')">Post</button>
        ${commentSectionActionBtn}
        <div id="comment-list-${post._id}">
          ${post.comments.map(c => `<p><strong>${c.user.name || 'User'}:</strong> ${c.text}</p>`).join('')}
        </div>
      </div>
    `;

    feed.appendChild(card);
  });
}


async function cancelRequest(toUserId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to cancel this request?')) return;

  try {
    await axios.delete(`/exchange/cancel/${toUserId}`, {
      headers: { Authorization: token }
    });
    showToast('Request canceled!', true);
    await loadPosts();
    await loadRequests();
  } catch (err) {
    showToast('Failed to cancel request', false);
  }
}



async function loadRequests() {
  const token = localStorage.getItem('token');
  try {
    const res = await axios.get('/exchange/requests', {
      headers: { Authorization: token }
    });

    const incomingContainer = document.getElementById('incoming-requests');
    const outgoingContainer = document.getElementById('outgoing-requests');
    incomingContainer.innerHTML = '';
    outgoingContainer.innerHTML = '';

    acceptedFriends = [];

    res.data.incoming.forEach(req => {
      if (req.status === 'accepted') {
        acceptedFriends.push(req.fromUser);
        // ✅ Show status instead of accept/ignore buttons
        const statusCard = document.createElement('div');
        statusCard.className = 'card';
        statusCard.innerHTML = `
          <p><strong>From:</strong> ${req.fromUser.name}</p>
          <p>Status: <strong>Accepted</strong></p>
        `;
        incomingContainer.appendChild(statusCard);
        return;
      }

      if (req.status === 'rejected') {
        // ✅ Show status instead of buttons
        const statusCard = document.createElement('div');
        statusCard.className = 'card';
        statusCard.innerHTML = `
          <p><strong>From:</strong> ${req.fromUser.name}</p>
          <p>Status: <strong>Ignored</strong></p>
        `;
        incomingContainer.appendChild(statusCard);
        return;
      }

      // ⛔ Only show pending requests with buttons
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <p><strong>From:</strong> ${req.fromUser.name}</p>
        <p>${req.message || 'No message provided'}</p>
        <button onclick="acceptRequest('${req._id}')">Accept</button>
        <button onclick="ignoreRequest('${req._id}')">Ignore</button>
      `;
      incomingContainer.appendChild(card);
    });

    res.data.outgoing.forEach(req => {
      if (req.status === 'accepted') {
        acceptedFriends.push(req.toUser);
      }

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <p><strong>To:</strong> ${req.toUser.name}</p>
        <p>Status: <strong>${req.status}</strong></p>
      `;
      outgoingContainer.appendChild(card);
    });

    updateFriendsList();
  } catch (err) {
    showToast('Failed to load requests', false);
  }
}


function updateFriendsList() {
  const container = document.getElementById('friends-list');
  container.innerHTML = '';

  const maxToShow = 5;
  let isExpanded = false;

  const render = () => {
    container.innerHTML = '';
    const list = document.createElement('div');

    const usersToShow = isExpanded ? acceptedFriends : acceptedFriends.slice(0, maxToShow);

    usersToShow.forEach((user, index) => {
      const div = document.createElement('div');
      div.className = 'friend-entry';

      div.innerHTML = `
        <i class="fas fa-circle-user fa-2x"></i>
        <span class="name">${index + 1}. ${user.name}</span>
        <button onclick="openChat('${user._id}')">Message</button>
      `;

      list.appendChild(div);
    });

    container.appendChild(list);

    if (acceptedFriends.length > maxToShow) {
      const toggle = document.createElement('a');
      toggle.href = '#';
      toggle.textContent = isExpanded ? 'Show Less' : 'Show More';
      toggle.style.display = 'block';
      toggle.style.marginTop = '10px';
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        isExpanded = !isExpanded;
        render();
      });
      container.appendChild(toggle);
    }
  };

  render();
}


// ✅ Send Request
async function sendRequest(toUserId) {
  const token = localStorage.getItem('token');
  try {
    await axios.post('/exchange/send', { toUser: toUserId }, {
      headers: { Authorization: token }
    });
    showToast('Request sent!', true);
    await loadPosts();
    await loadRequests();
  } catch (err) {
    showToast('Request failed', false);
  }
}

// ✅ Accept / Ignore Request
async function acceptRequest(requestId) {
  const token = localStorage.getItem('token');
  try {
    await axios.patch(`/exchange/${requestId}/accept`, { status: 'accepted' }, {
      headers: { Authorization: token }
    });
    showToast('Request accepted!', true);
    await loadPosts();
    await loadRequests();
  } catch (err) {
    showToast('Accept failed', false);
  }
}

async function ignoreRequest(requestId) {
  const token = localStorage.getItem('token');
  try {
    await axios.patch(`/exchange/${requestId}/reject`, { status: 'rejected' }, {
      headers: { Authorization: token }
    });
    showToast('Request ignored!', true);
    await loadPosts();
    await loadRequests();
  } catch (err) {
    showToast('Ignore failed', false);
  }
}

// ✅ Delete Post
async function deletePost(postId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to delete this post?')) return;

  try {
    await axios.delete(`/posts/${postId}`, {
      headers: { Authorization: token }
    });
    notify({ type: 'success', message: 'Post deleted!' });
    await loadPosts();
  } catch (err) {
    console.log(err.response?.data || err.message);
    showToast('Failed to delete post', false);
  }
}
//like and comment
async function toggleLike(postId) {
  const token = localStorage.getItem('token');
  await axios.post(`/posts/${postId}/like`, {}, {
    headers: { Authorization: token }
  });
  await loadPosts();
}

function toggleCommentBox(postId) {
  const box = document.getElementById(`comments-${postId}`);
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

async function addComment(postId) {
  const token = localStorage.getItem('token');
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  await axios.post(`/posts/${postId}/comment`, { text }, {
    headers: { Authorization: token }
  });

  input.value = '';
  await loadPosts();
}


// ✅ Placeholder for chat
let currentChatUserId = null;

// ✅ Open chat modal
let chatPollingInterval;

async function openChat(friendId, friendName = 'Friend') {
  currentChatUserId = friendId;
  document.getElementById('chat-title').textContent = `Chat with ${friendName}`;
  document.getElementById('chat-modal').classList.remove('hidden');

  // Load chat and start polling
  await loadChatMessages();

  chatPollingInterval = setInterval(loadChatMessages, 1000); // every 1 seconds
}




function formatDateHeader(date) {
  const now = new Date();
  const msgDate = new Date(date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  if (msgDay.getTime() === today.getTime()) return 'Today';
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday';

  return msgDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}


let previousMessageCount = 0;
async function loadChatMessages() {
  if (!currentChatUserId) return;
  try {
    const res = await axios.get(`/chat/history/${currentChatUserId}`, {
      headers: { Authorization: localStorage.getItem('token') }
    });

    const messages = res.data.messages;
    const box = document.getElementById('chat-messages');


        // Don't re-render if message count didn't change
    if (messages.length === previousMessageCount) return;
    previousMessageCount = messages.length;

    // Save scroll position
    const shouldScroll = (box.scrollTop + box.clientHeight >= box.scrollHeight - 100);


    box.innerHTML = '';

    let lastDate = '';

    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp);
      const dateHeader = formatDateHeader(msgDate);

      if (dateHeader !== lastDate) {
        const divider = document.createElement('div');
        divider.className = 'chat-date-divider';
        divider.textContent = dateHeader;
        box.appendChild(divider);
        lastDate = dateHeader;
      }

      const time = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgElem = document.createElement('div');
      msgElem.className = 'chat-bubble';
      msgElem.innerHTML = `
        <strong>${msg.sender.name}</strong><br>
        ${msg.text}
        <span class="chat-time">${time}</span>
      `;

      box.appendChild(msgElem);
    });

    if (shouldScroll) {
      box.scrollTop = box.scrollHeight;
    }

  } catch (err) {
    showToast('Failed to load chat', false);
  }
}







// ✅ Send message
document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('chat-input').value;
  if (!text || !currentChatUserId) return;

  try {
    await axios.post('/chat/send', {
      text,
      receiver: currentChatUserId
    }, {
      headers: { Authorization: localStorage.getItem('token') }
    });

    document.getElementById('chat-input').value = '';
    openChat(currentChatUserId); // Refresh chat
  } catch (err) {
    showToast('Failed to send message', false);
  }
});

function closeChat() {
  document.getElementById('chat-modal').classList.add('hidden');
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}













// ✅ DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = '/auth/login';

  try {
    const res = await axios.get('/user/profile', {
      headers: { Authorization: token }
    });
    const user = res.data.user;
    currentUserId = user._id;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
  } catch (err) {
    showToast('Failed to load user info', false);
  }

  document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('post-content').value;
    const skills = document.getElementById('post-skills').value.split(',').map(s => s.trim());

    try {
      await axios.post('/posts/create', { content, skills }, {
        headers: { Authorization: token }
      });
      notify({ type: 'success', message: 'Post created!' });
      document.getElementById('post-form').reset();
      await loadPosts();
    } catch (err) {
      showToast('Failed to create post', false);
    }
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allPosts.filter(p =>
      p.skills.some(skill => skill.toLowerCase().includes(keyword))
    );
    renderPosts(filtered);
  });

  document.getElementById('create-group-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('group-name').value.trim();
  const memberEmailsInput = document.getElementById('group-members').value.trim();
  
  const memberEmails = memberEmailsInput
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0 && email.includes('@'));

  if (!name) {
    return showToast('Group name is required', false);
  }

  await createGroup(name, memberEmails);
  document.getElementById('create-group-form').reset();
});


  await loadRequests();
  await loadPosts();
 await loadMyGroups(); // ✅ new

  
});

// ✅ Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/auth/login';
});


