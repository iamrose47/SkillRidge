document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const bio = document.getElementById('bio').value;
  const location = document.getElementById('location').value;
  const skillsToTeach = document.getElementById('skillsToTeach').value.split(',').map(s => s.trim());
  const skillsToLearn = document.getElementById('skillsToLearn').value.split(',').map(s => s.trim());

  try {
    await axios.put('/user/update-profile', {
      bio, location, skillsToTeach, skillsToLearn
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    notify({ type: 'success', message: 'Profile updated!' });
    
    setTimeout(() => window.location.href = '/explore', 1500);
  } catch (err) {
    const msg = err.response?.data?.message || 'Update failed';
    showToast(msg, false);
  }
});
