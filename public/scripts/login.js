document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post('/auth/login', { email, password });

    localStorage.setItem('token', res.data.token);
    notify({ type: 'success', message: 'Login successful!' });


        // Fetch user profile
    const profile = await axios.get('/user/profile', {
      headers: { Authorization: 'Bearer ' + res.data.token }
    });

    const user = profile.data.user;
    setTimeout(() => {
      if (!user.skillsToTeach.length || !user.skillsToLearn.length) {
        window.location.href = '/user/update-profile';
      } else {
        window.location.href = '/explore';
      }
    }, 1500);

  } catch (err) {
    const msg = err.response?.data?.message || 'Login failed';
    notify({ type: 'error', message: msg });
  }
});
